"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import { uploadFileWithRetry } from "@/lib/uploadWithRetry";
import { resizeImageFile } from "@/lib/resizeImage";

export default function ChurchInfoPage() {
  const { loading: authLoading, isAdmin, churchId } = useAuth();
  const [formData, setFormData] = useState({
    churchName: "",
    address: "",
    phoneNumber: "",
    email: "",
    description: "",
  });
  const [mainPhotos, setMainPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!churchId) return;
    loadChurchInfo();
    loadMainPhotos();
  }, [churchId]);

  async function loadChurchInfo() {
    const { data } = await supabase
      .from("church_info")
      .select("*")
      .eq("church_id", churchId)
      .single();

    if (data) {
      setFormData({
        churchName: data.church_name || "",
        address: data.address || "",
        phoneNumber: data.phone_number || "",
        email: data.email || "",
        description: data.description || "",
      });
    }
  }

  async function loadMainPhotos() {
    const { data, error } = await supabase
      .from("church_main_photos")
      .select("*")
      .eq("church_id", churchId)
      .order("order_index", { ascending: true });

    if (!error) {
      setMainPhotos(data || []);
    }
  }

  async function handleAddPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const resized = await resizeImageFile(file);
      const path = safeStoragePath(`${churchId}/main-photos`, resized.name);
      const { error: uploadError } = await uploadFileWithRetry("attachments", path, resized);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("attachments").getPublicUrl(path);
      const newPhoto = {
        church_id: churchId,
        photo_url: publicData.publicUrl,
        title: "",
        description: "",
        order_index: mainPhotos.length,
      };

      const { data: insertedData, error: insertError } = await supabase
        .from("church_main_photos")
        .insert([newPhoto])
        .select();

      if (insertError) throw insertError;

      setMainPhotos([...mainPhotos, insertedData[0]]);
      setMessage("사진이 추가되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`사진 업로드 실패: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemovePhoto(id) {
    if (!window.confirm("이 사진을 삭제할까요?")) return;

    try {
      const { error } = await supabase
        .from("church_main_photos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMainPhotos(mainPhotos.filter((p) => p.id !== id));
      setMessage("사진이 삭제되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`삭제 실패: ${error.message}`);
    }
  }

  function handleDragStart(e, id) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, targetId) {
    e.preventDefault();
    if (draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = mainPhotos.findIndex((p) => p.id === draggedId);
    const targetIndex = mainPhotos.findIndex((p) => p.id === targetId);

    const newPhotos = [...mainPhotos];
    const [removed] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(targetIndex, 0, removed);

    const reordered = newPhotos.map((p, idx) => ({ ...p, order_index: idx }));
    setMainPhotos(reordered);
    setDraggedId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 기본정보 저장
      const { error: infoError } = await supabase
        .from("church_info")
        .upsert({
          church_id: churchId,
          church_name: formData.churchName,
          address: formData.address,
          phone_number: formData.phoneNumber,
          email: formData.email,
          description: formData.description,
          updated_at: new Date().toISOString(),
        });

      if (infoError) throw infoError;

      // 메인사진 순서 업데이트
      for (const photo of mainPhotos) {
        await supabase
          .from("church_main_photos")
          .update({ order_index: photo.order_index, title: photo.title })
          .eq("id", photo.id);
      }

      setMessage("저장되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoTitleChange = (id, title) => {
    setMainPhotos(mainPhotos.map((p) => (p.id === id ? { ...p, title } : p)));
  };

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">관리자 전용</h1>
        <p className="mt-3 text-sm text-foreground/60">관리자만 볼 수 있는 페이지예요.</p>
        <Link href="/admin" className="mt-6 inline-block text-brand-dark underline">
          관리자 대시보드로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground">교회 기본정보</h1>
        <p className="mt-2 text-sm text-foreground/50">교회의 로고, 사진, 주소, 전화번호 등을 관리하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본정보 섹션 */}
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">교회명</label>
              <input
                type="text"
                name="churchName"
                value={formData.churchName}
                onChange={handleChange}
                placeholder="교회 이름을 입력하세요"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">주소</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="교회 주소를 입력하세요"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">전화번호</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="예: 02-1234-5678"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="교회 이메일을 입력하세요"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="교회에 대한 간단한 설명을 입력하세요"
                rows={4}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>
        </div>

        {/* 메인사진 섹션 */}
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-foreground">📸 메인사진</h2>
            <label className="cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50">
              {uploading ? "업로드 중..." : "+ 사진 추가"}
              <input
                type="file"
                accept="image/*"
                onChange={handleAddPhoto}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {mainPhotos.length === 0 ? (
            <p className="text-sm text-foreground/50">메인사진이 없습니다. 추가해주세요.</p>
          ) : (
            <div className="space-y-2">
              {mainPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, photo.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, photo.id)}
                  className={`flex items-center gap-3 rounded-lg border border-black/10 p-3 transition-all dark:border-white/10 ${
                    draggedId === photo.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="text-foreground/40">☰</div>
                  <img src={photo.photo_url} alt="메인사진" className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={photo.title}
                      onChange={(e) => handlePhotoTitleChange(photo.id, e.target.value)}
                      placeholder={`사진 제목 (${idx + 1})`}
                      className="w-full rounded border border-black/10 bg-white/50 px-2 py-1 text-sm dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith("오류") || message.startsWith("삭제 실패") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장하기"}
          </button>
          <Link href="/admin" className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5">
            돌아가기
          </Link>
        </div>
      </form>
    </main>
  );
}
