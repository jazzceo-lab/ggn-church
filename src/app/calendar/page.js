"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import KakaoShareButton from "@/components/KakaoShareButton";
import { downloadIcs } from "@/lib/ics";
import { getHolidayName } from "@/lib/holidays";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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
  const { user, isAdmin } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formDate, setFormDate] = useState(selected);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formImage, setFormImage] = useState(null);
  const [formExistingImageUrl, setFormExistingImageUrl] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  async function loadEvents() {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, event_date, title, description, time_label, link_url, image_url")
      .order("event_date", { ascending: true });

    if (!error) setEvents(data);
    setLoadingEvents(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of events) {
      (map[e.event_date] ??= []).push(e);
    }
    return map;
  }, [events]);

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedEvents = eventsByDate[selected] ?? [];

  function changeMonth(delta) {
    setCursor(new Date(year, month + delta, 1));
  }

  function selectDate(key) {
    setSelected(key);
    setFormDate(key);
  }

  function resetForm() {
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormTime("");
    setFormLink("");
    setFormImage(null);
    setFormExistingImageUrl(null);
    setFormError("");
  }

  function toggleForm() {
    if (showForm) {
      resetForm();
    } else {
      setFormDate(selected);
    }
    setShowForm((v) => !v);
  }

  function startEdit(ev) {
    setEditingId(ev.id);
    setFormDate(ev.event_date);
    setFormTitle(ev.title);
    setFormDescription(ev.description ?? "");
    setFormTime(ev.time_label ?? "");
    setFormLink(ev.link_url ?? "");
    setFormImage(null);
    setFormExistingImageUrl(ev.image_url);
    setFormError("");
    setShowForm(true);
  }

  function handleImageChange(e) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_IMAGE_SIZE) {
      setFormError("이미지는 5MB 이하만 첨부할 수 있어요.");
      e.target.value = "";
      setFormImage(null);
      return;
    }
    setFormError("");
    setFormImage(f);
  }

  async function handleSubmitEvent(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    let imageUrl = formExistingImageUrl;
    if (formImage) {
      const path = safeStoragePath("calendar", formImage.name);
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, formImage);

      if (uploadError) {
        setSubmitting(false);
        setFormError("이미지 업로드에 실패했어요: " + uploadError.message);
        return;
      }
      imageUrl = supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      event_date: formDate,
      title: formTitle,
      description: formDescription || null,
      time_label: formTime || null,
      link_url: formLink || null,
      image_url: imageUrl,
    };

    const { error } = editingId
      ? await supabase.from("calendar_events").update(payload).eq("id", editingId)
      : await supabase.from("calendar_events").insert({ ...payload, created_by: user.id });

    setSubmitting(false);
    if (error) {
      setFormError((editingId ? "일정 수정에 실패했어요: " : "일정 등록에 실패했어요: ") + error.message);
      return;
    }
    resetForm();
    setShowForm(false);
    loadEvents();
  }

  async function handleDeleteEvent(id) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    loadEvents();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-4 pb-12">
      <h1 className="font-serif text-xl font-bold text-foreground">교회 일정</h1>

      <div className="mt-3 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
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
            const isSunday = i % 7 === 0;
            const holidayName = getHolidayName(key);
            const isSpecialDay = isSunday || Boolean(holidayName);
            return (
              <button
                key={i}
                onClick={() => selectDate(key)}
                className={`flex min-h-[56px] flex-col items-center gap-0.5 rounded-lg pt-1 text-sm transition-colors sm:min-h-[68px] ${
                  isSelected
                    ? "bg-brand text-white"
                    : isToday
                      ? `bg-brand-tint ${isSpecialDay ? "text-red-600 dark:text-red-400" : "text-brand-dark"}`
                      : isSpecialDay
                        ? "text-red-600 hover:bg-black/5 dark:text-red-400 dark:hover:bg-white/10"
                        : "text-foreground/80 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <span>{day}</span>
                {dayEvents.length > 0 ? (
                  <span className="w-full px-0.5 text-center text-[9px] leading-tight sm:text-[10px]">
                    <span className="block truncate">{dayEvents[0].title}</span>
                    {dayEvents.length > 1 && (
                      <span className={isSelected ? "text-white/80" : "text-foreground/50"}>
                        +{dayEvents.length - 1}
                      </span>
                    )}
                  </span>
                ) : holidayName ? (
                  <span
                    className={`block w-full truncate px-0.5 text-center text-[9px] leading-tight sm:text-[10px] ${
                      isSelected ? "text-white/90" : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {holidayName}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <h2 className="flex flex-wrap items-center gap-2 font-serif font-semibold text-foreground">
            {selected} 일정
            {getHolidayName(selected) && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {getHolidayName(selected)}
              </span>
            )}
          </h2>
          {isAdmin && (
            <button
              onClick={toggleForm}
              className="rounded-full bg-brand px-3 py-1.5 text-xs text-white transition-colors hover:bg-brand-dark"
            >
              {showForm ? "닫기" : "+ 일정 추가"}
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmitEvent}
            className="mt-4 space-y-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <p className="text-sm font-semibold text-foreground/80">
              {editingId ? "일정 수정" : "새 일정"}
            </p>
            <div>
              <label className="block text-xs font-medium text-foreground/60">날짜</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60">제목</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="예: 주일예배"
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60">설명 (선택)</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="일정에 대한 자세한 설명을 입력하세요"
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60">시간</label>
              <input
                type="text"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                placeholder="예: 오전 11:30"
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/60">
                관련 링크 (선택)
              </label>
              <input
                type="url"
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
                <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                  🖼️ 이미지 첨부
                </span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {formImage && <span className="text-foreground/70">{formImage.name}</span>}
              </label>
              <p className="mt-1 text-xs text-foreground/40">최대 5MB</p>
              {formExistingImageUrl && !formImage && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={formExistingImageUrl}
                    alt=""
                    className="h-12 w-12 rounded-md border border-black/10 object-cover dark:border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setFormExistingImageUrl(null)}
                    className="text-xs text-red-600 underline"
                  >
                    이미지 제거
                  </button>
                </div>
              )}
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {submitting ? "저장 중..." : editingId ? "수정 저장" : "등록"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={toggleForm}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/60 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        )}

        {loadingEvents ? (
          <p className="mt-3 text-sm text-foreground/50">불러오는 중...</p>
        ) : selectedEvents.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">이 날은 등록된 일정이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5 dark:divide-white/10">
            {selectedEvents.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{e.title}</p>
                    {e.time_label && (
                      <p className="mt-0.5 text-sm text-foreground/60">{e.time_label}</p>
                    )}
                    {e.description && (
                      <p className="mt-1 text-sm whitespace-pre-line text-foreground/70">
                        {e.description}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => startEdit(e)}
                        className="text-xs text-foreground/40 hover:text-brand-dark"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(e.id)}
                        className="text-xs text-foreground/40 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                {e.image_url && (
                  <a href={e.image_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={e.image_url}
                      alt={e.title}
                      className="mt-2 max-h-48 rounded-lg border border-black/10 object-cover dark:border-white/10"
                    />
                  </a>
                )}
                {e.link_url && (
                  <a
                    href={e.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-brand-dark underline"
                  >
                    🔗 관련 링크 바로가기
                  </a>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <KakaoShareButton
                    title={e.title}
                    description={`${e.event_date}${e.time_label ? ` · ${e.time_label}` : ""}${
                      e.description ? ` — ${e.description}` : ""
                    }`}
                    url="https://ggnch.shop/calendar"
                  />
                  <button
                    type="button"
                    onClick={() => downloadIcs(e)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    📅 캘린더에 담기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
