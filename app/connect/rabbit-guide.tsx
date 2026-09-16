import Image from 'next/image'
import styles from './rabbit-guide.module.css'

export function RabbitGuide({ title, description }: { title: string; description: string }) {
  return <aside className={styles.guide} aria-label="집토끼 안내">
    <Image src="/mascot/binzip-rabbit-report-transparent-v4.png" alt="" width={96} height={112} sizes="(max-width: 640px) 72px, 96px" className={styles.rabbit} />
    <div className={styles.bubble}><strong>{title}</strong><p>{description}</p></div>
  </aside>
}
