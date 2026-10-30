export function TaxTeaser() { return <div><h3>세금은 처분 전에 따로 확인해요.</h3><p>취득·상속·거주 상황에 따라 적용 조건이 달라져요. 구체적인 양도세는 세무 전문가에게 확인해 주세요.</p></div> }
export function TaxComparison() { return <TaxTeaser/> }

export function TaxPlanner({example}: {example?: boolean}) { return <section aria-label={example ? '세금 확인 안내 예시' : '세금 확인 안내'}><TaxTeaser/></section> }
