'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { InstantInput, InstantResult } from '../src/instant-report'

type Flow = {
  draft: InstantInput | null
  setDraft: (draft: InstantInput) => void
  result: InstantResult | null
  setResult: (result: InstantResult | null) => void
}
const Context = createContext<Flow | null>(null)

/** Keep the address across client navigation without putting it in a URL or browser storage. */
export function InstantFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<InstantInput | null>(null)
  const [result, setResult] = useState<InstantResult | null>(null)
  return <Context.Provider value={{ draft, setDraft, result, setResult }}>{children}</Context.Provider>
}

export function useInstantFlow() {
  const flow = useContext(Context)
  if (!flow) throw new Error('InstantFlowProvider is required')
  return flow
}
