'use server'

import { expiryFrom, saveApplication, type ApplyState } from '../src/application'

/** 필수는 주소·연락처·동의 셋뿐. 오류 문구는 사과하지 않고 무엇을 하면 되는지만 쓴다. */
export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const text = (name: string) => String(formData.get(name) ?? '').trim()

  const address = text('address')
  const contact = text('contact')
  const agreed = formData.get('agree') != null

  const errors: Record<string, string> = {}
  if (!address) errors.address = '주소를 적어 주세요.'
  if (!contact) {
    errors.contact = '연락받을 번호나 이메일 주소를 적어 주세요.'
  } else {
    // 어느 쪽을 골랐든 값으로 판별한다. 라디오를 안 고른 사람도 접수돼야 한다.
    const looksLikeEmail = contact.includes('@')
    if (looksLikeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      errors.contact = '이메일 주소를 다시 확인해 주세요. 예) name@example.com'
    } else if (!looksLikeEmail && contact.replace(/\D/g, '').length < 9) {
      errors.contact = '연락받을 번호를 다시 확인해 주세요. 예) 010-0000-0000'
    }
  }
  if (!agreed) errors.agree = '동의에 체크해 주세요.'
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: null }
  }

  const now = new Date()
  try {
    await saveApplication({
      address,
      condition: text('condition') || null,
      possession: text('possession') || null,
      channel: text('channel') || null,
      contact,
      createdAt: now.toISOString(),
      expiresAt: expiryFrom(now),
      pnu: text('pnu') || null,
      resolvedAddress: text('resolvedAddress') || null,
      matchQuality: parseQuality(text('matchQuality')),
    })
  } catch {
    return {
      ok: false,
      errors: {},
      message: '전송되지 않았습니다. 다시 눌러주시거나 010-7428-2624로 연락 주세요.',
    }
  }

  return { ok: true, errors: {}, message: null }
}

/** 화면에서 온 값은 신뢰하지 않는다. 정해진 셋 중 하나가 아니면 버린다. */
function parseQuality(v: string): 'exact' | 'road' | 'fuzzy' | null {
  return v === 'exact' || v === 'road' || v === 'fuzzy' ? v : null
}
