"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { districts, CHOIR as choir, DEPARTMENTS as departments } from "@/lib/teamRoster";

function Card({ title, children }) {
  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <h2 className="font-serif font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

// 이름이 가입회원 명단에 있으면 클릭해서 바로 쪽지를 보낼 수 있게 이어준다.
function Names({ text, directory }) {
  const names = text.split(/\s+/).filter(Boolean);
  return names.map((name, i) => {
    const id = directory.get(name);
    return (
      <span key={i}>
        {i > 0 && " "}
        {id ? (
          <Link
            href={`/messages/${id}`}
            className="text-brand-dark underline decoration-brand-dark/40 underline-offset-2 hover:text-brand"
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </span>
    );
  });
}

export default function TeamsPage() {
  const { user, loading } = useAuth();
  const [directory, setDirectory] = useState(new Map());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("member_directory")
      .select("id, display_name")
      .neq("id", user.id)
      .then(({ data, error }) => {
        if (error) console.error("회원 명단 조회 실패:", error.message);
        setDirectory(new Map((data ?? []).map((m) => [m.display_name, m.id])));
      });
  }, [user]);

  if (loading) {
    return <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12" />;
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">제직명단·구역 편성</h1>
        <p className="mt-3 text-sm text-foreground/60">
          교우님들의 개인정보 보호를 위해 로그인한 교인만 볼 수 있어요.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          로그인하러 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">2026년 제직명단·구역 편성</h1>
      <p className="mt-2 text-sm text-foreground/50">
        로그인한 교인에게만 보이는 페이지입니다.
        <br />
        (교인이름을 누르면 GGN톡 실행)
      </p>

      <Card title="성가대">
        <dl className="mt-3 space-y-1 text-sm">
          {choir.map(([role, names]) => (
            <div key={role} className="flex gap-2">
              <dt className="w-20 shrink-0 text-foreground/50">{role}</dt>
              <dd className="text-foreground/80">
                <Names text={names} directory={directory} />
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {departments.map((dept) => (
        <Card key={dept.name} title={dept.name}>
          <dl className="mt-3 space-y-1 text-sm">
            {dept.leads.map(([role, name]) => (
              <div key={role} className="flex gap-2">
                <dt className="w-20 shrink-0 text-foreground/50">{role}</dt>
                <dd className="text-foreground/80">
                  <Names text={name} directory={directory} />
                </dd>
              </div>
            ))}
            {dept.teachers && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-foreground/50">교사</dt>
                <dd className="text-foreground/80">
                  <Names text={dept.teachers} directory={directory} />
                </dd>
              </div>
            )}
          </dl>
        </Card>
      ))}

      <Card title="구역 편성표">
        <ul className="mt-3 divide-y divide-black/5 text-sm dark:divide-white/10">
          {districts.map(([district, leader, members]) => (
            <li key={district} className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-3">
              <span className="w-32 shrink-0 whitespace-nowrap font-medium text-foreground/80">
                {district} · <Names text={leader} directory={directory} />
              </span>
              <span className="text-foreground/60">
                <Names text={members} directory={directory} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
