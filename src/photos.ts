import sharp from 'sharp'
import { sbSelect } from './supabase'
import { MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_PHOTO_TOTAL_BYTES, PHOTO_EDGE, PHOTO_TYPES, UUID_PATTERN } from './photo-limits'

export type PreparedPhoto = { content: string; width: number; height: number; size: number }
export type PhotoMeta = { id: string; position: number; width: number; height: number }

/** Decode every image on the server, rotate and re-encode without EXIF/GPS or filenames. */
export async function preparePhotos(entries: FormDataEntryValue[]): Promise<PreparedPhoto[]> {
  if (entries.length > MAX_PHOTOS) throw new Error('사진은 최대 6장까지 첨부해 주세요.')
  let total = 0
  for (const file of entries) {
    if (!(file instanceof File) || !PHOTO_TYPES.some(t => t === file.type)) throw new Error('JPG·PNG·WebP 사진만 첨부할 수 있어요.')
    if (!file.size || file.size > MAX_PHOTO_BYTES) throw new Error('사진 용량을 줄인 뒤 다시 첨부해 주세요.')
    total += file.size
  }
  if (total > MAX_PHOTO_TOTAL_BYTES) throw new Error('첨부한 사진의 전체 용량이 너무 커요.')
  const photos: PreparedPhoto[] = []
  for (const entry of entries) {
    const file = entry as File
    try {
      const input = Buffer.from(await file.arrayBuffer())
      const meta = await sharp(input, { limitInputPixels: 40_000_000, failOn: 'warning' }).metadata()
      if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '') || (meta.pages ?? 1) > 1) throw new Error('format')
      const { data, info } = await sharp(input, { limitInputPixels: 40_000_000, failOn: 'warning' })
        .rotate().resize(PHOTO_EDGE, PHOTO_EDGE, { fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#fff' }).jpeg({ quality: 75 }).timeout({ seconds: 5 }).toBuffer({ resolveWithObject: true })
      if (data.length > MAX_PHOTO_BYTES) throw new Error('size')
      photos.push({ content: data.toString('base64'), width: info.width, height: info.height, size: data.length })
    } catch {
      throw new Error('읽을 수 없는 사진이 있어요. 해당 사진을 JPG·PNG·WebP로 다시 저장해 주세요.')
    }
  }
  return photos
}

export async function listPhotos(applicationId: string): Promise<PhotoMeta[]> {
  if (!UUID_PATTERN.test(applicationId)) return []
  return sbSelect<PhotoMeta>('application_photos?select=id,position,width,height&application_id=eq.' + applicationId + '&order=position.asc')
}

/** Both routes must establish access to this application before calling this function. */
export async function photoResponse(applicationId: string, photoId: string): Promise<Response> {
  if (!UUID_PATTERN.test(applicationId) || !UUID_PATTERN.test(photoId)) return new Response(null, { status: 404 })
  const rows = await sbSelect<{ content: string }>('application_photos?select=content&application_id=eq.' + applicationId + '&id=eq.' + photoId + '&limit=1')
  const content = rows[0]?.content
  if (!content || !/^\\x(?:[0-9a-f]{2})+$/i.test(content)) return new Response(null, { status: 404 })
  return new Response(new Uint8Array(Buffer.from(content.slice(2), 'hex')), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' },
  })
}
