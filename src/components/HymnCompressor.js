"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { resizeImageFile } from "@/lib/resizeImage";

// 찬송가 악보(645장)를 브라우저에서 다시 압축해 같은 이름으로 덮어쓴다.
// 원본은 관리자 PC에 보관되어 있어 되돌리려면 원본을 다시 올리면 된다.
const TOTAL = 645;
const OPTIONS = { maxSize: 2000, quality: 0.75 };
const pad = (n) => String(n).padStart(3, "0");
const kb = (b) => `${Math.round(b / 1024)}KB`;

async function compressOne(num) {
  const name = `${pad(num)}.jpg`;
  const { data, error } = await supabase.storage.from("hymns").download(name);
  if (error) throw error;
  const original = new File([data], name, { type: "image/jpeg" });
  const compressed = await resizeImageFile(original, OPTIONS);
  return { name, original, compressed };
}

export default function HymnCompressor() {
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handlePreview() {
    setBusy(true);
    try {
      const { original, compressed } = await compressOne(1);
      setPreview({ before: original.size, after: compressed.size, url: URL.createObjectURL(compressed) });
    } catch (e) {
      window.alert("미리보기 실패: " + e.message);
    }
    setBusy(false);
  }

  async function handleRunAll() {
    if (!window.confirm("악보 645장을 압축해서 덮어씁니다. 몇 분 걸려요. 진행할까요?")) return;
    setBusy(true);
    let before = 0, after = 0, failed = 0;
    for (let n = 1; n <= TOTAL; n++) {
      try {
        const { name, original, compressed } = await compressOne(n);
        before += original.size;
        if (compressed.size < original.size * 0.9) {
          const { error } = await supabase.storage.from("hymns").upload(name, compressed, { upsert: true, contentType: "image/jpeg" });
          if (error) throw error;
          after += compressed.size;
        } else {
          after += original.size;
        }
      } catch {
        failed++;
      }
      setProgress({ n, before, after, failed });
    }
    setBusy(false);
  }

  return (
    <section className="mt-8 rounded-xl border border-black/10 p-5 dark:border-white/10">
      <h2 className="font-semibold">🎼 찬송가 악보 압축</h2>
      <p className="mt-1 text-sm text-foreground/60">
        저장 공간을 줄이기 위해 악보를 다시 압축해요. 먼저 1장으로 화질을 확인하세요.
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={handlePreview} disabled={busy} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
          1장 미리보기
        </button>
        <button onClick={handleRunAll} disabled={busy || !preview} className="rounded-lg bg-brand px-3 py-2 text-sm text-white disabled:opacity-50">
          전체 적용
        </button>
      </div>
      {preview && (
        <div className="mt-3">
          <p className="text-sm">1장: {kb(preview.before)} → {kb(preview.after)}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt="압축 미리보기" className="mt-2 w-full rounded border" />
        </div>
      )}
      {progress && (
        <p className="mt-3 text-sm">
          {progress.n}/{TOTAL}장 · {kb(progress.before)} → {kb(progress.after)}
          {progress.failed > 0 && ` · 실패 ${progress.failed}장`}
        </p>
      )}
    </section>
  );
}
