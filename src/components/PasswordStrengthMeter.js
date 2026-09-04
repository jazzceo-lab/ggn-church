"use client";

import { passwordStrength } from "@/lib/passwordPolicy";

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const { score, label, color, text } = passwordStrength(password);

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < score ? color : "bg-black/10 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <p className={`mt-1 text-xs ${text}`}>비밀번호 강도: {label}</p>
    </div>
  );
}
