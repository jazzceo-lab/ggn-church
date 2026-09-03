"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { pathLabel, BOARD_CATEGORY_LABELS } from "@/lib/pageLabels";

const PERIODS = [
  { key: "7", label: "최근 7일" },
  { key: "30", label: "최근 30일" },
  { key: "all", label: "전체" },
];

function BarList({ rows, total }) {
  if (rows.length === 0) {
    return <p className="text-sm text-foreground/50">아직 쌓인 방문 기록이 없어요.</p>;
  }
  return (
    <ul className="mt-3 space-y-2">
      {rows.map(({ label, count }) => (
        <li key={label}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{label}</span>
            <span className="text-foreground/50">{count}회</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminStatsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [pageRows, setPageRows] = useState([]);
  const [boardRows, setBoardRows] = useState([]);

  async function load() {
    setLoading(true);

    let query = supabase.from("page_views").select("path, detail, created_at");
    if (period !== "all") {
      const cutoff = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", cutoff);
    }
    const { data } = await query;
    const rows = data ?? [];

    const pageCounts = {};
    const boardCounts = {};
    for (const r of rows) {
      if (r.path === "/board") {
        const label = BOARD_CATEGORY_LABELS[r.detail] ?? r.detail ?? "기타";
        boardCounts[label] = (boardCounts[label] ?? 0) + 1;
      } else {
        const label = pathLabel(r.path) ?? r.path;
        pageCounts[label] = (pageCounts[label] ?? 0) + 1;
      }
    }

    const toSortedList = (obj) =>
      Object.entries(obj)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    setPageRows(toSortedList(pageCounts));
    setBoardRows(toSortedList(boardCounts));
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, period]);

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">방문 통계</h1>
        <p className="mt-3 text-sm text-foreground/60">관리자만 볼 수 있는 페이지예요.</p>
        {!user && (
          <Link href="/login" className="mt-6 inline-block text-brand-dark underline">
            로그인하러 가기
          </Link>
        )}
      </main>
    );
  }

  const pageTotal = pageRows.reduce((sum, r) => sum + r.count, 0);
  const boardTotal = boardRows.reduce((sum, r) => sum + r.count, 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">방문 통계</h1>
      <p className="mt-2 text-sm text-foreground/50">
        로그인한 회원의 페이지 방문을 기록해서 집계해요(관리자 화면은 집계에서 제외).
      </p>

      <div className="mt-4 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              period === p.key
                ? "border-brand bg-brand text-white"
                : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-foreground/50">불러오는 중...</p>
      ) : (
        <>
          <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-serif font-semibold text-foreground">게시판 카테고리별 방문</h2>
            <BarList rows={boardRows} total={boardTotal} />
          </section>

          <section className="mt-4 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-serif font-semibold text-foreground">전체 페이지 방문</h2>
            <BarList rows={pageRows} total={pageTotal} />
          </section>
        </>
      )}
    </main>
  );
}
