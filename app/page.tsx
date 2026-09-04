export default function Home() {
  return (
    <main className="mx-auto max-w-[68ch] px-6 py-16">
      <p className="text-sm text-muted">빈집이력서</p>

      <h1 className="mt-6 text-[32px] md:text-[52px]">
        그 집, 이제 정리합시다
      </h1>

      <p className="mt-6 max-w-[60ch]">
        포항에 비어 있는 집이 있으신가요. 주소만 넣으시면 지금 그 집을 어떤 방법으로
        쓸 수 있는지 한 장으로 정리해 드립니다.
      </p>

      <div className="unverified mt-10 rounded-[4px] p-5 text-sm">
        <p className="font-semibold">[미확인] 준비 중입니다</p>
        <p className="mt-2">
          이 자리에 진단 신청 폼이 들어갑니다. 배포 확인용 임시 화면입니다.
        </p>
      </div>

      <footer className="mt-16 border-t border-line pt-6 text-[13px] text-muted">
        본 서비스는 공개된 공적 자료와 현장 확인을 근거로 빈집의 처분 가능성을 정리해
        제공하며, 중개대상물의 표시·광고나 거래 알선을 하지 않습니다.
      </footer>
    </main>
  )
}
