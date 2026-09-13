import { EXAMPLE_CASE, EXAMPLE_DOCUMENTS } from '../../src/example-report-data'
import styles from './example-documents.module.css'

/** Report extracts, not reproductions of government-issued certificates. */
export function ExampleDocuments() {
  return <div className={styles.documents} aria-label="확인한 서류">
    {EXAMPLE_DOCUMENTS.map(document => <details id={document.id} key={document.id} className={styles.document}>
      <summary><span>{document.title}<small>{document.status} · {EXAMPLE_CASE.checkedAt}</small></span><span className={styles.plus} aria-hidden="true">＋</span></summary>
      <div className={styles.body}>{document.groups.map(group => <section key={group.title}>
        <h3>{group.title}</h3>
        <dl>{group.rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
      </section>)}</div>
    </details>)}
  </div>
}
