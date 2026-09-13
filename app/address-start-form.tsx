'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseAddressCandidate, type AddressCandidate } from '../src/address-candidate'
import { useInstantFlow } from './instant-flow'
import { SatelliteMap } from './satellite-map'
import { Arrow, Icon } from './home-ui'
import styles from './home.module.css'

export function AddressStartForm() {
  const flow = useInstantFlow()
  const router = useRouter()
  const [address, setAddress] = useState(flow.confirmedAddress?.query ?? flow.draft?.address ?? '')
  const [candidate, setCandidate] = useState<AddressCandidate | null>(flow.confirmedAddress)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const confirmation = useRef<HTMLElement>(null)
  useEffect(() => () => { controller.current?.abort(); controller.current = null }, [])
  useEffect(() => {
    if (candidate) {
      confirmation.current?.focus({ preventScroll: true })
      confirmation.current?.scrollIntoView({ block: 'start' })
    }
  }, [candidate])

  const clearLookup = () => {
    controller.current?.abort()
    controller.current = null
    setPending(false)
    setCandidate(null)
    setError('')
    flow.setConfirmedAddress(null)
    flow.setResult(null)
  }
  async function lookup() {
    const query = address.trim()
    clearLookup()
    if (query.length < 3 || query.length > 300) { setError('시·군·구와 도로명 또는 지번을 3자 이상 적어 주세요.'); input.current?.focus(); return }
    flow.setDraft({ address: query, decision: flow.draft?.decision ?? 'undecided' })
    const request = new AbortController()
    controller.current = request
    const timeout = setTimeout(() => request.abort(), 20000)
    setPending(true)
    try {
      const response = await fetch('/api/address?q=' + encodeURIComponent(query), { signal: request.signal, cache: 'no-store' })
      const data: unknown = await response.json()
      if (controller.current !== request) return
      if (!response.ok) { setError('주소 조회에 연결하지 못했어요. 잠시 후 다시 확인해 주세요.'); return }
      const found = parseAddressCandidate(data, query)
      if (!found) { setError('주소를 찾지 못했어요. 시·군·구와 도로명·건물번호 또는 지번을 확인해 주세요.'); return }
      setCandidate(found)
    } catch {
      if (controller.current === request) setError('주소 조회가 지연되거나 연결이 끊겼어요. 다시 확인해 주세요.')
    } finally {
      clearTimeout(timeout)
      if (controller.current === request) { setPending(false); controller.current = null }
    }
  }
  const continueToForm = () => {
    if (!candidate) return
    flow.setConfirmedAddress(candidate)
    flow.setDraft({ address: candidate.query, decision: flow.draft?.decision ?? 'undecided' })
    flow.setResult(null)
    router.push('/apply')
  }

  return <div className={styles.addressForm}>
    <form onSubmit={event => { event.preventDefault(); void lookup() }}>
      <div className={styles.addressInput}><Icon name="pin" /><input ref={input} id="home-address" aria-label="빈집 주소" name="address" type="text" required minLength={3} maxLength={300} autoComplete="street-address" enterKeyHint="search" placeholder="도로명주소 또는 지번주소" value={address} onChange={event => { clearLookup(); setAddress(event.target.value) }} aria-invalid={error ? true : undefined} aria-describedby={error ? 'address-error' : undefined} /></div>
      <button type="submit" className={styles.primary} disabled={pending}>{pending ? '주소 확인 중…' : '내 빈집 무료로 확인하기'}<Icon name="search" /></button>
    </form>
    {pending && <p className={styles.lookupMessage} role="status">입력한 주소와 지도 위치를 찾고 있어요.</p>}
    {error && <p id="address-error" className={styles.lookupError} role="alert">{error}</p>}
    {candidate && <section ref={confirmation} tabIndex={-1} className={styles.addressConfirmation} aria-labelledby="address-confirm-title">
      <h3 id="address-confirm-title">이 집이 맞나요?</h3>
      <p className={styles.candidateAddress}>{candidate.address}</p>
      {candidate.roadAddress && candidate.roadAddress !== candidate.address && <p className={styles.candidateRoad}>{candidate.roadAddress}</p>}
      <SatelliteMap address={candidate.address} x={candidate.x} y={candidate.y} />
      <p className={styles.confirmHelp}>{candidate.quality === 'fuzzy' ? '입력한 주소와 다른 결과일 수 있어요. 번지와 주변 위치를 꼭 확인해 주세요.' : '주소와 주변 위치가 맞으면 상세 정보를 입력해 주세요.'}</p>
      <button className={styles.primary} type="button" onClick={continueToForm}>이 집이 맞아요 · 상세 정보 입력<Arrow /></button>
      <button className={styles.changeAddress} type="button" onClick={() => { clearLookup(); input.current?.focus() }}>다른 집이에요 · 주소 수정</button>
    </section>}
  </div>
}
