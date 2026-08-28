"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import { avatarUrl } from "@/lib/avatar";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

// "010-" 뒤에 이어지는 8자리만 입력받아 1234-5678 형태로 다듬는다.
function formatPhoneRest(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function isValidPhoneRest(value) {
  return /^\d{4}-\d{4}$/.test(value);
}

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [avatarPath, setAvatarPath] = useState(null);
  const [phoneRest, setPhoneRest] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("avatar_path, phone")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setAvatarPath(data?.avatar_path ?? null);
        setPhoneRest(data?.phone?.replace(/^010-/, "") ?? "");
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileChange(e) {
    const f = e.target.files?.[0] ?? null;
    setError("");
    setSuccess(false);
    if (f && !f.type.startsWith("image/")) {
      setError("이미지 파일만 첨부할 수 있어요.");
      e.target.value = "";
      setFile(null);
      return;
    }
    if (f && f.size > MAX_AVATAR_SIZE) {
      setError("사진은 5MB 이하만 첨부할 수 있어요.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmedRest = phoneRest.trim();
    if (trimmedRest && !isValidPhoneRest(trimmedRest)) {
      setError("휴대폰 번호 형식이 올바르지 않아요. 예: 1234-5678");
      return;
    }
    const fullPhone = trimmedRest ? `010-${trimmedRest}` : null;

    setSaving(true);
    let nextAvatarPath = avatarPath;

    if (file) {
      const path = safeStoragePath(`avatars/${user.id}`, file.name);
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file);
      if (uploadError) {
        setSaving(false);
        setError("사진 업로드에 실패했어요: " + uploadError.message);
        return;
      }
      nextAvatarPath = path;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ phone: fullPhone, avatar_path: nextAvatarPath })
      .eq("id", user.id);

    setSaving(false);
    if (updateError) {
      setError("저장에 실패했어요: " + updateError.message);
      return;
    }

    setAvatarPath(nextAvatarPath);
    setFile(null);
    setPhoneRest(trimmedRest);
    setSuccess(true);
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">회원정보</h1>
        <p className="mt-3 text-sm text-foreground/60">
          회원정보를 관리하려면{" "}
          <Link href="/login" className="text-brand-dark underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">회원정보</h1>
      <p className="mt-2 text-sm text-foreground/50">
        프로필 사진과 핸드폰 번호를 등록해두면 다른 교인들이 알아보기 쉬워요.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-foreground/50">불러오는 중...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex items-center gap-4">
            {previewUrl || avatarUrl(avatarPath) ? (
              <img
                src={previewUrl || avatarUrl(avatarPath)}
                alt="프로필 사진"
                className="h-20 w-20 shrink-0 rounded-full border border-black/10 object-cover dark:border-white/10"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-2xl text-foreground/30 dark:border-white/10 dark:bg-white/10">
                🙂
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
              <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                📷 사진 선택
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-foreground/40">최대 5MB</p>

          <div>
            <label className="block text-sm text-foreground/60">핸드폰 번호</label>
            <div className="mt-1 flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-white/10">
              <span className="text-sm text-foreground/60">010-</span>
              <input
                type="tel"
                value={phoneRest}
                onChange={(e) => setPhoneRest(formatPhoneRest(e.target.value))}
                placeholder="1234-5678"
                className="w-full text-sm outline-none dark:bg-transparent"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-brand-dark">저장했어요.</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </form>
      )}
    </main>
  );
}
