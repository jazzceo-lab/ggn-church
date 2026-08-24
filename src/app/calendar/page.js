"use client";

import { useMemo, useState } from "react";

const events = [
  { date: "2026-08-23", title: "당회", time: "오후 3:30" },
  { date: "2026-08-28", title: "금요기도회", time: "저녁 8:00" },
  { date: "2026-08-30", title: "주일예배", time: "오전 11:30" },
  { date: "2026-09-05", title: "청소년부·청년부 찬양 집회", time: "저녁 7:00" },
  { date: "2026-09-06", title: "구역장 성경공부 개강", time: "오후 4:00" },
  { date: "2026-09-06", title: "백향숲 개강", time: "오후 2:00" },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthCells(year, month) {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of events) {
      (map[e.date] ??= []).push(e);
    }
    return map;
  }, []);

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedEvents = eventsByDate[selected] ?? [];

  function changeMonth(delta) {
    setCursor(new Date(year, month + delta, 1));
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">교회 일정</h1>
      <p className="mt-2 text-sm text-foreground/50">
        예시 일정입니다. 다음 단계에서 관리자가 직접 일정을 추가/삭제할 수 있게 연결할 예정이에요.
      </p>

      <div className="mt-8 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="이전 달"
            className="rounded-full p-2 text-foreground/60 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            ‹
          </button>
          <p className="font-serif font-semibold text-foreground">
            {year}년 {month + 1}월
          </p>
          <button
            onClick={() => changeMonth(1)}
            aria-label="다음 달"
            className="rounded-full p-2 text-foreground/60 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-foreground/50">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const key = toDateKey(year, month, day);
            const dayEvents = eventsByDate[key] ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? "bg-brand text-white"
                    : isToday
                      ? "bg-brand-tint text-brand-dark"
                      : "text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <span>{day}</span>
                {dayEvents.length > 0 && (
                  <span
                    className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-brand"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">{selected} 일정</h2>
        {selectedEvents.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">이 날은 등록된 일정이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5 dark:divide-white/10">
            {selectedEvents.map((e) => (
              <li key={e.title} className="flex items-center justify-between gap-4 py-2">
                <p className="font-medium text-foreground">{e.title}</p>
                <span className="text-sm text-foreground/60">{e.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
