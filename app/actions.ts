'use server'

import { checkRecentApplications, expiryFrom, saveApplication, type ApplyState } from '../src/application'
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
  const concern = [...new Set(formData.getAll('concern').map(value => String(value).trim()).filter(Boolean))].join(', ')
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
  // 이메일이 없어도 전화로 확인 결과를 안내할 수 있다.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '이메일 주소를 확인하거나 비워 주세요.'
  }
  if (!agreed) errors.agree = '동의에 체크해 주세요.'
  if (formData.get('overseasAgree') == null) errors.overseasAgree = '개인정보 국외 이전에 동의해 주세요.'
  for (const [name, limit] of Object.entries({ address: 300, condition: 3000, taxNote: 2000, contact: 50, email: 254, acquisition: 100, ownership: 100, concern: 100, speed: 200, channel: 100 })) {
    if ((name === 'concern' ? concern : text(name)).length > limit) errors[name] = `입력 내용을 ${limit}자 이내로 줄여 주세요.`
  }
  if (photoEntries.length > MAX_PHOTOS) errors.photos = '사진은 최대 6장까지 첨부해 주세요.'
  if (photoEntries.length && formData.get('photoAgree') == null) errors.photoAgree = '사진 이용에 동의하거나 첨부 사진을 삭제해 주세요.'
  // 화면에 보이지 않는 칸이다. 사람이 채울 일이 없으니 값이 있으면 봇으로 본다.
  if (text('website')) return { ok: false, errors: {}, message: '접수할 수 없는 입력입니다.' }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: null }
  }

  const now = new Date()
  const recent = await checkRecentApplications(contact, address, now)
  if (recent === 'duplicate') return { ok: true, errors: {}, message: null }
  if (recent === 'limited') {
    return { ok: false, errors: {}, message: '이 번호로 신청이 여러 번 들어와 잠시 접수를 멈췄어요. 앞서 보내주신 신청은 담당자가 확인하고 있어요. 더 남길 내용은 010-7428-2624로 알려주세요.' }
  }

  let photos: PreparedPhoto[] = []
  try { photos = await preparePhotos(photoEntries) }
  catch (e) { return { ok: false, errors: { photos: e instanceof Error ? e.message : '사진을 확인하지 못했어요.' }, message: null } }
  if (photos.length && !supabaseConfigured()) {
    return { ok: false, errors: { photos: '현재 사진 접수를 준비하고 있어요. 사진을 삭제하고 신청하거나 전화로 문의해 주세요.' }, message: null }
  }

  let applicationId: string | null = null
  try {
    const saved = await saveApplication({
      address,
      condition: [text('condition'), text('taxNote')].filter(Boolean).join('\n\n') || null,
      acquisition: text('acquisition') || null,
      ownership: text('ownership') || null,
      concern: concern || null,
      speed: text('speed') || null,
      channel: channel || null,
      contact,
      email: email || null,
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
