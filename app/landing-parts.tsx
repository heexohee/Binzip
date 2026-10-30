import { Icon } from './home-ui'
import s from './landing.module.css'

export const PHONE = '010-7428-2624'
const KAKAO_CHANNEL = /^https:\/\/pf\.kakao\.com\/[A-Za-z0-9_/-]+$/

export type Item = { title: string; text: string }

export function kakaoChannel() {
  const channel = process.env.KAKAO_CHANNEL_URL
  return channel && KAKAO_CHANNEL.test(channel) ? channel : null
}

export function Gets({ items, planned = false }: { items: Item[]; planned?: boolean }) {
  return <ul className={planned ? `${s.gets} ${s.planned}` : s.gets}>{items.map(item => <li key={item.title}>{!planned && <Icon name="check" />}<div><strong>{item.title}</strong><span>{item.text}</span></div></li>)}</ul>
}

export function Steps({ items }: { items: Item[] }) {
  return <ol className={s.steps}>{items.map(item => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}</ol>
}

export function Facts({ items }: { items: Item[] }) {
  return <dl className={s.facts}>{items.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}</dl>
}
