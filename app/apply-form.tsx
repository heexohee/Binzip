'use client'

import { useActionState, useRef, useState } from 'react'
import { submitApplication } from './actions'
import type { ApplyState } from '../src/application'

const INITIAL: ApplyState = { ok: false, errors: {}, message: null }

const POSSESSION = ['집주인입니다', '가족 소유입니다', '상속 정리 중입니다', '그 외입니다']
const CHANNEL = ['문자로 받겠습니다', '이메일로 받겠습니다']

const INPUT =
  'h-[52px] rounded-[6px] border border-line bg-paper px-4 text-[16px] text-body outline-none focus:border-2 focus:border-mid focus:px-[15px]'

/** 주소 확인 상태. 확인에 실패해도 신청은 막지 않는다 — "나머지는 저희가 찾습니다" */
type AddrStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'found'; addr: string; pnu: string; quality: 'exact' | 'road'; x: number | null; y: number | null }
  | { kind: 'unsure'; addr: string; pnu: string; x: number | null; y: number | null }
  | { kind: 'notfound' }

export function ApplyForm() {
  const [state, action, pending] = useActionState(submitApplication, INITIAL)
  const [addr, setAddr] = useState<AddrStatus>({ kind: 'idle' })
  const [mapState, setMapState] = useState<'loading' | 'ok' | 'error'>('loading')
  const lastQuery = useRef('')
  const addressRef = useRef<HTMLInputElement>(null)

  async function checkAddress(raw: string) {
    const query = raw.trim()
    if (!query || query === lastQuery.current) return
    lastQuery.current = query
    setAddr({ kind: 'checking' })
    setMapState('loading')
    try {
      const res = await fetch('/api/address?q=' + encodeURIComponent(query))
      const data = await res.json()
      // 그 사이 사용자가 주소를 또 고쳤으면 늦게 온 응답은 버린다
      if (lastQuery.current !== query) return
      if (!data.found) {
        setAddr({ kind: 'notfound' })
        return
      }
      const shown: string = data.jibunAddress ?? data.roadAddress ?? query
      const at = { x: data.x ?? null, y: data.y ?? null }
      setAddr(
        data.matchQuality === 'fuzzy'
          ? { kind: 'unsure', addr: shown, pnu: data.pnu, ...at }
          : { kind: 'found', addr: shown, pnu: data.pnu, quality: data.matchQuality, ...at },
      )
    } catch {
      setAddr({ kind: 'notfound' })
    }
  }

  if (state.ok) {
    return (
      <div className="max-w-[520px] rounded-[6px] border border-mid bg-deep p-6">
        <p className="font-serif text-[20px] font-semibold text-paper">신청이 접수됐습니다.</p>
        <p className="mt-3 text-[16px] leading-[1.75] text-pale">확인한 뒤 연락드립니다.</p>
      </div>
    )
  }

  const resolved = addr.kind === 'found' || addr.kind === 'unsure' ? addr : null
  const coords = resolved && resolved.x != null && resolved.y != null ? resolved : null

  return (
    <form action={action} className="flex max-w-[520px] flex-col gap-[22px]" noValidate>
      {/* 1. 주소 — 필수. blur 시 자동 확인하되 버튼을 새로 두지 않는다 */}
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold text-paper">
            빈집 주소가 어디인가요? <span className="text-[13px] font-normal text-pale">꼭 필요합니다</span>
          </span>
          <span className="flex gap-2">
            <input
              ref={addressRef}
              name="address"
              type="text"
              inputMode="text"
              enterKeyHint="search"
              placeholder="경북 포항시 남구 ○○동 1○○-○"
              aria-invalid={state.errors.address ? true : undefined}
              onChange={() => setAddr({ kind: 'idle' })}
              onBlur={(e) => void checkAddress(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                // 엔터가 폼을 제출해 버리면 아직 안 채운 칸의 오류가 먼저 뜬다.
                // 주소 칸에서 엔터는 '주소 확인'이지 '신청'이 아니다.
                e.preventDefault()
                void checkAddress(e.currentTarget.value)
              }}
              className={(state.errors.address ? INPUT + ' border-earth' : INPUT) + ' min-w-0 flex-1'}
            />
            <button
              type="button"
              aria-label="주소 확인"
              disabled={addr.kind === 'checking'}
              onClick={() => void checkAddress(addressRef.current?.value ?? '')}
              className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[6px] border border-mid bg-deep text-paper hover:bg-ink disabled:opacity-60"
            >
              {/* 아이콘 세트를 들이지 않는다 — 원 하나와 선 하나로 직접 그린다 */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        </label>

        <span className="flex flex-col gap-1 text-[13px] leading-[1.6] text-dash">
          <span>번지까지 모르시면 아는 데까지만 적어 주세요.</span>
          <span>나머지는 저희가 찾습니다.</span>
          <span>돋보기를 누르거나 엔터를 치시면 위성 사진으로 확인해 드립니다.</span>
        </span>

        {addr.kind === 'checking' && (
          <span className="text-[13px] leading-[1.6] text-dash">주소를 확인하고 있습니다.</span>
        )}

        {addr.kind === 'found' && (
          <div className="rounded-[4px] border border-mid bg-deep px-4 py-3 text-[14px] leading-[1.7] text-pale">
            <span className="flex flex-col gap-1">
              <span>이 주소로 확인했습니다.</span>
              <span className="font-semibold text-paper">{addr.addr}</span>
            </span>
          </div>
        )}

        {/* 점선 = 아직 확인되지 않은 것. 페이지 전체에서 이 규칙을 지킨다 */}
        {addr.kind === 'unsure' && (
          <div className="rounded-[4px] border border-dashed border-dash px-4 py-3 text-[14px] leading-[1.7] text-pale">
            <span className="flex flex-col gap-1">
              <span>비슷한 주소를 찾았습니다. 맞는지 확인해 주세요.</span>
              <span className="font-semibold text-paper">{addr.addr}</span>
              <span className="text-[13px] text-dash">다르면 주소를 고쳐 주세요. 그대로 신청하셔도 됩니다.</span>
            </span>
          </div>
        )}

        {addr.kind === 'notfound' && (
          <span className="flex flex-col gap-1 text-[13px] leading-[1.6] text-dash">
            <span>주소를 찾지 못했습니다.</span>
            <span>그대로 신청하셔도 됩니다. 저희가 찾습니다.</span>
          </span>
        )}

        {/* 주소 문자열보다 위에서 본 사진이 확인에 빠르다. 지붕·잡초·진입로가 함께 보인다 */}
        {coords && (
          <figure className="m-0 flex flex-col gap-2">
            <div
              className="relative w-full overflow-hidden rounded-[4px] border border-line"
              style={{ aspectRatio: '560 / 320' }}
            >
              {mapState !== 'ok' && (
                <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-[13px] leading-[1.6] text-pale">
                  {mapState === 'error'
                    ? '위성 사진을 불러오지 못했습니다. 주소 확인에는 지장이 없습니다.'
                    : '위성 사진을 불러오는 중입니다.'}
                </span>
              )}
              <img
                key={coords.x + ',' + coords.y}
                src={'/api/map?x=' + coords.x + '&y=' + coords.y + '&zoom=18'}
                alt={coords.addr + ' 위에서 본 모습'}
                width={560}
                height={320}
                onLoad={() => setMapState('ok')}
                onError={() => setMapState('error')}
                className={'w-full ' + (mapState === 'ok' ? 'block' : 'invisible')}
              />
            </div>
            <figcaption className="flex flex-col gap-1 text-[13px] leading-[1.6] text-dash">
              <span>위에서 내려다본 모습입니다.</span>
              <span>다른 집이면 주소를 고쳐 주세요.</span>
            </figcaption>
          </figure>
        )}

        {state.errors.address && (
          <span className="text-[13px] font-semibold text-pale">{state.errors.address}</span>
        )}
      </div>

      {resolved && (
        <>
          <input type="hidden" name="pnu" value={resolved.pnu} />
          <input type="hidden" name="resolvedAddress" value={resolved.addr} />
          <input
            type="hidden"
            name="matchQuality"
            value={resolved.kind === 'unsure' ? 'fuzzy' : resolved.quality}
          />
        </>
      )}

      {/* 2. 집 상태 — 선택 */}
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold text-paper">
          집 상태가 어떤가요? <span className="text-[13px] font-normal text-dash">안 적으셔도 됩니다</span>
        </span>
        <input
          name="condition"
          type="text"
          placeholder="5년 정도 비어 있고, 지붕이 내려앉았습니다"
          className={INPUT}
        />
      </label>

      {/* 3. 소유 관계 — 판정 로직 ①칸(미등기) 입력이 된다 */}
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-1 p-0 text-[15px] font-semibold text-paper">이 집은 누구 집인가요?</legend>
        <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          {POSSESSION.map((label) => (
            <label
              key={label}
              className="flex min-h-[48px] items-center gap-[10px] rounded-[6px] border border-mid bg-deep px-[14px] text-[16px] text-paper"
            >
              <input type="radio" name="possession" value={label} className="h-5 w-5 accent-pale" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 4. 받을 방법 */}
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-1 p-0 text-[15px] font-semibold text-paper">진단서를 어디로 보내드릴까요?</legend>
        <div className="flex flex-wrap gap-[10px]">
          {CHANNEL.map((label) => (
            <label
              key={label}
              className="flex min-h-[48px] items-center gap-[10px] rounded-[6px] border border-mid bg-deep px-[18px] text-[16px] text-paper"
            >
              <input type="radio" name="channel" value={label} className="h-5 w-5 accent-pale" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 5. 연락처 — 필수 */}
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold text-paper">
          어디로 연락드리면 되나요? <span className="text-[13px] font-normal text-pale">꼭 필요합니다</span>
        </span>
        <input
          name="contact"
          type="tel"
          placeholder="010-0000-0000"
          aria-invalid={state.errors.contact ? true : undefined}
          className={state.errors.contact ? INPUT + ' border-earth' : INPUT}
        />
        {state.errors.contact && (
          <span className="text-[13px] font-semibold text-pale">{state.errors.contact}</span>
        )}
      </label>

      {/* 6. 동의 — 보관 6개월. 그 전 삭제 요청 시 즉시 삭제(푸터의 전화·이메일이 창구) */}
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-[15px] leading-[1.7] text-pale">
          <input
            type="checkbox"
            name="agree"
            aria-invalid={state.errors.agree ? true : undefined}
            className="mt-[3px] h-5 w-5 flex-none accent-pale"
          />
          <span className="flex flex-col gap-1">
            <span>주소와 연락처를 진단에만 쓰는 데 동의합니다.</span>
            <span>진단서를 보낸 뒤 6개월이 지나면 지웁니다.</span>
          </span>
        </label>
        {state.errors.agree && (
          <span className="text-[13px] font-semibold text-pale">{state.errors.agree}</span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[6px] bg-pale px-7 py-[17px] text-[17px] font-semibold leading-[1.2] text-ink hover:bg-paper disabled:opacity-70"
        >
          {pending ? '신청하고 있습니다' : '진단 신청하기'}
        </button>
        {state.message && (
          <p className="text-[13px] font-semibold leading-[1.6] text-pale">{state.message}</p>
        )}
        <span className="flex flex-col gap-1 text-[13px] leading-[1.6] text-dash">
          <span>확인이 끝나면 알려드린 방법으로 보내드립니다.</span>
          <span>비용은 없습니다.</span>
        </span>
      </div>
    </form>
  )
}
