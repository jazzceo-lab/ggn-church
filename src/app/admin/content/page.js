"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { linesToArray, arrayToLines, pairsToArray, arrayToPairs } from "@/lib/contentFormat";

const TABS = [
  { key: "bulletin", label: "주보" },
  { key: "verses", label: "오늘의 말씀" },
  { key: "gyodokmun", label: "교독문" },
];

function formatKoreanDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}. ${m}. ${d}`;
}

const emptyBulletinForm = {
  issue: "",
  bulletin_date: "",
  year: "",
  verse: "",
  goals: "",
  prayers: "",
  order: "",
  news: "",
  staff: "",
};

function bulletinRowToForm(row) {
  const c = row.content ?? {};
  return {
    issue: row.issue ?? "",
    bulletin_date: row.bulletin_date ?? "",
    year: c.theme?.year ?? "",
    verse: c.theme?.verse ?? "",
    goals: arrayToLines(c.theme?.goals),
    prayers: arrayToLines(c.prayers),
    order: arrayToPairs(c.order),
    news: arrayToLines(c.news),
    staff: arrayToPairs(c.staff),
  };
}

function formToContent(form) {
  return {
    theme: {
      year: form.year.trim(),
      verse: form.verse.trim(),
      goals: linesToArray(form.goals),
    },
    prayers: linesToArray(form.prayers),
    order: pairsToArray(form.order),
    news: linesToArray(form.news),
    staff: pairsToArray(form.staff),
  };
}

function BulletinManager() {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = 새 항목 작성 중이 아님, "new" = 새 항목
  const [form, setForm] = useState(emptyBulletinForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [parseFiles, setParseFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("bulletins")
      .select("id, issue, bulletin_date, content")
      .order("bulletin_date", { ascending: false })
      .order("id", { ascending: false });
    if (loadError) {
      setError("불러오기에 실패했어요: " + loadError.message);
      setLoading(false);
      return;
    }
    setBulletins(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew(copyFromLatest) {
    if (copyFromLatest && bulletins[0]) {
      const base = bulletinRowToForm(bulletins[0]);
      setForm({ ...base, issue: "", bulletin_date: "" });
    } else {
      setForm(emptyBulletinForm);
    }
    setEditingId("new");
    setError("");
  }

  function startEdit(row) {
    setForm(bulletinRowToForm(row));
    setEditingId(row.id);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyBulletinForm);
    setParseFiles([]);
    setParseError("");
    setError("");
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const [, data] = reader.result.split(",");
        resolve({ mediaType: file.type, data });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 사진 속 텍스트가 있는 항목만 결과에 채워서 돌아오니, 값이 있는 필드만 폼에 반영하고
  // 나머지(예: 표어·기도제목처럼 이 사진에는 안 나온 항목)는 이미 입력된 값을 그대로 둔다.
  async function handleAutoFill() {
    if (parseFiles.length === 0) return;
    setParsing(true);
    setParseError("");
    try {
      const images = await Promise.all(parseFiles.map(fileToBase64));
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/parse-bulletin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error ?? "AI 처리에 실패했어요.");
        setParsing(false);
        return;
      }
      const r = data.result;
      setForm((f) => ({
        ...f,
        issue: r.issue || f.issue,
        bulletin_date: r.bulletin_date || f.bulletin_date,
        order: r.order?.length ? arrayToPairs(r.order.map((o) => [o.label, o.detail])) : f.order,
        news: r.news?.length ? arrayToLines(r.news) : f.news,
      }));
      setParseFiles([]);
    } catch (err) {
      setParseError("AI 처리에 실패했어요: " + err.message);
    }
    setParsing(false);
  }

  async function handleSave() {
    if (!form.issue.trim() || !form.bulletin_date) {
      setError("호수와 날짜는 꼭 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      issue: form.issue.trim(),
      bulletin_date: form.bulletin_date,
      content: formToContent(form),
    };
    const query =
      editingId === "new"
        ? supabase.from("bulletins").insert(payload)
        : supabase.from("bulletins").update(payload).eq("id", editingId);
    const { error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError("저장에 실패했어요: " + saveError.message);
      return;
    }
    cancelEdit();
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("이 주보를 삭제할까요? 되돌릴 수 없어요.")) return;
    const { error: deleteError } = await supabase.from("bulletins").delete().eq("id", id);
    if (deleteError) {
      window.alert("삭제에 실패했어요: " + deleteError.message);
      return;
    }
    load();
  }

  return (
    <div>
      <p className="text-sm text-foreground/50">
        가장 최근 날짜의 주보가 &lsquo;주보&rsquo; 페이지 맨 위에 자동으로 표시돼요. 예배순서·섬김이는
        보통 매주 비슷하니 &ldquo;최근 주보 복사해서 새로 만들기&rdquo;로 시작하면 편해요.
      </p>

      {!editingId && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => startNew(true)}
            disabled={bulletins.length === 0}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
          >
            최근 주보 복사해서 새로 만들기
          </button>
          <button
            onClick={() => startNew(false)}
            className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            빈 주보 새로 만들기
          </button>
        </div>
      )}

      {editingId && (
        <div className="mt-4 space-y-4 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="font-serif font-semibold text-foreground">
            {editingId === "new" ? "새 주보" : "주보 수정"}
          </p>

          <div className="space-y-2 rounded-lg border border-brand-dark/20 bg-brand-tint/40 p-4 dark:border-brand/20">
            <p className="text-sm font-medium text-brand-dark">📷 사진으로 자동 채우기 (AI)</p>
            <p className="text-xs text-foreground/50">
              표지 사진(호수·날짜)과 예배순서·교회소식이 나온 사진, 두 장을 함께 올리면 AI가 읽어서
              채워줘요. 표어·기도제목·섬김이는 위 &ldquo;최근 주보 복사해서 새로 만들기&rdquo;로 이미
              채워졌다면 그대로 둬요. 채운 뒤에는 꼭 내용을 확인하고 필요한 부분만 고쳐주세요.
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
              <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                🖼️ 사진 선택 (여러 장 가능)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setParseFiles(Array.from(e.target.files ?? []))}
                className="hidden"
              />
            </label>
            {parseFiles.length > 0 && (
              <p className="text-xs text-foreground/70">{parseFiles.map((f) => f.name).join(", ")}</p>
            )}
            {parseError && <p className="text-sm text-red-600">{parseError}</p>}
            <button
              onClick={handleAutoFill}
              disabled={parsing || parseFiles.length === 0}
              className="rounded-full bg-brand-dark px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {parsing ? "AI가 읽는 중..." : "자동 채우기"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-foreground/60">호수 (예: 27권 35호)</label>
              <input
                type="text"
                value={form.issue}
                onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground/60">날짜</label>
              <input
                type="date"
                value={form.bulletin_date}
                onChange={(e) => setForm((f) => ({ ...f, bulletin_date: e.target.value }))}
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-foreground/60">연도 표어 라벨 (예: 2026년 표어)</label>
              <input
                type="text"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground/60">표어 성구</label>
              <input
                type="text"
                value={form.verse}
                onChange={(e) => setForm((f) => ({ ...f, verse: e.target.value }))}
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-foreground/60">실천목표 (한 줄에 하나씩)</label>
            <textarea
              rows={3}
              value={form.goals}
              onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>

          <div>
            <label className="block text-xs text-foreground/60">기도제목 (한 줄에 하나씩)</label>
            <textarea
              rows={4}
              value={form.prayers}
              onChange={(e) => setForm((f) => ({ ...f, prayers: e.target.value }))}
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>

          <div>
            <label className="block text-xs text-foreground/60">
              예배순서 (한 줄에 &ldquo;항목/내용&rdquo; 형식으로. 내용이 없으면 항목만 쓰고 슬래시(/)는 생략 가능)
            </label>
            <textarea
              rows={8}
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              placeholder={"찬송/14장 (2,3절)\n교독문/10번 (시편 16편)\n기도/조태형 집사"}
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 font-mono text-sm dark:border-white/10 dark:bg-white/10"
            />
            <p className="mt-1 text-xs text-foreground/40">
              찬송은 &ldquo;OO장&rdquo;, 교독문은 &ldquo;OO번&rdquo;이 내용에 있으면 자동으로 찬송가·교독문
              페이지 링크가 걸려요. 성경봉독은 &ldquo;구절 · 이름&rdquo; 형식(가운데 점)을 그대로 써주세요.
            </p>
          </div>

          <div>
            <label className="block text-xs text-foreground/60">교회소식 (한 줄에 하나씩)</label>
            <textarea
              rows={6}
              value={form.news}
              onChange={(e) => setForm((f) => ({ ...f, news: e.target.value }))}
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>

          <div>
            <label className="block text-xs text-foreground/60">
              섬김이 (한 줄에 &ldquo;역할/이름들&rdquo; 형식으로)
            </label>
            <textarea
              rows={5}
              value={form.staff}
              onChange={(e) => setForm((f) => ({ ...f, staff: e.target.value }))}
              placeholder={"교역자/임원일, 정상우\n장로/김택영, 최학수"}
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 font-mono text-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {!editingId && (
        <>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="mt-4 text-sm text-foreground/50">불러오는 중...</p>
          ) : bulletins.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/50">등록된 주보가 없어요.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              {bulletins.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-foreground">
                    {b.issue} · {formatKoreanDate(b.bulletin_date)}
                  </span>
                  <span className="flex shrink-0 gap-3">
                    <button onClick={() => startEdit(b)} className="text-brand-dark hover:underline">
                      수정
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-foreground/40 hover:text-red-600">
                      삭제
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function VerseManager() {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refInput, setRefInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRef, setEditRef] = useState("");
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("daily_verses")
      .select("id, ref, verse_text")
      .order("id", { ascending: true });
    if (loadError) {
      setError("불러오기에 실패했어요: " + loadError.message);
      setLoading(false);
      return;
    }
    setVerses(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!refInput.trim() || !textInput.trim()) {
      setError("성구 표시와 본문을 모두 입력해주세요.");
      return;
    }
    setAdding(true);
    setError("");
    const { error: insertError } = await supabase
      .from("daily_verses")
      .insert({ ref: refInput.trim(), verse_text: textInput.trim() });
    setAdding(false);
    if (insertError) {
      setError("추가에 실패했어요: " + insertError.message);
      return;
    }
    setRefInput("");
    setTextInput("");
    load();
  }

  function startEdit(v) {
    setEditingId(v.id);
    setEditRef(v.ref);
    setEditText(v.verse_text);
  }

  async function handleSaveEdit(id) {
    const { error: updateError } = await supabase
      .from("daily_verses")
      .update({ ref: editRef.trim(), verse_text: editText.trim() })
      .eq("id", id);
    if (updateError) {
      window.alert("수정에 실패했어요: " + updateError.message);
      return;
    }
    setEditingId(null);
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("이 성구를 삭제할까요?")) return;
    const { error: deleteError } = await supabase.from("daily_verses").delete().eq("id", id);
    if (deleteError) {
      window.alert("삭제에 실패했어요: " + deleteError.message);
      return;
    }
    load();
  }

  return (
    <div>
      <p className="text-sm text-foreground/50">
        여기 등록된 성구들이 성경 페이지의 &ldquo;오늘의 말씀&rdquo;에 날짜순으로 돌아가며 표시돼요.
      </p>

      <div className="mt-4 space-y-2 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <input
          type="text"
          value={refInput}
          onChange={(e) => setRefInput(e.target.value)}
          placeholder="성구 표시 (예: 요한복음 3:16)"
          className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        />
        <textarea
          rows={2}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="말씀 본문"
          className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleAdd}
          disabled={adding}
          className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {adding ? "추가 중..." : "추가"}
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-foreground/50">불러오는 중...</p>
      ) : (
        <ul className="mt-4 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {verses.map((v) =>
            editingId === v.id ? (
              <li key={v.id} className="space-y-2 px-4 py-3">
                <input
                  type="text"
                  value={editRef}
                  onChange={(e) => setEditRef(e.target.value)}
                  className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
                />
                <textarea
                  rows={2}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(v.id)}
                    className="rounded-full bg-brand px-3 py-1.5 text-xs text-white hover:bg-brand-dark"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    취소
                  </button>
                </div>
              </li>
            ) : (
              <li key={v.id} className="flex items-start justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{v.ref}</p>
                  <p className="mt-0.5 text-foreground/60">{v.verse_text}</p>
                </div>
                <span className="flex shrink-0 gap-3">
                  <button onClick={() => startEdit(v)} className="text-brand-dark hover:underline">
                    수정
                  </button>
                  <button onClick={() => handleDelete(v.id)} className="text-foreground/40 hover:text-red-600">
                    삭제
                  </button>
                </span>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function GyodokmunManager() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // { number, title, lines(text) } | "new" 상태는 number=""
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("gyodokmun_readings")
      .select("number, title")
      .order("number", { ascending: true });
    if (loadError) {
      setError("불러오기에 실패했어요: " + loadError.message);
      setLoading(false);
      return;
    }
    setList(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setEditing({ number: "", title: "", linesText: "" });
    setError("");
  }

  async function startEdit(number) {
    setError("");
    const { data, error: fetchError } = await supabase
      .from("gyodokmun_readings")
      .select("number, title, lines")
      .eq("number", number)
      .maybeSingle();
    if (fetchError || !data) {
      setError("불러오기에 실패했어요: " + (fetchError?.message ?? ""));
      return;
    }
    setEditing({ number: String(data.number), title: data.title, linesText: arrayToLines(data.lines) });
  }

  function cancelEdit() {
    setEditing(null);
    setError("");
  }

  async function handleSave() {
    const number = parseInt(editing.number, 10);
    const lines = linesToArray(editing.linesText);
    if (!number || !editing.title.trim() || lines.length === 0) {
      setError("번호, 제목, 내용을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase
      .from("gyodokmun_readings")
      .upsert({ number, title: editing.title.trim(), lines });
    setSaving(false);
    if (saveError) {
      setError("저장에 실패했어요: " + saveError.message);
      return;
    }
    cancelEdit();
    load();
  }

  async function handleDelete(number) {
    if (!window.confirm(`${number}번 교독문을 삭제할까요?`)) return;
    const { error: deleteError } = await supabase.from("gyodokmun_readings").delete().eq("number", number);
    if (deleteError) {
      window.alert("삭제에 실패했어요: " + deleteError.message);
      return;
    }
    load();
  }

  const filtered = list.filter(
    (r) => !search.trim() || r.title.includes(search.trim()) || String(r.number).includes(search.trim())
  );

  return (
    <div>
      <p className="text-sm text-foreground/50">
        번호는 주보 예배순서에서 &ldquo;OO번&rdquo;으로 적으면 자동으로 여기 연결돼요.
      </p>

      {editing ? (
        <div className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
          <p className="font-serif font-semibold text-foreground">
            {editing.number ? `${editing.number}번 수정` : "새 교독문"}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-foreground/60">번호</label>
              <input
                type="number"
                value={editing.number}
                onChange={(e) => setEditing((f) => ({ ...f, number: e.target.value }))}
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-foreground/60">제목 (예: 시편 1편)</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/60">
              내용 (한 줄씩. 회중이 다같이 읽는 줄은 맨 앞에 &ldquo;(다같이)&rdquo;를 붙여주세요)
            </label>
            <textarea
              rows={12}
              value={editing.linesText}
              onChange={(e) => setEditing((f) => ({ ...f, linesText: e.target.value }))}
              placeholder={"복있는 사람은 악인들의 꾀를 따르지 아니하며\n(다같이) 오만한 자들의 자리에 앉지 아니하고"}
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm leading-6 dark:border-white/10 dark:bg-white/10"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="번호나 제목으로 찾기"
            className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          <button
            onClick={startNew}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
          >
            새 교독문 추가
          </button>
        </div>
      )}

      {!editing && (
        <>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="mt-4 text-sm text-foreground/50">불러오는 중...</p>
          ) : (
            <ul className="mt-4 max-h-[28rem] divide-y divide-black/10 overflow-y-auto rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              {filtered.map((r) => (
                <li key={r.number} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <span className="text-foreground">
                    {r.number}번 · {r.title}
                  </span>
                  <span className="flex shrink-0 gap-3">
                    <button onClick={() => startEdit(r.number)} className="text-brand-dark hover:underline">
                      수정
                    </button>
                    <button onClick={() => handleDelete(r.number)} className="text-foreground/40 hover:text-red-600">
                      삭제
                    </button>
                  </span>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-foreground/50">검색 결과가 없어요.</li>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminContentPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [tab, setTab] = useState("bulletin");

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">콘텐츠 관리</h1>
        <p className="mt-3 text-sm text-foreground/60">관리자만 볼 수 있는 페이지예요.</p>
        {!user && (
          <Link href="/login" className="mt-6 inline-block text-brand-dark underline">
            로그인하러 가기
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">콘텐츠 관리</h1>
      <p className="mt-2 text-sm text-foreground/50">
        주보·오늘의 말씀·교독문을 여기서 직접 등록·수정하면 바로 앱에 반영돼요.
      </p>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              tab === t.key
                ? "border-brand bg-brand text-white"
                : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "bulletin" && <BulletinManager />}
        {tab === "verses" && <VerseManager />}
        {tab === "gyodokmun" && <GyodokmunManager />}
      </div>
    </main>
  );
}
