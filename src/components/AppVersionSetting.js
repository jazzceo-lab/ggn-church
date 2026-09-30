"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 관리자: 안드로이드 앱 "새 버전 안내" 기준 번호. 새 AAB가 Play에서 실제로 배포된 뒤 올린다
// (배포 전에 올리면 교인들이 업데이트를 눌러도 새 버전이 없음).
export default function AppVersionSetting() {
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase
      .from("app_version")
      .select("latest_version_code, update_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setCode(String(data.latest_version_code));
        setUrl(data.update_url);
      });
  }, []);

  async function save(e) {
    e.preventDefault();
    const n = parseInt(code, 10);
    if (!n || n < 1) return setMessage("버전 코드를 숫자로 입력해주세요.");
    const { error } = await supabase
      .from("app_version")
      .update({ latest_version_code: n, update_url: url.trim(), updated_at: new Date().toISOString() })
      .eq("id", 1);
    setMessage(error ? "저장 실패: " + error.message : "저장했어요. 이보다 낮은 버전의 앱에 업데이트 안내가 떠요.");
  }

  return (
    <form
      onSubmit={save}
      className="mt-8 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
    >
      <h2 className="font-medium text-foreground">📱 안드로이드 앱 새 버전 안내</h2>
      <p className="text-xs text-foreground/50">
        새 버전을 Play Console에 올리고 <b>테스터에게 제공됨</b>이 된 뒤에 그 버전 코드로 바꿔주세요.
        앱 버전이 이 숫자보다 낮으면 앱을 열 때 업데이트 안내가 떠요.
      </p>
      <label className="block text-sm text-foreground/70">
        최신 버전 코드
        <input
          type="number"
          min="1"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 w-32 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        />
      </label>
      <label className="block text-sm text-foreground/70">
        업데이트 링크
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        />
      </label>
      {message && <p className="text-sm text-foreground/70">{message}</p>}
      <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark">
        저장
      </button>
    </form>
  );
}
