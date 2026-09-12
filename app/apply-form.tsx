'use client'

import { startTransition, useActionState, useRef, useState } from 'react'
import { submitApplication } from './actions'
import type { ApplyState } from '../src/application'
import { PhotoPicker } from './photo-picker'
import { useInstantFlow } from './instant-flow'
import styles from './apply-form.module.css'

const INITIAL: ApplyState = { ok: false, errors: {}, message: null }

const ACQUISITION = ['상속', '매입', '가족 소유', '기타']
const OWNERSHIP = ['단독', '공동', '상속 정리 중', '잘 모름']
// 순서가 곧 우선순위다. '보유 비용'을 앞에 둔 것은 이 서비스가
// 제일 먼저 답하는 것이 '지금 얼마가 나가고 있나'이기 때문이다.
const CONCERN = [
  '보유 비용',
  '세금',
  '등기·상속',
  '건물 상태',
  '관리',
  '매각 가능성',
  '철거비·공적 지원',
  '활용 방법',
  '잘 모르겠음',
]
const CHANNEL = ['문자로 받겠습니다', '이메일로 받겠습니다']
const SPEED = [
  '서류와 사진으로 확인할 수 있는 부분부터 알고 싶어요',
  '현장 확인이 필요한지 상담하고 싶어요',
  '상관없습니다',
]

const INPUT = styles.input
const CHIP = styles.chip
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
    <span className={styles.legend}>
      {text}{' '}
      {need === 'must' && <small>꼭 필요합니다</small>}
      {need === 'may' && <small>안 적으셔도 됩니다</small>}
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
              className="h-5 w-5 flex-none accent-deep"
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function ApplyForm({ initialAddress = '' }: { initialAddress?: string }) {
  const { draft } = useInstantFlow()
  const [photos, setPhotos] = useState<File[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() => ({ address: initialAddress || draft?.address || '', concern: draft ? ({ sell: '매각 가능성', demolish: '철거비·공적 지원', hold: '보유 비용', undecided: '잘 모르겠음' }[draft.decision]) : '' }))
  const [agreed, setAgreed] = useState(false)
  const [photoAgreed, setPhotoAgreed] = useState(false)
  const setValue = (name: string, value: string) => setValues(current => ({ ...current, [name]: value }))
  const [state, action, pending] = useActionState(async (previous: ApplyState, data: FormData) => {
    photos.forEach(photo => data.append('photos', photo))
    try { return await submitApplication(previous, data) }
    catch { return { ok: false, errors: {}, message: '접수 결과를 확인하지 못했어요. 잠시 후 다시 시도하거나 전화로 문의해 주세요.' } }
  }, INITIAL)
  const [addr, setAddr] = useState<AddrStatus>({ kind: 'idle' })
  const [mapState, setMapState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [channel, setChannel] = useState('')
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
      <div className={styles.success}>
        <h2>추가 확인 신청이 접수됐습니다.</h2>
        <p className="mt-3 text-[16px] leading-[1.75] text-muted">확인한 뒤 연락드립니다.</p>
      </div>
    )
  }

  const resolved = addr.kind === 'found' || addr.kind === 'unsure' ? addr : null
  const coords = resolved && resolved.x != null && resolved.y != null ? resolved : null
  const err = (k: string) =>
    state.errors[k] ? (
      <span id={`apply-${k}-error`} role="alert" className={styles.error}>{state.errors[k]}</span>
    ) : null

  return (
    <form onSubmit={e => {
      e.preventDefault()
      if (photoBusy || pending) return
      // Dispatch explicitly so failed submissions do not reset text or consent fields.
      const data = new FormData(e.currentTarget)
      startTransition(() => action(data))
    }} className={styles.form} noValidate>
      {/* 1. 주소 — 필수. 돋보기·엔터·포커스 이동 세 경로로 확인한다 */}
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <Legend text="빈집 주소가 어디인가요?" need="must" />
          <span className="flex gap-2">
            <input
              ref={addressRef}
              name="address"
              type="text"
              value={values.address}
              enterKeyHint="search"
              placeholder="경북 포항시 남구 ○○동 1○○-○"
              aria-invalid={state.errors.address ? true : undefined}
          aria-describedby={state.errors.address ? 'apply-address-error' : undefined}
              onChange={e => {
                setValue('address', e.currentTarget.value)
                lastQuery.current = ''
                setAddr({ kind: 'idle' })
              }}
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
              className={styles.search}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        </label>

        <span className="flex flex-col gap-1 text-[14px] leading-[1.6] text-muted">
          <span>번지까지 모르시면 아는 데까지만 적어 주세요.</span>
          <span>나머지는 저희가 찾습니다.</span>
          <span>돋보기를 누르거나 엔터를 치시면 위성 사진으로 확인해 드립니다.</span>
        </span>

        {addr.kind === 'checking' && (
          <span className="text-[14px] leading-[1.6] text-muted">주소를 확인하고 있습니다.</span>
        )}
        {addr.kind === 'found' && (
          <div className={styles.status}>
            <span className="flex flex-col gap-1">
              <span className={styles.known}>
                확인했습니다
              </span>
              <span className="mt-1 font-semibold text-body">{addr.addr}</span>
            </span>
          </div>
        )}
        {addr.kind === 'unsure' && (
          <div className={styles.uncertain}>
            <span className="flex flex-col gap-1">
              <span className={styles.unknown}>
                맞는지 확인해 주세요
              </span>
              <span className="mt-1 font-semibold text-body">{addr.addr}</span>
              <span className="text-[14px] text-muted">
                비슷한 주소를 찾았습니다. 다르면 주소를 고쳐 주세요. 그대로 신청하셔도 됩니다.
              </span>
            </span>
          </div>
        )}
        {addr.kind === 'notfound' && (
          <div className={styles.uncertain}>
            <span className="flex flex-col gap-1">
              <span className={styles.unknown}>
                찾지 못했습니다
              </span>
              <span className="mt-1 text-[14px] text-muted">
                그대로 신청하셔도 됩니다. 저희가 찾습니다.
              </span>
            </span>
          </div>
        )}

        {coords && (
          <figure className="m-0 flex flex-col gap-2">
            <div className="relative w-full overflow-hidden rounded-[4px] border border-line" style={{ aspectRatio: '560 / 320' }}>
              {mapState !== 'ok' && (
                <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-[14px] leading-[1.6] text-muted">
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
            <figcaption className="flex flex-col gap-1 text-[14px] leading-[1.6] text-muted">
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
        <input name="condition" type="text" value={values.condition ?? ''} onChange={e => setValue('condition', e.currentTarget.value)} placeholder="5년 정도 비어 있고, 지붕이 내려앉았습니다" className={INPUT} />
        {err('condition')}
      </label>

      <PhotoPicker onChange={setPhotos} onBusyChange={setPhotoBusy} disabled={pending} error={state.errors.photos} />
      {photos.length > 0 && <label className={styles.consent}>
        <input type="checkbox" name="photoAgree" checked={photoAgreed} onChange={e => setPhotoAgreed(e.currentTarget.checked)} className="mt-1 h-5 w-5 flex-none accent-deep" aria-invalid={state.errors.photoAgree ? true : undefined} />
        <span>첨부 사진을 담당자가 집 상태 확인과 진단서 작성에 사용하는 데 동의해요. 사진은 진단서 발송 후 6개월 동안 보관하며, 공개 진단서에 사진 자체를 게시하지 않아요. 동의하지 않으면 사진을 빼고 신청할 수 있어요.
          {state.errors.photoAgree && <span role="alert" className="block font-semibold">{state.errors.photoAgree}</span>}
        </span>
      </label>}

      {/* 3. 취득 경위 — ①칸(법적) 판정의 입력이 된다 */}
      <RadioGroup name="acquisition" label="이 집은 어떻게 갖게 되셨나요?" options={ACQUISITION} value={values.acquisition ?? ''} onChange={v => setValue('acquisition', v)} />

      {/* 4. 소유관계 — 단독/공동이 미등기·공동상속 판정을 가른다 */}
      <RadioGroup name="ownership" label="현재 소유관계를 알고 계신가요?" options={OWNERSHIP} value={values.ownership ?? ''} onChange={v => setValue('ownership', v)} />

      {/* 5. 걱정거리 — 진단서에서 어느 경로를 맨 위에 놓을지 정한다 */}
      <RadioGroup name="concern" label="가장 걱정되는 것은 무엇인가요?" options={CONCERN} value={values.concern ?? ''} onChange={v => setValue('concern', v)} />

      {/* 6. 받을 방법 — 필수. 연락처 칸의 형식을 바꾼다 */}
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-1 p-0">
          <Legend text="어느 쪽이 편하신가요?" need="may" />
        </legend>
        <div className="flex flex-wrap gap-[10px]">
          {CHANNEL.map((o) => (
            <label key={o} className={CHIP}>
              <input
                type="radio"
                name="channel"
                value={o}
                checked={channel === o}
                onChange={() => setChannel(o)}
                className="h-5 w-5 flex-none accent-deep"
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
          value={values.contact ?? ''}
          onChange={e => setValue('contact', e.currentTarget.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="010-0000-0000"
          aria-invalid={state.errors.contact ? true : undefined}
          aria-describedby={state.errors.contact ? 'apply-contact-error' : undefined}
          className={state.errors.contact ? INPUT + ' border-earth' : INPUT}
        />
        {err('contact')}
      </label>

      {/* 이메일 — 항상 필수. 진단서를 보낼 수 있는 유일한 경로다 */}
      <label className="flex flex-col gap-2">
        <Legend text="진단서를 받으실 이메일 주소를 알려주세요" need="must" />
        <input
          name="email"
          value={values.email ?? ''}
          onChange={e => setValue('email', e.currentTarget.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={state.errors.email ? true : undefined}
          aria-describedby={state.errors.email ? 'apply-email-error' : undefined}
          className={state.errors.email ? INPUT + ' border-earth' : INPUT}
        />
        <span className="text-[14px] leading-[1.6] text-muted">
          진단서는 이 주소로 보내드립니다. 문자로도 알려드릴 수 있습니다.
        </span>
        {err('email')}
      </label>

      {/* 9. 희망 소요 — 문항이 길어 한 줄씩 쌓는다 */}
      <RadioGroup name="speed" label="어떤 확인을 원하시나요?" options={SPEED} layout="stack" value={values.speed ?? ''} onChange={v => setValue('speed', v)} />

      {/* 8. 동의 — 법적 확인이라 제출 버튼 바로 앞에 둔다 */}
      <div className="flex flex-col gap-2">
        <label className={styles.consent}>
          <input
            type="checkbox"
            name="agree"
            checked={agreed}
            onChange={e => setAgreed(e.currentTarget.checked)}
            aria-invalid={state.errors.agree ? true : undefined}
          aria-describedby={state.errors.agree ? 'apply-agree-error' : undefined}
            className="mt-[3px] h-5 w-5 flex-none accent-deep"
          />
          {/*
            개인정보보호법 §15·§22 의 고지사항 네 가지를 여기서 다 말한다 —
            항목 · 목적 · 보유기간 · 거부 권리와 불이익.
            나머지(위탁·국외이전·정보주체 권리)는 /privacy 로 넘긴다.
            RETENTION_MONTHS 를 import 하지 않는다 — 클라이언트 컴포넌트라
            application.ts 모듈 전체가 번들로 끌려온다.
          */}
          <span className="flex flex-col gap-1">
            <span>
              주소·연락처(전화번호·이메일)와 집에 대해 답해주신 내용을 진단에만 쓰는 데
              동의합니다.
            </span>
            <span>진단서를 보낸 뒤 6개월이 지나면 지우고, 그 전에 말씀하시면 바로 지웁니다.</span>
            <span className="text-muted">
              동의하지 않으셔도 되지만, 그러면 신청 접수가 되지 않습니다.
            </span>
          </span>
        </label>
        <a
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          className={styles.privacyLink}
        >
          어떤 정보를 어디에 맡기는지 자세히 보기
        </a>
        {err('agree')}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending || photoBusy}
          className={styles.submit}
        >
          {photoBusy ? '사진을 준비하고 있어요' : pending ? '신청하고 있습니다' : '추가 확인 신청하기'}
        </button>
        {state.message && (
          <p role="alert" className={styles.error}>{state.message}</p>
        )}
        <span className="flex flex-col gap-1 text-[14px] leading-[1.6] text-muted">
          <span>확인이 끝나면 알려드린 방법으로 보내드립니다.</span>
          <span>비용은 없습니다.</span>
        </span>
      </div>
    </form>
  )
}
