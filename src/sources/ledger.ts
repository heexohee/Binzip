import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import type { LedgerIndex, LedgerRecord } from '../types'

const LEDGER_PATH = process.env.LEDGER_PATH ?? 'data/ledger.json'

let cache: LedgerIndex | null = null

/** ledger.json 을 1회 로드해 메모리에 상주시킨다. 5,851호 규모는 부담이 없다. */
export async function loadLedger(): Promise<LedgerIndex> {
  if (cache) return cache
  if (!existsSync(LEDGER_PATH)) {
    throw new Error(
      `${LEDGER_PATH} 가 없습니다. 먼저 'npm run ledger:build -- --in <세움터파일>' 을 실행하세요.`,
    )
  }
  cache = JSON.parse(await readFile(LEDGER_PATH, 'utf8')) as LedgerIndex
  return cache
}

export async function lookupLedger(pnu: string): Promise<LedgerRecord | null> {
  return (await loadLedger())[pnu] ?? null
}

/** W4 제외 대상: 아파트·다세대·연립은 다루지 않는다. 단독주택만. */
export function isDetachedHouse(mainPurpose: string | null): boolean {
  if (!mainPurpose) return false
  return mainPurpose.includes('단독주택')
}
