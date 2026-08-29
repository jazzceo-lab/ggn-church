import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <Image
        src="/images/logo-mark.jpg"
        alt="길가는교회 로고"
        width={64}
        height={64}
        className="rounded-full ring-1 ring-black/5"
      />
      <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-3 break-keep text-sm text-foreground/60">
        주소가 바뀌었거나 삭제된 페이지예요.
        <br />
        홈으로 돌아가서 다시 찾아보세요.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
