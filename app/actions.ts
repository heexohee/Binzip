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
  const channel = text('channel')
  const email = text('email')
  const agreed = formData.get('agree') != null
  const wantsEmail = channel === '이메일로 받겠습니다'

  const errors: Record<string, string> = {}
  if (!address) errors.address = '주소를 적어 주세요.'
  // 전화번호는 항상 받는다. 진단서 발송이 실패해도 닿을 수단이 하나는 있어야 한다.
  if (!contact) {
    errors.contact = '연락받을 전화번호를 적어 주세요.'
  } else if (contact.replace(/\D/g, '').length < 9) {
    errors.contact = '전화번호를 다시 확인해 주세요. 예) 010-0000-0000'
  }
  if (!channel) errors.channel = '진단서를 어디로 보내드릴지 골라 주세요.'
  if (wantsEmail) {
    if (!email) {
      errors.email = '진단서를 받으실 이메일 주소를 적어 주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '이메일 주소를 다시 확인해 주세요. 예) name@example.com'
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
      acquisition: text('acquisition') || null,
      ownership: text('ownership') || null,
      concern: text('concern') || null,
      speed: text('speed') || null,
      channel: channel || null,
      contact,
      email: wantsEmail ? email : null,
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
