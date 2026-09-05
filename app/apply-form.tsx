'use client'

import { useActionState, useRef, useState } from 'react'
import { submitApplication } from './actions'
import type { ApplyState } from '../src/application'

const INITIAL: ApplyState = { ok: false, errors: {}, message: null }

const ACQUISITION = ['상속', '매입', '가족 소유', '기타']
const OWNERSHIP = ['단독', '공동', '상속 정리 중', '잘 모름']
const CONCERN = ['세금', '등기·상속', '건물 상태', '관리', '매각 가능성', '활용 방법', '잘 모르겠음']
const CHANNEL = ['문자로 받겠습니다', '이메일로 받겠습니다']
const SPEED = [
  '빠를수록 좋습니다 — 서류로 확인되는 것만 (1~2일 안에)',
  '정확한 게 좋습니다 — 집으로 담당자가 직접 가서 확인한 뒤 (일주일 안에)',
  '상관없습니다',
]

const INPUT =
  'h-[52px] rounded-[6px] border border-line bg-paper px-4 text-[16px] text-body outline-none focus:border-2 focus:border-mid focus:px-[15px]'
const CHIP =
  'flex min-h-[48px] items-center gap-[10px] rounded-[6px] border border-mid bg-deep px-[14px] text-[16px] text-paper'
const GRID = 'grid gap-[10px] [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]'

type AddrStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'found'; addr: string; pnu: string; quality: 'exact' | 'road'; x: number | null; y: number | null }
  | { kind: 'unsure'; addr: string; pnu: string; x: number | null; y: number | null }
  | { kind: 'notfound' }

/** 라벨 + 필수/선택 표기. 기호가 아니라 말로 쓴다 */
function Legend({ text, need }: { text: string; need?: 'must' | 'may' }) {
  return (
    <span className="text-[15px] font-semibold text-paper">
      {text}{' '}
      {need === 'must' && <span className="text-[13px] font-normal text-pale">꼭 필요합니다</span>}
      {need === 'may' && <span className="text-[13px] font-normal text-dash">안 적으셔도 됩니다</span>}
    </span>
  )
}

function RadioGroup({
  name, label, options, value, onChange, layout = 'grid',
}: {
  name: string; label: string; options: string[]
  value?: string; onChange?: (v: string) => void
  layout?: 'grid' | 'stack'
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="mb-1 p-0">
        <Legend text={label} need="may" />
      </legend>
      <div className={layout === 'grid' ? GRID : 'flex flex-col gap-[10px]'}>
        {options.map((o) => (
          <label key={o} className={CHIP}>
            <input
              type="radio"
              name={name}
              value={o}
              checked={value === undefined ? undefined : value === o}
              onChange={onChange ? () => onChange(o) : undefined}
              className="h-5 w-5 flex-none accent-pale"
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function ApplyForm() {
  const [state, action, pending] = useActionState(submitApplication, INITIAL)
  const [addr, setAddr] = useState<AddrStatus>({ kind: 'idle' })
  const [mapState, setMapState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [channel, setChannel] = useState('')
  const lastQuery = useRef('')
  const addressRef = useRef<HTMLInputElement>(null)

  const wantsEmail = channel === '이메일로 받겠습니다'

  async function checkAddress(raw: string) {
    const query = raw.trim()
    if (!query || query === lastQuery.current) return
    lastQuery.current = query
    setAddr({ kind: 'checking' })
    setMapState('loading')
    try {
      const res = await fetch('/api/address?q=' + encodeURIComponent(query))
      const data = await res.json()
      if (lastQuery.current !== query) return
      if (!data.found) return setAddr({ kind: 'notfound' })
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
  const err = (k: string) =>
    state.errors[k] ? (
      <span className="text-[13px] font-semibold text-pale">{state.errors[k]}</span>
    ) : null

  return (
    <form action={action} className="flex max-w-[520px] flex-col gap-[22px]" noValidate>
      {/* 1. 주소 — 필수. 돋보기·엔터·포커스 이동 세 경로로 확인한다 */}
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <Legend text="빈집 주소가 어디인가요?" need="must" />
          <span className="flex gap-2">
            <input
              ref={addressRef}
              name="address"
              type="text"
              enterKeyHint="search"
              placeholder="경북 포항시 남구 ○○동 1○○-○"
              aria-invalid={state.errors.address ? true : undefined}
              onChange={() => setAddr({ kind: 'idle' })}
              onBlur={(e) => void checkAddress(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                // 이 칸에서 엔터는 '신청'이 아니라 '확인'이다
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

        {coords && (
          <figure className="m-0 flex flex-col gap-2">
            <div className="relative w-full overflow-hidden rounded-[4px] border border-line" style={{ aspectRatio: '560 / 320' }}>
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
        {err('address')}
      </div>

      {resolved && (
        <>
          <input type="hidden" name="pnu" value={resolved.pnu} />
          <input type="hidden" name="resolvedAddress" value={resolved.addr} />
          <input type="hidden" name="matchQuality" value={resolved.kind === 'unsure' ? 'fuzzy' : resolved.quality} />
        </>
      )}

      {/* 2. 집 상태 */}
      <label className="flex flex-col gap-2">
        <Legend text="집 상태가 어떤가요?" need="may" />
        <input name="condition" type="text" placeholder="5년 정도 비어 있고, 지붕이 내려앉았습니다" className={INPUT} />
      </label>

      {/* 3. 취득 경위 — ①칸(법적) 판정의 입력이 된다 */}
      <RadioGroup name="acquisition" label="이 집은 어떻게 갖게 되셨나요?" options={ACQUISITION} />

      {/* 4. 소유관계 — 단독/공동이 미등기·공동상속 판정을 가른다 */}
      <RadioGroup name="ownership" label="현재 소유관계를 알고 계신가요?" options={OWNERSHIP} />

      {/* 5. 걱정거리 — 진단서에서 어느 경로를 맨 위에 놓을지 정한다 */}
      <RadioGroup name="concern" label="가장 걱정되는 것은 무엇인가요?" options={CONCERN} />

      {/* 6. 받을 방법 — 필수. 연락처 칸의 형식을 바꾼다 */}
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-1 p-0">
          <Legend text="진단서를 어디로 보내드릴까요?" need="must" />
        </legend>
        <div className="flex flex-wrap gap-[10px]">
          {CHANNEL.map((o) => (
            <label key={o} className={CHIP.replace('px-[14px]', 'px-[18px]')}>
              <input
                type="radio"
                name="channel"
                value={o}
                checked={channel === o}
                onChange={() => setChannel(o)}
                className="h-5 w-5 flex-none accent-pale"
              />
              {o}
            </label>
          ))}
        </div>
        {err('channel')}
      </fieldset>

      {/* 7. 전화번호 — 항상 필수. 발송이 실패해도 닿을 수단이 하나는 있어야 한다 */}
      <label className="flex flex-col gap-2">
        <Legend text="연락받을 전화번호를 알려주세요" need="must" />
        <input
          name="contact"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="010-0000-0000"
          aria-invalid={state.errors.contact ? true : undefined}
          className={state.errors.contact ? INPUT + ' border-earth' : INPUT}
        />
        {err('contact')}
      </label>

      {/* 이메일로 받겠다고 고른 경우에만 나타난다 */}
      {wantsEmail && (
        <label className="flex flex-col gap-2">
          <Legend text="진단서를 받으실 이메일 주소를 알려주세요" need="must" />
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            aria-invalid={state.errors.email ? true : undefined}
            className={state.errors.email ? INPUT + ' border-earth' : INPUT}
          />
          <span className="text-[13px] leading-[1.6] text-dash">이 주소로 진단서 링크를 보내드립니다.</span>
          {err('email')}
        </label>
      )}

      {/* 9. 희망 소요 — 문항이 길어 한 줄씩 쌓는다 */}
      <RadioGroup name="speed" label="진단서를 언제까지 받고 싶으신가요?" options={SPEED} layout="stack" />

      {/* 8. 동의 — 법적 확인이라 제출 버튼 바로 앞에 둔다 */}
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
        {err('agree')}
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
