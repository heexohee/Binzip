import { TaxPlanner } from '../tax-comparison'
import { HomeHeader, HomeFooter, HomeLink } from '../home-ui'
import styles from '../home.module.css'
export const metadata = { title: '처분 순서 비교 — 빈집진단서', robots: { index: false, follow: false } }
export default function DecisionReport() {
  return <div className={styles.site}><div className={styles.sheet}><HomeHeader /><main><div className={styles.subpageIntro}><HomeLink /><h1>내 집의 처분 순서 비교</h1><p>입력한 조건에 따른 예상 세금과 다음 할 일을 확인하세요.</p></div><TaxPlanner /></main><HomeFooter /></div></div>
}
