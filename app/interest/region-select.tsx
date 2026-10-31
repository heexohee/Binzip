'use client'
import { useState, type ReactNode } from 'react'
import { PROVINCES, REGIONS, isProvince } from '../../src/regions'
import s from './interest.module.css'

/** Two dependent selects posting `${prefix}Province` and `${prefix}District`. */
export function RegionSelect({ prefix, legend, error, errorId }: { prefix: string; legend: string; error?: ReactNode; errorId?: string }) {
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const districts = isProvince(province) ? REGIONS[province] : []
  return <fieldset>
    <legend>{legend} (필수)</legend>
    <div className={s.regionRow}>
      <label>시·도<select name={`${prefix}Province`} value={province} required aria-describedby={error ? errorId : undefined}
        onChange={e => { setProvince(e.target.value); setDistrict('') }}>
        <option value="">선택</option>
        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
      </select></label>
      <label>시·군·구<select name={`${prefix}District`} value={district} required disabled={!districts.length} aria-describedby={error ? errorId : undefined}
        onChange={e => setDistrict(e.target.value)}>
        <option value="">{districts.length ? '선택' : '시·도 먼저'}</option>
        {districts.map(d => <option key={d} value={d}>{d}</option>)}
      </select></label>
    </div>
    {error}
  </fieldset>
}
