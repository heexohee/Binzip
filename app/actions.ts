'use server'

import { expiryFrom, saveApplication, type ApplyState } from '../src/application'
import { createDraftReport } from '../src/report'
import { preparePhotos, type PreparedPhoto } from '../src/photos'
import { MAX_PHOTOS } from '../src/photo-limits'
import { supabaseConfigured } from '../src/supabase'

/** 필수는 주소·연락처·동의 셋뿐. 오류 문구는 사과하지 않고 무엇을 하면 되는지만 쓴다. */
export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const text = (name: string) => String(formData.get(name) ?? '').trim()

  const address = text('address')
  const contact = text('contact')
  const channel = text('channel')
  const email = text('email')
  const agreed = formData.get('agree') != null
  const photoEntries = formData.getAll('photos')


  const errors: Record<string, string> = {}
  if (!address) errors.address = '주소를 적어 주세요.'
  // 전화번호는 항상 받는다. 진단서 발송이 실패해도 닿을 수단이 하나는 있어야 한다.
  if (!contact) {
    errors.contact = '연락받을 전화번호를 적어 주세요.'
  } else if (contact.replace(/\D/g, '').length < 9) {
    errors.contact = '전화번호를 다시 확인해 주세요. 예) 010-0000-0000'
  }
  // 이메일은 항상 받는다. 문자 발송은 발신번호 사전등록이 필요해 MVP 에서 불가능하므로,
  // 진단서를 실제로 보낼 수 있는 경로가 이메일뿐이다.
  if (!email) {
    errors.email = '진단서를 받으실 이메일 주소를 적어 주세요.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '이메일 주소를 다시 확인해 주세요. 예) name@example.com'
  }
  if (!agreed) errors.agree = '동의에 체크해 주세요.'
  for (const [name, limit] of Object.entries({ address: 300, condition: 3000, contact: 50, email: 254, acquisition: 100, ownership: 100, concern: 100, speed: 200, channel: 100 })) {
    if (text(name).length > limit) errors[name] = `입력 내용을 ${limit}자 이내로 줄여 주세요.`
  }
  if (photoEntries.length > MAX_PHOTOS) errors.photos = '사진은 최대 6장까지 첨부해 주세요.'
  if (photoEntries.length && formData.get('photoAgree') == null) errors.photoAgree = '사진 이용에 동의하거나 첨부 사진을 삭제해 주세요.'
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: null }
  }

  let photos: PreparedPhoto[] = []
  try { photos = await preparePhotos(photoEntries) }
  catch (e) { return { ok: false, errors: { photos: e instanceof Error ? e.message : '사진을 확인하지 못했어요.' }, message: null } }
  if (photos.length && !supabaseConfigured()) {
    return { ok: false, errors: { photos: '현재 사진 접수를 준비하고 있어요. 사진을 삭제하고 신청하거나 전화로 문의해 주세요.' }, message: null }
  }

  const now = new Date()
  let applicationId: string | null = null
  try {
    const saved = await saveApplication({
      address,
      condition: text('condition') || null,
      acquisition: text('acquisition') || null,
      ownership: text('ownership') || null,
      concern: text('concern') || null,
      speed: text('speed') || null,
      channel: channel || null,
      contact,
      email,
      createdAt: now.toISOString(),
      expiresAt: expiryFrom(now),
      pnu: text('pnu') || null,
      resolvedAddress: text('resolvedAddress') || null,
      matchQuality: parseQuality(text('matchQuality')),
    }, photos)
    applicationId = saved.applicationId
  } catch {
    return {
      ok: false,
      errors: {},
      message: '전송되지 않았습니다. 다시 눌러주시거나 010-7428-2624로 연락 주세요.',
    }
  }

  // 신청이 남은 뒤에만 판정을 돌린다. 판정이 실패해도 신청은 이미 안전하다.
  if (applicationId) {
    await createDraftReport(applicationId, address)
  }

  return { ok: true, errors: {}, message: null }
}

/** 화면에서 온 값은 신뢰하지 않는다. 정해진 셋 중 하나가 아니면 버린다. */
function parseQuality(v: string): 'exact' | 'road' | 'fuzzy' | null {
  return v === 'exact' || v === 'road' || v === 'fuzzy' ? v : null
}
