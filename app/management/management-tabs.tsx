'use client'
import { useEffect, useState, type ReactNode } from 'react'
import m from './management.module.css'

export const TABS = [
  { id: 'apply', label: '신청하기' },
  { id: 'service', label: '서비스 및 요금안내' },
  { id: 'report', label: '관리보고' },
] as const
type TabId = (typeof TABS)[number]['id']
const DEFAULT_TAB: TabId = 'service'
const isTab = (v: string): v is TabId => TABS.some(t => t.id === v)

/** Hash-driven tabs so ads and old links (/diagnosis#apply) open the right panel. All panels stay in the HTML for search. */
export function ManagementTabs({ panels }: { panels: Record<TabId, ReactNode> }) {
  const [tab, setTab] = useState<TabId>(DEFAULT_TAB)
  useEffect(() => {
    const sync = () => { const h = location.hash.slice(1); setTab(isTab(h) ? h : DEFAULT_TAB) }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const open = (id: TabId) => {
    setTab(id)
    history.replaceState(null, '', `${location.pathname}${location.search}#${id}`)
    document.getElementById('management-tabs')?.scrollIntoView({ block: 'start' })
  }
  return <>
    <nav id="management-tabs" className={m.tabs} aria-label="빈집 관리 메뉴">
      <div className={m.tabsIn} role="tablist">
        {TABS.map(t => <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-controls={`panel-${t.id}`} aria-selected={tab === t.id} className={m.tab} onClick={() => open(t.id)}>{t.label}</button>)}
      </div>
    </nav>
    {TABS.map(t => <section key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={tab !== t.id} className={m.panel}>
      {panels[t.id]}
      {t.id !== 'apply' && <div className={m.panelActions}>
        <button type="button" className={m.primary} onClick={() => open('apply')}>관리 신청하기</button>
        {t.id === 'service' && <button type="button" className={m.secondary} onClick={() => open('report')}>관리보고 예시 보기</button>}
      </div>}
    </section>)}
    {tab !== 'apply' && <div className={m.sticky}><button type="button" className={m.primary} onClick={() => open('apply')}>관리 신청하기</button></div>}
  </>
}
