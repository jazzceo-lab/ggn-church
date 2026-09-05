"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { buildBibleLink } from "@/lib/bibleBooks";
import KakaoShareButton from "@/components/KakaoShareButton";

function hymnNumberFrom(text) {
  const match = text?.match(/(\d{1,3})\s*장/);
  return match ? match[1] : null;
}

function gyodokmunNumberFrom(text) {
  const match = text?.match(/(\d{1,3})\s*번/);
  return match ? match[1] : null;
}

// "조태형 집사"처럼 "이름 + 직함" 형식이므로 첫 단어를 이름으로 보고
// 가입된 회원 중 같은 이름이 있으면 매칭한다.
function findMemberIdByName(detail, members) {
  const name = detail?.trim().split(/\s+/)[0];
  if (!name) return null;
  return members.find((m) => m.display_name === name)?.id ?? null;
}

// "사무엘기상 16:6~13 · 양혜림 집사" 처럼 성경 구절과 봉독자 이름을
// "·"로 구분해 적는 형식이라, 둘을 나눠서 각각 링크로 만든다.
function splitBibleReading(detail) {
  if (!detail) return { refPart: "", namePart: "" };
  const [refPart, namePart] = detail.split("·").map((s) => s.trim());
  return { refPart: refPart ?? "", namePart: namePart ?? "" };
}

// 이전에는 여기에 주보 내용을 코드로 직접 추가했지만, 이제는 관리자가 /admin/content
// 화면에서 등록한 bulletins 테이블 내용을 불러와서 보여준다.
function formatKoreanDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}. ${m}. ${d}`;
}

// 기도제목 카드에만 쓰는 오솔길 일러스트 배경. 사진 대신 앱 색상만으로 그려서
// 화면 톤과 항상 어울리고 글씨 대비에도 영향이 없다. 폰에서는 카드가 세로로
// 길쭉해서, 나무들이 옆으로 잘려나가지 않도록 세로 비율(viewBox)로 그렸다.
function PrayerPathBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <circle cx="150" cy="26" r="60" className="fill-[var(--brand-tint)]" />
        <polygon points="120,420 180,420 158,20 142,20" className="fill-[var(--brand)] opacity-[0.14]" />
        <polygon points="118,70 132,70 125,48" className="fill-[var(--brand-dark)] opacity-[0.09]" />
        <polygon points="168,70 182,70 175,48" className="fill-[var(--brand-dark)] opacity-[0.09]" />
        <polygon points="102,110 122,110 112,76" className="fill-[var(--brand-dark)] opacity-[0.09]" />
        <polygon points="178,110 198,110 188,76" className="fill-[var(--brand-dark)] opacity-[0.09]" />
        <polygon points="80,165 108,165 94,118" className="fill-[var(--brand-dark)] opacity-[0.14]" />
        <polygon points="192,165 220,165 206,118" className="fill-[var(--brand-dark)] opacity-[0.14]" />
        <polygon points="60,225 94,225 77,168" className="fill-[var(--brand-dark)] opacity-[0.14]" />
        <polygon points="206,225 240,225 223,168" className="fill-[var(--brand-dark)] opacity-[0.14]" />
        <polygon points="26,300 74,300 50,220" className="fill-[var(--brand-dark)] opacity-20" />
        <polygon points="226,300 274,300 250,220" className="fill-[var(--brand-dark)] opacity-20" />
        <polygon points="-20,400 40,400 10,290" className="fill-[var(--brand-dark)] opacity-20" />
        <polygon points="260,400 320,400 290,290" className="fill-[var(--brand-dark)] opacity-20" />
      </svg>
    </div>
  );
}

function BulletinContent({ bulletin, members }) {
  return (
    <>
      <section className="mt-6 rounded-xl border border-black/10 bg-emerald-50 p-5 dark:border-white/10 dark:bg-emerald-900/15">
        <h2 className="font-serif font-semibold text-foreground">교회소식</h2>
        <ol className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
          {bulletin.news.map((n, i) => (
            <li key={i}>
              {i + 1}. {n}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-emerald-50 p-5 dark:border-white/10 dark:bg-emerald-900/15">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif font-semibold text-foreground">예배순서</h2>
          <p className="text-sm text-foreground/50">오전 11:30 · 인도 임원일 목사</p>
        </div>
        <ul className="mt-3 divide-y divide-black/5 text-sm dark:divide-white/10">
          {bulletin.order.map(([label, detail], i) => {
            const hymnNumber = label === "찬송" ? hymnNumberFrom(detail) : null;
            const gyodokmunNumber = label === "교독문" ? gyodokmunNumberFrom(detail) : null;
            const isBibleReading = label === "성경봉독";
            const { refPart, namePart } = isBibleReading
              ? splitBibleReading(detail)
              : { refPart: "", namePart: "" };
            const bibleLink = isBibleReading ? buildBibleLink(refPart) : null;
            const readerMemberId = isBibleReading ? findMemberIdByName(namePart, members) : null;
            const isConfession = label === "신앙고백" && detail === "사도신경";
            const prayerMemberId =
              label === "기도" || label === "헌금기도" ? findMemberIdByName(detail, members) : null;
            return (
              <li key={i} className="flex items-start gap-2 py-2 tracking-tight">
                <span className="w-[68px] shrink-0 font-medium text-foreground/80">{label}</span>
                {hymnNumber ? (
                  <Link
                    href={`/hymns?open=${hymnNumber}`}
                    className="flex-1 text-right text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                  >
                    {detail}
                  </Link>
                ) : gyodokmunNumber ? (
                  <Link
                    href={`/gyodokmun?open=${gyodokmunNumber}`}
                    className="flex-1 text-right text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                  >
                    {detail}
                  </Link>
                ) : isBibleReading ? (
                  <span className="flex-1 text-right text-foreground/60">
                    {bibleLink ? (
                      <a
                        href={bibleLink}
                        className="text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                      >
                        {refPart}
                      </a>
                    ) : (
                      refPart
                    )}
                    {namePart && (
                      <>
                        {" · "}
                        {readerMemberId ? (
                          <Link
                            href={`/messages/${readerMemberId}`}
                            className="text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                          >
                            {namePart}
                          </Link>
                        ) : (
                          namePart
                        )}
                      </>
                    )}
                  </span>
                ) : isConfession ? (
                  <Link
                    href="/confession"
                    className="flex-1 text-right text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                  >
                    {detail}
                  </Link>
                ) : prayerMemberId ? (
                  <Link
                    href={`/messages/${prayerMemberId}`}
                    className="flex-1 text-right text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                  >
                    {detail}
                  </Link>
                ) : (
                  <span className="flex-1 text-right text-foreground/60">{detail}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-brand-tint/60 p-5 dark:border-white/10">
        <p className="text-sm font-medium text-brand-dark">{bulletin.theme.year}</p>
        <p className="mt-1 font-serif text-lg font-semibold text-foreground">
          &ldquo;{bulletin.theme.verse}&rdquo;
        </p>
        <ol className="mt-4 space-y-1 text-sm text-foreground/70">
          {bulletin.theme.goals.map((goal, i) => (
            <li key={i}>
              {i + 1}. {goal}
            </li>
          ))}
        </ol>
      </section>

      <section className="relative mt-6 overflow-hidden rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <PrayerPathBackground />
        <div className="relative">
          <h2 className="font-serif font-semibold text-foreground">기도제목</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
            {bulletin.prayers.map((p, i) => (
              <li key={i}>· {p}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">섬김이</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {bulletin.staff.map(([role, names]) => (
            <div key={role} className="flex gap-2">
              <dt className="w-24 shrink-0 text-foreground/50">{role}</dt>
              <dd className="text-foreground/80">{names}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

export default function BulletinPage() {
  const { user, isAdmin } = useAuth();
  const [bulletins, setBulletins] = useState([]);
  const [bulletinsLoading, setBulletinsLoading] = useState(true);
  const [bulletinsError, setBulletinsError] = useState(false);
  const [openIssue, setOpenIssue] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    supabase
      .from("bulletins")
      .select("id, issue, bulletin_date, content")
      .order("bulletin_date", { ascending: false })
      .order("id", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("주보 조회 실패:", error.message);
          setBulletinsError(true);
          setBulletinsLoading(false);
          return;
        }
        setBulletins(
          (data ?? []).map((row) => ({
            issue: row.issue,
            date: formatKoreanDate(row.bulletin_date),
            ...row.content,
          }))
        );
        setBulletinsLoading(false);
      });
  }, []);

  const [current, ...past] = bulletins;

  // 예배순서의 "기도" 담당자 이름이 가입된 회원이면 바로 쪽지를 보낼 수 있게
  // 회원 목록을 미리 불러온다. 로그인해야 조회 가능(member_directory RLS).
  useEffect(() => {
    if (!user) {
      setMembers([]);
      return;
    }
    supabase
      .from("member_directory")
      .select("id, display_name")
      .then(({ data, error }) => {
        if (error) console.error("회원 명단 조회 실패:", error.message);
        setMembers(data ?? []);
      });
  }, [user]);

  if (bulletinsLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
        <h1 className="font-serif text-2xl font-bold text-foreground">주보</h1>
        <p className="mt-4 text-sm text-foreground/50">불러오는 중...</p>
      </main>
    );
  }

  if (bulletinsError) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
        <h1 className="font-serif text-2xl font-bold text-foreground">주보</h1>
        <p className="mt-4 text-sm text-red-600">
          주보를 불러오지 못했어요. 새로고침해서 다시 시도해주세요.
        </p>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
        <h1 className="font-serif text-2xl font-bold text-foreground">주보</h1>
        <p className="mt-4 text-sm text-foreground/50">
          등록된 주보가 없어요.
          {isAdmin && (
            <>
              {" "}
              <Link href="/admin/content" className="text-brand-dark underline">
                콘텐츠 관리에서 등록하기
              </Link>
            </>
          )}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-foreground">주보</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-foreground/50">
            {current.issue} · {current.date}
          </p>
          <KakaoShareButton
            title={`길가는교회 주보 (${current.issue})`}
            description={current.theme.verse}
            url="https://ggnch.shop/bulletin"
          />
        </div>
      </div>

      {isAdmin && (
        <Link href="/admin/content" className="mt-2 inline-block text-xs text-brand-dark underline">
          주보 내용 수정하기 (콘텐츠 관리)
        </Link>
      )}

      <BulletinContent bulletin={current} members={members} />

      {past.length > 0 && (
        <section className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <h2 className="font-serif text-lg font-semibold text-foreground">지난 주보</h2>
          <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
            {past.map((b) => (
              <li key={b.issue}>
                <button
                  onClick={() => setOpenIssue(openIssue === b.issue ? null : b.issue)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span className="font-medium text-foreground">
                    {b.issue} · {b.date}
                  </span>
                  <span className="text-foreground/40">{openIssue === b.issue ? "숨기기" : "보기"}</span>
                </button>
                {openIssue === b.issue && (
                  <div className="px-4 pb-6">
                    <BulletinContent bulletin={b} members={members} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
