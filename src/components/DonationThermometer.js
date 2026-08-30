"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DonationThermometer({ goalKey }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: goal } = await supabase
        .from("donation_goals")
        .select("title, target_amount")
        .eq("key", goalKey)
        .single();
      const { data: entries } = await supabase
        .from("donation_entries")
        .select("amount")
        .eq("goal_key", goalKey);

      setTitle(goal?.title ?? "");
      setTarget(goal?.target_amount ?? 0);
      setTotal((entries ?? []).reduce((sum, e) => sum + e.amount, 0));
      setLoading(false);
    }
    load();
  }, [goalKey]);

  if (loading || !target) return null;

  const pct = Math.min(100, Math.round((total / target) * 100));

  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="relative h-32 w-10 shrink-0">
        <div className="absolute bottom-5 left-1/2 h-24 w-5 -translate-x-1/2 overflow-hidden rounded-full border-2 border-brand bg-black/5 dark:bg-white/10">
          <div
            className="absolute bottom-0 w-full rounded-b-full bg-brand transition-all duration-700"
            style={{ height: `${pct}%` }}
          />
        </div>
        <div className="absolute bottom-0 left-1/2 h-9 w-9 -translate-x-1/2 rounded-full border-2 border-brand bg-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 font-serif text-xl font-bold text-brand-dark">
          {total.toLocaleString("ko-KR")}
          <span className="text-sm font-normal text-foreground/50">원</span>
        </p>
        <p className="mt-0.5 text-xs text-foreground/40">목표 {target.toLocaleString("ko-KR")}원</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-brand transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="mt-1 inline-block text-xs font-medium text-brand-dark">{pct}% 달성</span>
      </div>
    </div>
  );
}
