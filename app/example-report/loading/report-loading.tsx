'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brand, Icon } from '../../home-ui'
import styles from './report-loading.module.css'

const STEPS = [
  { title: '집 정보 정리', description: '집과 땅의 기본 정보를 정리하고 있어요.' },
  { title: '선택별 비용 계산', description: '수리·철거·매매에 드는 비용을 비교하고 있어요.' },
  { title: '비교 결과 준비', description: '선택에 도움이 될 내용을 진단서에 담고 있어요.' },
] as const

// Demo presentation only: these stages do not represent live data requests.
const STEP_DURATION_MS = 1400

export function ReportLoading() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const complete = step === STEPS.length
  const current = STEPS[Math.min(step, STEPS.length - 1)]!

  useEffect(() => {
    router.prefetch('/example-report')
    const timers = STEPS.map((_, index) => window.setTimeout(
      () => setStep(index + 1), (index + 1) * STEP_DURATION_MS,
    ))
    timers.push(window.setTimeout(() => router.replace('/example-report'), 4800))
    return () => timers.forEach(window.clearTimeout)
  }, [router])

  return <div className={styles.page}>
    <header className={styles.header}><Brand /><span>예시 진단</span></header>
    <main className={styles.main}>
      <p className={styles.eyebrow}>집토끼가 꼼꼼히 살펴볼게요</p>
      <h1>우리 집의 다음 선택,<br />진단서로 정리하고 있어요.</h1>
      <div className={styles.illustration} aria-hidden="true">
        <div className={styles.halo} />
        <span className={styles.document}><Icon name="document" /></span>
        <Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={300} height={300} sizes="(max-width: 600px) 220px, 260px" priority className={styles.rabbit} />
        <span className={styles.sparkle}>✦</span>
      </div>
      <section className={styles.statusCard} aria-label="예시 진단서 준비 단계">
        <div className={styles.current} role="status" aria-live="polite" aria-atomic="true">
          <span className={complete ? styles.finished : styles.spinner} aria-hidden="true">{complete && <Icon name="check" />}</span>
          <div><h2>{complete ? '진단서가 준비됐어요' : current.title}</h2>
            <p>{complete ? '이제 비교 결과를 보여드릴게요.' : current.description}</p></div>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((item, index) => <li key={item.title} data-state={index < step ? 'done' : index === step ? 'active' : 'waiting'} aria-current={index === step ? 'step' : undefined}>
            <span className={styles.track} aria-hidden="true" />
            <span>{item.title}</span>
            <span className={styles.srOnly}>{index < step ? ' 완료' : index === step ? ' 진행 중' : ' 대기'}</span>
          </li>)}
        </ol>
      </section>
      <p className={styles.notice}>예시 데이터를 활용한 시연이에요.<br />준비가 끝나면 진단서로 자동 이동해요.</p>
      <Link href="/example-report" replace className={styles.skip}>기다리지 않고 진단서 보기 <span aria-hidden="true">→</span></Link>
    </main>
  </div>
}
