import Link from "next/link";

// 신청·설문은 다음 단계에서 easychurch 기능을 옮겨올 예정. 그 전까지 자리만.
export default function YouthFormsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <Link href="/youth" className="text-sm text-foreground/50 underline">
        ← 청년부
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-bold text-foreground">신청·설문</h1>
      <p className="mt-6 text-sm text-foreground/50">준비 중이에요. 곧 열릴 예정이에요.</p>
    </main>
  );
}
