"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [avatarPath, setAvatarPath] = useState(null);
  const [phoneRest, setPhoneRest] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyBulletin, setNotifyBulletin] = useState(true);
  const [notifyBoardDistrict, setNotifyBoardDistrict] = useState(true);
  const [notifyBoardPrayer, setNotifyBoardPrayer] = useState(true);
  const [notifyBoardShare, setNotifyBoardShare] = useState(true);
  const [notifyBoardSuggestion, setNotifyBoardSuggestion] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select(
        "avatar_path, phone, notify_messages, notify_bulletin, notify_board_district, notify_board_prayer, notify_board_share, notify_board_suggestion"
      )
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setAvatarPath(data?.avatar_path ?? null);
        setPhoneRest(data?.phone?.replace(/^010-/, "") ?? "");
        setNotifyMessages(data?.notify_messages ?? true);
        setNotifyBulletin(data?.notify_bulletin ?? true);
        setNotifyBoardDistrict(data?.notify_board_district ?? true);
        setNotifyBoardPrayer(data?.notify_board_prayer ?? true);
        setNotifyBoardShare(data?.notify_board_share ?? true);
        setNotifyBoardSuggestion(data?.notify_board_suggestion ?? true);
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

  async function handleNotifyToggle(column, value, setter) {
    setter(value);
    setNotifySaving(true);
    const { error: notifyError } = await supabase
      .from("profiles")
      .update({ [column]: value })
      .eq("id", user.id);
    setNotifySaving(false);
    if (notifyError) {
      setter(!value);
      window.alert("알림 설정 변경에 실패했어요: " + notifyError.message);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword.length < 6) {
      setPwError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("새 비밀번호가 서로 일치하지 않아요.");
      return;
    }

    setPwSaving(true);
    const { error: pwUpdateError } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);

    if (pwUpdateError) {
      setPwError("변경에 실패했어요: " + pwUpdateError.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPwSuccess(true);
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    if (
      !window.confirm(
        "정말 탈퇴하시겠어요?\n작성한 글, 쪽지 등 모든 정보가 삭제되며 되돌릴 수 없어요."
      )
    )
      return;
    if (!window.confirm("한 번 더 확인할게요. 정말로 탈퇴를 진행할까요?")) return;

    setDeleting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
    });
    const data = await res.json();

    if (!res.ok) {
      setDeleting(false);
      setDeleteError("탈퇴에 실패했어요: " + (data.error ?? "알 수 없는 오류"));
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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
        프로필 사진을 등록해두면 다른 교인들이 알아보기 쉬워요.
        <br />
        (핸드폰 번호는 노출되지 않으며 교회에서 단체문자 발송시에만 참고)
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

      {!loading && (
        <div className="mt-6 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
          <h2 className="font-medium text-foreground">알림 설정</h2>
          <p className="text-sm text-foreground/50">받고 싶은 알림만 골라서 켜둘 수 있어요.</p>

          <label className="flex items-center justify-between gap-3 text-sm text-foreground/80">
            쪽지 알림
            <input
              type="checkbox"
              checked={notifyMessages}
              disabled={notifySaving}
              onChange={(e) => handleNotifyToggle("notify_messages", e.target.checked, setNotifyMessages)}
              className="h-5 w-5 accent-brand"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm text-foreground/80">
            주보 등록 알림
            <input
              type="checkbox"
              checked={notifyBulletin}
              disabled={notifySaving}
              onChange={(e) => handleNotifyToggle("notify_bulletin", e.target.checked, setNotifyBulletin)}
              className="h-5 w-5 accent-brand"
            />
          </label>
          <div className="pt-1">
            <p className="text-sm text-foreground/80">게시판 새 글 알림</p>
            <div className="mt-2 space-y-2 pl-3">
              <label className="flex items-center justify-between gap-3 text-sm text-foreground/70">
                구역게시판
                <input
                  type="checkbox"
                  checked={notifyBoardDistrict}
                  disabled={notifySaving}
                  onChange={(e) =>
                    handleNotifyToggle("notify_board_district", e.target.checked, setNotifyBoardDistrict)
                  }
                  className="h-5 w-5 accent-brand"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-foreground/70">
                기도게시판
                <input
                  type="checkbox"
                  checked={notifyBoardPrayer}
                  disabled={notifySaving}
                  onChange={(e) =>
                    handleNotifyToggle("notify_board_prayer", e.target.checked, setNotifyBoardPrayer)
                  }
                  className="h-5 w-5 accent-brand"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-foreground/70">
                나눔게시판
                <input
                  type="checkbox"
                  checked={notifyBoardShare}
                  disabled={notifySaving}
                  onChange={(e) => handleNotifyToggle("notify_board_share", e.target.checked, setNotifyBoardShare)}
                  className="h-5 w-5 accent-brand"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-foreground/70">
                교회건의
                <input
                  type="checkbox"
                  checked={notifyBoardSuggestion}
                  disabled={notifySaving}
                  onChange={(e) =>
                    handleNotifyToggle("notify_board_suggestion", e.target.checked, setNotifyBoardSuggestion)
                  }
                  className="h-5 w-5 accent-brand"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <form
          onSubmit={handlePasswordChange}
          className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <h2 className="font-medium text-foreground">비밀번호 변경</h2>

          <div>
            <label className="block text-sm text-foreground/60">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6자 이상"
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground/60">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="한 번 더 입력"
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>

          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-brand-dark">비밀번호를 변경했어요.</p>}

          <button
            type="submit"
            disabled={pwSaving}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {pwSaving ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      )}

      {!loading && (
        <div className="mt-6 space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/40 dark:bg-red-900/10">
          <h2 className="font-medium text-red-700 dark:text-red-300">회원 탈퇴</h2>
          <p className="text-sm text-foreground/60">
            탈퇴하면 계정과 작성한 글, 쪽지 등 모든 정보가 삭제되며 되돌릴 수 없어요.
          </p>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            {deleting ? "탈퇴 처리 중..." : "회원 탈퇴"}
          </button>
        </div>
      )}
    </main>
  );
}
