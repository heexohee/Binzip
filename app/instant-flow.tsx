'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { InstantInput, InstantResult } from '../src/instant-report'
import { EMPTY_TAX, type TaxInput } from '../src/tax-comparison'
import { parseAddressCandidate, type AddressCandidate } from '../src/address-candidate'

type Flow = {
  taxInput: TaxInput
  setTaxInput: (input: TaxInput) => void
  draft: InstantInput | null
  setDraft: (draft: InstantInput) => void
  result: InstantResult | null
  setResult: (result: InstantResult | null) => void
  confirmedAddress: AddressCandidate | null
  setConfirmedAddress: (address: AddressCandidate | null) => void
}
const Context = createContext<Flow | null>(null)

const ADDRESS_KEY = 'binzip-confirmed-address'

/** Keep the confirmed address in this tab until it is changed or the tab is closed. */
export function InstantFlowProvider({ children }: { children: ReactNode }) {
  const [taxInput, setTaxInput] = useState<TaxInput>(EMPTY_TAX)
  const [draft, setDraft] = useState<InstantInput | null>(null)
  const [result, setResult] = useState<InstantResult | null>(null)
  const [confirmedAddress, updateConfirmedAddress] = useState<AddressCandidate | null>(null)
  useEffect(() => {
    try {
      const raw = JSON.parse(sessionStorage.getItem(ADDRESS_KEY) ?? 'null')
      if (!raw || typeof raw.query !== 'string') return
      const restored = parseAddressCandidate({ found: true, pnu: raw.pnu, jibunAddress: raw.address, roadAddress: raw.roadAddress, matchQuality: raw.quality, x: raw.x, y: raw.y }, raw.query)
      if (restored) updateConfirmedAddress(restored)
    } catch { /* Browser storage may be unavailable; client navigation still works. */ }
  }, [])
  const setConfirmedAddress = (address: AddressCandidate | null) => {
    updateConfirmedAddress(address)
    try {
      if (address) sessionStorage.setItem(ADDRESS_KEY, JSON.stringify(address))
      else sessionStorage.removeItem(ADDRESS_KEY)
    } catch { /* Keep the in-memory address when browser storage is unavailable. */ }
  }
  return <Context.Provider value={{ taxInput, setTaxInput, draft, setDraft, result, setResult, confirmedAddress, setConfirmedAddress }}>{children}</Context.Provider>
}

export function useInstantFlow() {
  const flow = useContext(Context)
  if (!flow) throw new Error('InstantFlowProvider is required')
  return flow
}
