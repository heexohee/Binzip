import { TaxPlanner } from '../tax-comparison'
import { HomeHeader, HomeLink } from '../home-ui'
import styles from '../home.module.css'
export const metadata = { title: '세금 확인 안내 — 빈집진단서', robots: { index: false, follow: false } }
export default function DecisionReport() {
  return <div className={styles.site}><div className={styles.sheet}><HomeHeader /><main><div className={styles.subpageIntro}><HomeLink /><h1>내 집의 세금 확인 안내</h1><p>구체적인 세액과 적용 요건은 세무 전문가에게 확인해 주세요. 이 화면에서는 양도세를 계산하지 않아요.</p></div><TaxPlanner /></main></div></div>
}
