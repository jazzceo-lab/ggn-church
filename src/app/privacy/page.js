export const metadata = {
  title: "개인정보 처리방침 | 길가는교회",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">개인정보 처리방침</h1>
      <p className="mt-2 text-sm text-foreground/50">시행일자: 2026년 8월 25일</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground/80">
        <section>
          <p>
            길가는교회(이하 &ldquo;교회&rdquo;)는 길가는교회 앱(이하 &ldquo;서비스&rdquo;)을
            이용하는 교인의 개인정보를 소중히 다루며, 아래와 같이 개인정보를 수집·이용합니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            1. 수집하는 개인정보 항목
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>회원가입 시: 이메일 주소, 비밀번호, 이름, 소속 구분(구역/부서)</li>
            <li>서비스 이용 시: 게시판 글·댓글, 쪽지(1:1 메시지) 내용, 첨부파일·이미지</li>
            <li>알림 신청 시: 푸시 알림 수신을 위한 기기 구독 정보</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            2. 개인정보의 수집 및 이용 목적
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>회원 확인 및 로그인 등 서비스 이용</li>
            <li>교회소식·주보·일정 안내 및 교인 간 소통(게시판, 쪽지)</li>
            <li>쪽지 수신 등 알림 발송</li>
            <li>부정 이용 방지 및 서비스 운영·관리</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            3. 개인정보의 보유 및 이용 기간
          </h2>
          <p className="mt-2">
            회원 탈퇴 또는 계정 삭제 시까지 보유하며, 삭제 요청 시 지체 없이 파기합니다. 관계
            법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            4. 개인정보의 제3자 제공 및 처리위탁
          </h2>
          <p className="mt-2">
            교회는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않으며, 서비스 운영을 위해 아래
            업체에 처리를 위탁하고 있습니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Supabase (데이터베이스·인증·파일 저장)</li>
            <li>Vercel (웹사이트 호스팅)</li>
            <li>Resend (이메일 발송)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            5. 이용자의 권리
          </h2>
          <p className="mt-2">
            이용자는 언제든지 본인의 개인정보를 조회·수정할 수 있으며, 회원 탈퇴 및 개인정보
            삭제를 요청할 수 있습니다. 요청은 아래 문의처로 연락해 주세요.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold text-foreground">6. 문의처</h2>
          <p className="mt-2">
            길가는교회
            <br />
            경기도 부천시 원미구 중동로248번길 52, 9층
            <br />
            TEL. 032-321-9182
          </p>
        </section>
      </div>
    </main>
  );
}
