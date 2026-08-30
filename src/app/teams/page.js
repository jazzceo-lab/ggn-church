"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { districts } from "@/lib/teamRoster";

const choir = [
  ["지휘", "나혜라"],
  ["반주", "최진아"],
  ["소프라노", "김윤주 송은옥 오현주 윤진영 이아소 황혜경 황희경"],
  ["알토", "공미석 김인애 김호숙 김희선 조미경 조윤이 최지원"],
  ["테너", "김상진 김지현 노희일 유헌 서홍욱 이형진 장성철"],
  ["베이스", "김용민 김윤태 오창섭 임상주 조태형 주현진 최학수"],
];

const departments = [
  {
    name: "영유아부",
    leads: [
      ["부장", "여정숙"],
      ["부감", "임선미"],
      ["지도권사", "김정숙"],
    ],
    teachers: "김경준 김안나 박지선 배윤경 양유라 양유진 원지혜 조희애",
  },
  {
    name: "아동부",
    leads: [
      ["부장", "변수연"],
      ["부감", "신유정"],
      ["지도권사", "이명순"],
    ],
    teachers: "박준홍 배예지 손정은 윤혜미 이다혜 이은혜 최인서 최현희",
  },
  {
    name: "청소년부",
    leads: [
      ["부장", "최현"],
      ["부감", "윤슬기"],
      ["지도권사", "허정숙"],
    ],
    teachers: "김홍일 임다은 배은영 정하은 정하영 이성빈",
  },
  {
    name: "청년부",
    leads: [
      ["부장", "유헌"],
      ["부감", "조윤이"],
      ["지도권사", "이종남"],
    ],
  },
  {
    name: "장년부",
    leads: [
      ["부장", "신경희"],
      ["부감", "봉길선"],
    ],
  },
  {
    name: "백향숲",
    leads: [
      ["부장", "김택영"],
      ["부감", "김호숙"],
    ],
  },
  {
    name: "새가족부",
    leads: [
      ["부장", "임상주"],
      ["부감", "황희경"],
    ],
  },
];

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
      <p className="mt-2 text-sm text-foreground/50">로그인한 교인에게만 보이는 페이지입니다.</p>

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
