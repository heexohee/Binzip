import { resolveAddress } from './address'
import { getLandChar } from './sources/landChar'
import { getHousePrice } from './sources/housePrice'
import { getLandUse } from './sources/landUse'
import { getPossession } from './sources/possession'
import { checkGates, evaluate, rulesVersion, type Context } from './rules/engine'
import { combine, type Diagnosis } from './verdict'
import type { ResolvedAddress } from './types'

export type PipelineResult =
  | { status: 'address_not_found'; query: string }
  | { status: 'out_of_scope'; query: string; address: ResolvedAddress; reason: string; gateId: string }
  | {
      status: 'ok'
      query: string
      address: ResolvedAddress
      diagnosis: Diagnosis
      facts: Context
      checkedAt: string
      rulesVersion: string
      /** 조달에 실패한 소스가 있으면 여기 남는다 */
      sourceErrors: string[]
    }

const settle = async <T,>(
  name: string,
  fn: () => Promise<T>,
  errors: string[],
): Promise<T | null> => {
  try {
    return await fn()
  } catch (e) {
    errors.push(`${name}: ${(e as Error).message}`)
    return null
  }
}

/**
 * 주소 한 줄 → 진단.
 *
 * 한 소스가 실패해도 전체를 죽이지 않는다. 실패한 축은 unknown 으로 흘러가
 * 진단서에서 점선 + [미확인] 으로 표시된다. 오류 처리가 곧 디자인 언어다.
 */
export async function diagnose(query: string): Promise<PipelineResult> {
  const errors: string[] = []
  const checkedAt = new Date().toISOString().slice(0, 10)

  const address = await resolveAddress(query)
  if (!address) return { status: 'address_not_found', query }

  const [landChar, housePrice, landUse, possession] = await Promise.all([
    settle('토지특성', () => getLandChar(address.pnu), errors),
    settle('개별주택가격', () => getHousePrice(address.pnu), errors),
    settle('토지이용규제', () => getLandUse(address.pnu), errors),
    settle('토지소유정보', () => getPossession(address.pnu), errors),
  ])

  const facts: Context = {
    pnu: address.pnu,
    sigunguCd: address.sigunguCd,
    jibunAddress: address.jibunAddress,
    roadAddress: address.roadAddress,

    useSituation: landChar?.useSituation ?? null,
    roadSide: landChar?.roadSide ?? null,
    zone1: landChar?.zone1 ?? null,
    category: landChar?.category ?? null,
    slope: landChar?.slope ?? null,
    landArea: landChar?.area ?? null,

    housePrice: housePrice?.value ?? null,
    housePriceEok: housePrice?.value ? (housePrice.value / 100_000_000).toFixed(2) : null,
    housePriceYear: housePrice?.year ?? null,

    zones: landUse?.zones ?? [],

    coOwnerCount: possession?.coOwnerCount ?? null,
    ownerResidence: possession?.ownerResidence ?? null,
    ownershipCause: possession?.ownershipCause ?? null,
    ownershipDate: possession?.ownershipDate ?? null,
  }

  const gate = checkGates(facts)
  if (gate) {
    return { status: 'out_of_scope', query, address, reason: gate.reason, gateId: gate.id }
  }

  return {
    status: 'ok',
    query,
    address,
    diagnosis: combine(evaluate(facts)),
    facts,
    checkedAt,
    rulesVersion,
    sourceErrors: errors,
  }
}
