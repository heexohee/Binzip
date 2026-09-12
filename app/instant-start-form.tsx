'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DECISIONS, type Decision } from '../src/decision-actions'
import { useInstantFlow } from './instant-flow'
import { Arrow, Icon } from './home-ui'
import styles from './home.module.css'

export function InstantStartForm() {
  const flow = useInstantFlow()
  const router = useRouter()
  const [address, setAddress] = useState(flow.draft?.address ?? '')
  const [decision, setDecision] = useState<Decision>(flow.draft?.decision ?? 'undecided')
  return <form className={styles.addressForm} onSubmit={event => {
    event.preventDefault()
    flow.setDraft({ address: address.trim(), decision })
    flow.setResult(null)
    router.push('/diagnose')
  }}>
    <label htmlFor="home-address">확인할 빈집 주소</label>
    <div className={styles.addressInput}><Icon name="pin" /><input id="home-address" name="address" type="text" required minLength={3} maxLength={300} autoComplete="street-address" enterKeyHint="go" placeholder="도로명주소 또는 지번주소" value={address} onChange={event => setAddress(event.target.value)} aria-describedby="address-help" /></div>
    <fieldset className={styles.concernPicker}><legend>지금 가장 고민하는 방향</legend>{DECISIONS.map(item => <label key={item.id}><input type="radio" name="decision" value={item.id} checked={decision === item.id} onChange={() => setDecision(item.id)} />{item.label}</label>)}</fieldset>
    <button type="submit" className={styles.primary}>1차 진단서 바로 보기<Arrow /></button>
    <p id="address-help" className={styles.inputHelp}>주소를 확인하면 조회된 기록과 다음 할 일을 바로 보여드려요. 연락처 없이 무료로 볼 수 있어요.</p>
    <p className={styles.lookupPrivacy}>주소는 공적 자료 조회에 사용해요. 추가 확인을 신청하기 전에는 신청 기록으로 저장하지 않아요. <Link href="/privacy">개인정보 안내</Link></p>
  </form>
}
