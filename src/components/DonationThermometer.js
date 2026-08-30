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
    <div className="flex flex-col items-center rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-medium text-foreground">{title}</p>

      <div className="relative mt-3 h-32 w-10 shrink-0">
        <div className="absolute bottom-5 left-1/2 h-24 w-5 -translate-x-1/2 overflow-hidden rounded-full border-2 border-brand bg-black/5 dark:bg-white/10">
          <div
            className="absolute bottom-0 w-full rounded-b-full bg-brand transition-all duration-700"
            style={{ height: `${pct}%` }}
          />
        </div>
        <div className="absolute bottom-0 left-1/2 h-9 w-9 -translate-x-1/2 rounded-full border-2 border-brand bg-brand" />
      </div>

      <span className="mt-3 rounded-full bg-green-100 px-3 py-1 font-serif text-2xl font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
        {pct}%
      </span>
    </div>
  );
}
