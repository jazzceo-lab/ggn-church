"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import { uploadFileWithRetry } from "@/lib/uploadWithRetry";
import { resizeImageFile } from "@/lib/resizeImage";

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
  const [photoLoading, setPhotoLoading] = useState(true);

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
    setPhotoLoading(true);
    const { data, error } = await supabase
      .from("church_main_photos")
      .select("*")
      .eq("church_id", churchId)
      .order("order_index", { ascending: true });

    if (!error) {
      setMainPhotos(data || []);
    }
    setPhotoLoading(false);
  }

  function handleAddCard() {
    const newCard = {
      id: generateTempId(),
      church_id: churchId,
      photo_url: "",
      title: "새 카드",
      description: "",
      order_index: mainPhotos.length,
      isNew: true,
    };
    setMainPhotos([...mainPhotos, newCard]);
  }

  async function handleAddPhoto(e, cardId) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const resized = await resizeImageFile(file);
      const path = safeStoragePath(`${churchId}/main-photos`, resized.name);
      const { error: uploadError } = await uploadFileWithRetry("attachments", path, resized);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("attachments").getPublicUrl(path);

      setMainPhotos(
        mainPhotos.map((p) =>
          p.id === cardId ? { ...p, photo_url: publicData.publicUrl } : p
        )
      );
      setMessage("사진이 업로드되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`사진 업로드 실패: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemoveCard(id) {
    if (!window.confirm("이 카드를 삭제할까요?")) return;

    try {
      if (!id.startsWith("temp_")) {
        const { error } = await supabase
          .from("church_main_photos")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }

      setMainPhotos(mainPhotos.filter((p) => p.id !== id));
      setMessage("카드가 삭제되었습니다.");
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

  async function handleSavePhotos() {
    try {
      // 새 카드 저장
      const newCards = mainPhotos.filter((p) => p.isNew || p.id.startsWith("temp_"));
      if (newCards.length > 0) {
        const dataToInsert = newCards.map(({ isNew, ...p }) => ({
          ...p,
          id: undefined,
        }));
        const { error: insertError } = await supabase
          .from("church_main_photos")
          .insert(dataToInsert);
        if (insertError) throw insertError;
      }

      // 기존 카드 업데이트 (순서, 제목 등)
      const existingCards = mainPhotos.filter((p) => !p.id.startsWith("temp_") && !p.isNew);
      for (const photo of existingCards) {
        await supabase
          .from("church_main_photos")
          .update({ order_index: photo.order_index, title: photo.title, description: photo.description })
          .eq("id", photo.id);
      }

      setMessage("메인사진이 저장되었습니다.");
      setTimeout(() => setMessage(""), 3000);
      loadMainPhotos();
    } catch (error) {
      setMessage(`저장 실패: ${error.message}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
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
      setMessage("교회 기본정보가 저장되었습니다.");
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

  const handleCardTitleChange = (id, title) => {
    setMainPhotos(mainPhotos.map((p) => (p.id === id ? { ...p, title } : p)));
  };

  const handleCardDescChange = (id, description) => {
    setMainPhotos(mainPhotos.map((p) => (p.id === id ? { ...p, description } : p)));
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-3 pb-12">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground">교회 기본정보</h1>
        <p className="mt-2 text-sm text-foreground/50">교회의 로고, 사진, 주소, 전화번호 등을 관리하세요.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 왼쪽: 편집 영역 */}
        <div>
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

              <button
                type="submit"
                disabled={loading}
                className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {loading ? "저장 중..." : "기본정보 저장"}
              </button>
            </div>

            {/* 메인사진 카드 편집 */}
            <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium text-foreground">📸 메인사진 카드</h2>
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark"
                >
                  + 새 카드
                </button>
              </div>

              {photoLoading ? (
                <p className="text-sm text-foreground/50">로드 중...</p>
              ) : mainPhotos.length === 0 ? (
                <p className="text-sm text-foreground/50">카드가 없습니다. 새 카드를 추가해주세요.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mainPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, photo.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, photo.id)}
                      className={`rounded-lg border border-black/10 p-4 transition-all dark:border-white/10 ${
                        draggedId === photo.id ? "opacity-50 bg-black/5" : ""
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-foreground/40">☰</span>
                        <span className="text-xs text-foreground/50">카드 {idx + 1}</span>
                      </div>

                      {photo.photo_url && (
                        <img src={photo.photo_url} alt="카드" className="mb-2 h-20 w-20 rounded object-cover" />
                      )}

                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-foreground/60">사진</label>
                          <label className="mt-1 block cursor-pointer rounded border border-black/10 px-2 py-1.5 text-center text-xs text-brand hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                            {photo.photo_url ? "사진 변경" : "사진 선택"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAddPhoto(e, photo.id)}
                              disabled={uploading}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div>
                          <label className="text-xs text-foreground/60">제목</label>
                          <input
                            type="text"
                            value={photo.title}
                            onChange={(e) => handleCardTitleChange(photo.id, e.target.value)}
                            placeholder="카드 제목"
                            className="mt-1 w-full rounded border border-black/10 bg-white/50 px-2 py-1 text-sm dark:border-white/10 dark:bg-white/5"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-foreground/60">설명</label>
                          <textarea
                            value={photo.description}
                            onChange={(e) => handleCardDescChange(photo.id, e.target.value)}
                            placeholder="카드 설명"
                            rows={2}
                            className="mt-1 w-full rounded border border-black/10 bg-white/50 px-2 py-1 text-sm dark:border-white/10 dark:bg-white/5"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveCard(photo.id)}
                        className="mt-2 w-full rounded px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleSavePhotos}
                className="mt-4 w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                💾 메인사진 저장
              </button>
            </div>
          </form>

          {message && (
            <p className={`text-sm ${message.includes("실패") || message.includes("오류") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </div>

        {/* 오른쪽: 프리뷰 영역 */}
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5 sticky top-4 h-fit">
          <h2 className="mb-4 font-medium text-foreground">📱 미리보기</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mainPhotos.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center py-8">카드를 추가하면 여기에 표시됩니다.</p>
            ) : (
              mainPhotos.map((photo) => (
                <div key={photo.id} className="rounded-lg border border-black/10 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
                  {photo.photo_url && (
                    <img src={photo.photo_url} alt={photo.title} className="mb-2 w-full rounded-lg object-cover aspect-video" />
                  )}
                  <h3 className="font-medium text-foreground text-sm">{photo.title || "제목 없음"}</h3>
                  {photo.description && (
                    <p className="mt-1 text-xs text-foreground/60 line-clamp-2">{photo.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
