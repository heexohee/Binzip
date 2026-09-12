'use client'

import { useEffect, useRef, useState } from 'react'
import { MAX_PHOTOS, MAX_PHOTO_BYTES, PHOTO_EDGE, PHOTO_TYPES } from '../src/photo-limits'
import styles from './photo-picker.module.css'

type Photo = { id: string; file: File; url: string }

async function compress(file: File): Promise<File> {
  if (!PHOTO_TYPES.some(t => t === file.type)) throw new Error('JPG·PNG·WebP 사진을 골라 주세요. HEIC 사진은 JPG로 저장한 뒤 첨부할 수 있어요.')
  if (file.size > 20 * 1024 * 1024) throw new Error('원본 사진은 한 장당 20MB 이하로 골라 주세요.')
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    if (!img.naturalWidth || img.naturalWidth * img.naturalHeight > 40_000_000) throw new Error('too-large')
    const scale = Math.min(1, PHOTO_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= MAX_PHOTO_BYTES) return new File([blob], 'house-photo.jpg', { type: 'image/jpeg' })
    }
    throw new Error('size')
  } catch {
    throw new Error('사진을 읽거나 용량을 줄이지 못했어요. 더 작은 JPG·PNG·WebP 사진으로 다시 골라 주세요.')
  } finally { URL.revokeObjectURL(url) }
}

export function PhotoPicker({ onChange, onBusyChange, disabled, error }: {
  onChange: (photos: File[]) => void; onBusyChange: (busy: boolean) => void; disabled: boolean; error?: string
}) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const live = useRef<Photo[]>([])
  const busyRef = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; live.current.forEach(p => URL.revokeObjectURL(p.url)) } }, [])

  function update(next: Photo[]) { live.current = next; setPhotos(next); onChange(next.map(p => p.file)) }
  async function select(input: HTMLInputElement) {
    if (busyRef.current || disabled) return
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (!files.length) return
    setMessage('')
    if (photos.length + files.length > MAX_PHOTOS) { setMessage('사진은 모두 합쳐 6장까지 골라 주세요.'); return }
    busyRef.current = true; setBusy(true); onBusyChange(true)
    try {
      const compressed: File[] = []
      for (const file of files) compressed.push(await compress(file))
      if (mounted.current) update([...live.current, ...compressed.map(file => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))])
    } catch (e) { if (mounted.current) setMessage(e instanceof Error ? e.message : '사진을 준비하지 못했어요.') }
    finally { busyRef.current = false; if (mounted.current) { setBusy(false); onBusyChange(false) } }
  }

  return <fieldset className={styles.picker} disabled={disabled || busy}>
    <legend>집 사진도 함께 보내주세요 <span>선택</span></legend>
    <p id="photo-help" className={styles.help}>집 전체 · 지붕과 처마 · 벽 · 출입구 · 진입로가 보이면 좋아요.<br />안전한 곳에서 찍은 사진만 보내주세요.</p>
    <label className={styles.add}>
      <span aria-hidden="true">＋</span> 사진 고르기 <span>{photos.length} / {MAX_PHOTOS}</span>
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => void select(e.currentTarget)} aria-label="집 사진 첨부" aria-describedby="photo-help photo-status" />
    </label>
    {photos.length > 0 && <ul className={styles.grid}>{photos.map((p, index) => <li key={p.id}>
      {/* Object URLs are local-only previews; no remote image optimizer is involved. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.url} alt={`첨부할 집 사진 ${index + 1}`} />
      <div><span>사진 {index + 1}</span><button type="button" onClick={() => { URL.revokeObjectURL(p.url); update(photos.filter(x => x.id !== p.id)) }} aria-label={`사진 ${index + 1} 삭제`}>삭제</button></div>
    </li>)}</ul>}
    <p id="photo-status" role="status" className={styles.help}>{busy ? '사진 용량을 줄이고 있어요…' : photos.length ? `${photos.length}장 선택했어요. 신청하기를 누르면 함께 전송돼요.` : 'JPG·PNG·WebP, 최대 6장. 사진 크기는 자동으로 줄여요.'}</p>
    {(message || error) && <p role="alert" className={styles.error}>{message || error}</p>}
    <p className={styles.help}>얼굴·차량번호·문서 내용은 가려주세요. 촬영 위치정보는 저장 전에 제거해요. 사진만으로 건물 안전성·석면·철거비를 확정하지 않아요.</p>
  </fieldset>
}
