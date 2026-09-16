export type Role = 'customer' | 'expert'
export type Kind = '철거' | '매도'
export const stages = ['상담 요청', '상담 진행', '견적·제안', '계약 협의', '진행 중', '완료 확인', '완료'] as const
export const providerFor = (kind: Kind) => kind === '철거' ? '포항 다부서철거 대행' : '다파라 공인중개사'
export type Consultation = {
  version: 1; id: string; kind: Kind; provider: string; stage: number
  createdAt: string; updatedAt: string
  quote?: { amount: number; scope: string }
  contact?: { method: 'phone' | 'chat'; phone: string; availability: string }
  visit?: { proposalId: string; slots: string[]; fee: number; preparations: string; status: 'proposed' | 'selected' | 'confirmed' | 'change-requested'; selected?: string }
  entries: { role: Role | 'system'; text: string; at: string; event?: boolean; automated?: boolean }[]
}
export type Action =
  | { type: 'accept' | 'discuss' | 'contract' | 'complete' }
  | { type: 'message' | 'finish'; text: string }
  | { type: 'quote'; amount: number; scope: string }
  | { type: 'contact'; method: 'phone' | 'chat'; phone: string; availability: string }
  | { type: 'propose-visit'; proposalId: string; slots: string[]; fee: number; preparations: string }
  | { type: 'select-visit'; proposalId: string; slot: string; feeAccepted: boolean }
  | { type: 'confirm-visit' | 'change-visit'; proposalId: string }

export function visitDate(slot: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(slot)) return NaN
  const time = Date.parse(slot + ':00+09:00')
  return Number.isFinite(time) && new Date(time + 9 * 3600000).toISOString().slice(0,16) === slot ? time : NaN
}
export function formatVisit(slot: string): string {
  return new Date(visitDate(slot)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
}
export const consultationGreeting = '안녕하세요. 곧 연락드리겠습니다.'

export function conversationEntries(row: Consultation): Consultation['entries'] {
  const first = row.entries[0]
  if (!first) return row.entries
  const oldRequest = first.text === `${row.kind} 상담을 요청했어요.` || first.text === `${row.kind} 상담 요청이 접수됐어요. 담당자가 확인하면 이 상담방에서 답변을 드려요.`
  const entries = (oldRequest ? [{ ...first, role: 'customer' as const, event: false, text: `${row.kind} 상담 요청을 보냈어요.` }, ...row.entries.slice(1)] : row.entries).map(entry =>
    entry.role === 'expert' && entry.automated && entry.text === '안녕하세요. 확인 후 메세지 드리겠습니다!'
      ? { ...entry, text: consultationGreeting }
      : entry
  )
  if (entries.some(entry => entry.automated) || (!oldRequest && first.text !== `${row.kind} 상담 요청을 보냈어요.`)) return entries
  let index = 1
  while (entries[index]?.role === 'customer' && entries[index]?.at === first.at) index++
  entries.splice(index, 0, { role: 'expert', event: false, automated: true, text: consultationGreeting, at: first.at })
  return entries
}

export function createConsultation(id: string, kind: Kind, inquiry: string, at: string): Consultation {
  if (inquiry.trim().length > 2000) throw new Error('문의는 2,000자 이내로 작성해 주세요.')
  return { version: 1, id, kind, provider: providerFor(kind), stage: 0, createdAt: at, updatedAt: at,
    entries: [{ role: 'customer', event: false, text: kind + ' 상담 요청을 보냈어요.', at },
      ...(inquiry.trim() ? [{ role: 'customer' as const, text: inquiry.trim(), at }] : []),
      { role: 'expert', event: false, automated: true, text: consultationGreeting, at }] }
}
export function updateConsultation(current: Consultation, role: Role, action: Action, at: string): Consultation {
  let stage = current.stage
  let text = ''
  let quote = current.quote
  let contact = current.contact
  let visit = current.visit
  const requireStage = (actor: Role, expected: number) => {
    if (role !== actor || current.stage !== expected) throw new Error('진행 상태가 변경됐어요. 현재 단계를 확인해 주세요.')
  }
  switch (action.type) {
    case 'contact':
      if (role !== 'customer' || stage === 6) throw new Error('고객이 상담 중에 연락 방법을 선택할 수 있어요.')
      if (!['phone','chat'].includes(action.method)) throw new Error('연락 방법을 선택해 주세요.')
      if (action.method === 'phone' && (!/^0\d{8,10}$/.test(action.phone.replace(/[ -]/g,'')) || !action.availability.trim() || action.availability.length > 100)) throw new Error('전화번호와 연락 가능한 시간을 확인해 주세요.')
      contact = { method: action.method, phone: action.method === 'phone' ? action.phone.trim() : '', availability: action.method === 'phone' ? action.availability.trim() : '' }
      text = action.method === 'phone' ? '고객이 전화 상담을 선택했어요. 연락 정보를 확인해 주세요.' : '고객이 채팅 상담을 선택했어요.'
      break
    case 'propose-visit':
      requireStage('expert', 1)
      if (!action.proposalId || action.proposalId === visit?.proposalId || action.slots.length < 2 || action.slots.length > 3 || new Set(action.slots).size !== action.slots.length || action.slots.some(slot => !Number.isFinite(visitDate(slot)) || visitDate(slot) <= Date.parse(at))) throw new Error('서로 다른 미래 방문 시간을 2~3개 제안해 주세요.')
      if (!Number.isSafeInteger(action.fee) || action.fee < 0 || !action.preparations.trim() || action.preparations.length > 2000) throw new Error('방문비와 준비사항을 확인해 주세요.')
      visit = { proposalId: action.proposalId, slots: [...action.slots].sort(), fee: action.fee, preparations: action.preparations.trim(), status: 'proposed' }
      text = '담당자가 방문 일정을 제안했어요.\n' + visit.slots.map(formatVisit).join('\n') + '\n방문비: ' + visit.fee.toLocaleString() + '원\n준비사항: ' + visit.preparations
      break
    case 'select-visit':
      requireStage('customer', 1)
      if (!visit || visit.proposalId !== action.proposalId || visit.status !== 'proposed' || !visit.slots.includes(action.slot) || visitDate(action.slot) <= Date.parse(at)) throw new Error('현재 선택 가능한 날짜를 다시 확인해 주세요.')
      if (visit.fee > 0 && !action.feeAccepted) throw new Error('방문비 안내를 먼저 확인해 주세요.')
      visit = { ...visit, selected: action.slot, status: 'selected' }
      text = '고객이 ' + formatVisit(action.slot) + ' 방문을 선택했어요. 담당자 확정을 기다립니다.'
      break
    case 'confirm-visit':
      requireStage('expert', 1)
      if (!visit || visit.proposalId !== action.proposalId || visit.status !== 'selected' || !visit.selected || visitDate(visit.selected) <= Date.parse(at)) throw new Error('고객이 선택한 미래 일정을 확인해 주세요.')
      visit = { ...visit, status: 'confirmed' }
      text = formatVisit(visit.selected!) + ' 방문이 확정됐어요.'
      break
    case 'change-visit':
      requireStage('customer', 1)
      if (!visit || visit.proposalId !== action.proposalId || visit.status === 'change-requested') throw new Error('현재 방문 일정을 확인해 주세요.')
      visit = { ...visit, selected: undefined, status: 'change-requested' }
      text = '고객이 다른 방문 날짜를 요청했어요. 담당자가 새 일정을 제안해 주세요.'
      break
    case 'accept': requireStage('expert', 0); stage = 1; text = '상담을 수락했어요. 현장 조건을 확인합니다.'; break
    case 'quote':
      requireStage('expert', 1)
      if (visit && visit.status !== 'confirmed') throw new Error('조율 중인 방문 일정을 먼저 확정해 주세요.')
      if (!Number.isFinite(action.amount) || action.amount <= 0 || !action.scope.trim() || action.scope.length > 2000) throw new Error('금액과 포함·제외 항목을 확인해 주세요.')
      quote = { amount: action.amount, scope: action.scope.trim() }; stage = 2; text = '견적·제안을 전달했어요.'; break
    case 'discuss': requireStage('customer', 2); stage = 3; text = '제안을 확인하고 계약 협의를 요청했어요.'; break
    case 'contract': requireStage('customer', 3); stage = 4; text = '별도 계약의 업무 범위·금액·일정을 확인했어요.'; break
    case 'finish': requireStage('expert', 4); stage = 5; text = '완료 확인 요청: ' + action.text.trim(); break
    case 'complete': requireStage('customer', 5); stage = 6; text = '고객이 결과를 확인하고 업무를 완료했어요.'; break
    case 'message':
      if (current.stage === 6 || (current.stage === 0 && role === 'expert')) throw new Error('담당자는 상담을 수락한 뒤 답변할 수 있어요.')
      text = action.text.trim(); break
  }
  if ('text' in action && (!action.text.trim() || action.text.trim().length > 2000)) throw new Error('내용을 1~2,000자로 작성해 주세요.')
  const event = action.type !== 'message' && action.type !== 'finish'
  return { ...current, stage, quote, contact, visit, updatedAt: at, entries: [...current.entries, { role: event ? 'system' : role, event, text, at }] }
}
