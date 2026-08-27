"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import KakaoShareButton from "@/components/KakaoShareButton";

const BULLETIN_IMAGE_TYPE = "bulletin";
const MAX_KEPT_IMAGES = 2;

function hymnNumberFrom(text) {
  const match = text?.match(/(\d{1,3})\s*장/);
  return match ? match[1] : null;
}

function bulletinImageUrl(item) {
  return supabase.storage.from("attachments").getPublicUrl(item.file_path).data.publicUrl;
}

// 새 주보가 나오면 이 배열의 맨 앞에 새 항목을 추가하세요.
// 이전 항목은 그대로 두면 하단 "지난 주보"에 자동으로 쌓입니다.
const bulletins = [
  {
    issue: "27권 34호",
    date: "2026. 8. 23",
    theme: {
      year: "2026년 표어",
      verse: "매일, 매사에 겸손히 하나님과 동행하자! (미가 6:8)",
      goals: [
        "마음에 할례를 받자! (신 30:6)",
        "하나님의 뜻을 분별하자! (롬 12:2)",
        "긍휼, 정의, 공의를 실천하자! (렘 9:24)",
      ],
    },
    prayers: [
      "우리가 살아온 먼 길을 돌아보며 끊임없이 일하시는 하나님의 섭리의 손길을 깨달아 알도록",
      "아직도 회복되지 않은 북한 땅에도 하나님의 섭리의 손길 안에서 부활의 새 역사가 이뤄지길",
      "교회의 리더십 변화의 때에 모든 항존직이 든든한 교회의 기둥으로서 제 역할을 다하도록",
      "담임목사 청빙위원회 구성을 필두로 리더십 변화의 때에 온 교회가 기도로 참여하도록",
    ],
    order: [
      ["인사와 나눔", ""],
      ["묵도", ""],
      ["찬송", "주 우리 하나님 14장 (1,4절)"],
      ["기원", ""],
      ["교독문", "9번 (시편 15편)"],
      ["신앙고백", "사도신경"],
      ["찬송", "삼천리 반도 금수강산 580장"],
      ["기도", "노희일 집사"],
      ["성경봉독", "이사야 51:1~3 · 신유정 집사"],
      ["찬양대", "주님 약속하신 말씀 위에서"],
      ["말씀", "임원일 목사 · 「멀리 1,300년 전을 돌아봐라」"],
      ["기도", ""],
      ["찬송", "어둔 밤 마음에 잠겨 582장"],
      ["헌금기도", ""],
      ["축도", ""],
    ],
    news: [
      "식탁 교제 / 낮 예배 후 온 교우가 함께하는 식탁교제가 있습니다.",
      "당회 / 오늘 오후 3시 30분, 교역자실",
      "항존직 재교육 / 7월~8월 매주일 오후 2시, 본당",
      "청소년부, 청년부(1,2청) 찬양 집회 / 9월 5일(토) 저녁 8시, 청소년·청년부실",
      "구역장 성경공부 개강 / 9월 6일(주일) 오후 4시",
      "백향숲 개강 / 9월 6일(주일) 오후 2시",
      "금요기도회 / 8월 28일(금) 저녁 8시 · 찬양과 기도의 자리에 많은 참여를 바랍니다.",
      "이사 / 정상우 목사 가정",
      "다음주 예배위원 / 기도: 조태형 집사, 성경봉독: 양혜림 집사",
      "헌금 계좌 / 일반헌금 [농협] 141-01-317160 · 건축헌금 [농협] 301-0141-2913-81",
    ],
    staff: [
      ["교역자", "임원일, 정상우, 송혜영, 김태민"],
      ["장로", "김택영, 최학수, 주현진, 이건주, 김윤태"],
      ["후원선교사", "권성찬, 최미언"],
      ["성가대지휘", "나혜라"],
      ["반주", "최진아, 양혜림"],
    ],
  },
];

function BulletinContent({ bulletin }) {
  return (
    <>
      <section className="mt-8 rounded-xl border border-black/10 bg-brand-tint/60 p-5 dark:border-white/10">
        <p className="text-sm font-medium text-brand-dark">{bulletin.theme.year}</p>
        <p className="mt-1 font-serif text-lg font-semibold text-foreground">
          &ldquo;{bulletin.theme.verse}&rdquo;
        </p>
        <ol className="mt-4 space-y-1 text-sm text-foreground/70">
          {bulletin.theme.goals.map((goal, i) => (
            <li key={i}>
              {i + 1}. {goal}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">기도제목</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
          {bulletin.prayers.map((p, i) => (
            <li key={i}>· {p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif font-semibold text-foreground">예배순서</h2>
          <p className="text-sm text-foreground/50">오전 11:30 · 인도 임원일 목사</p>
        </div>
        <ul className="mt-3 divide-y divide-black/5 text-sm dark:divide-white/10">
          {bulletin.order.map(([label, detail], i) => {
            const hymnNumber = label === "찬송" ? hymnNumberFrom(detail) : null;
            return (
              <li key={i} className="flex items-center justify-between gap-4 py-2">
                <span className="w-24 shrink-0 font-medium text-foreground/80">{label}</span>
                {hymnNumber ? (
                  <Link
                    href={`/hymns?open=${hymnNumber}`}
                    className="text-right text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                  >
                    {detail}
                  </Link>
                ) : (
                  <span className="text-right text-foreground/60">{detail}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">교회소식</h2>
        <ol className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
          {bulletin.news.map((n, i) => (
            <li key={i}>
              {i + 1}. {n}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">섬김이</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {bulletin.staff.map(([role, names]) => (
            <div key={role} className="flex gap-2">
              <dt className="w-24 shrink-0 text-foreground/50">{role}</dt>
              <dd className="text-foreground/80">{names}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

export default function BulletinPage() {
  const { isAdmin } = useAuth();
  const [current, ...past] = bulletins;
  const [openIssue, setOpenIssue] = useState(null);

  const [bulletinImages, setBulletinImages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  async function loadBulletinImages() {
    const { data } = await supabase
      .from("media_items")
      .select("id, title, file_path, created_at")
      .eq("media_type", BULLETIN_IMAGE_TYPE)
      .order("created_at", { ascending: false });
    setBulletinImages(data ?? []);
  }

  useEffect(() => {
    loadBulletinImages();
  }, []);

  async function pruneOldBulletinImages() {
    const { data } = await supabase
      .from("media_items")
      .select("id, file_path")
      .eq("media_type", BULLETIN_IMAGE_TYPE)
      .order("created_at", { ascending: false });

    if (!data || data.length <= MAX_KEPT_IMAGES) return;

    const toDelete = data.slice(MAX_KEPT_IMAGES);
    await supabase.storage.from("attachments").remove(toDelete.map((d) => d.file_path));
    await supabase
      .from("media_items")
      .delete()
      .in("id", toDelete.map((d) => d.id));
  }

  async function handleUploadImage(e) {
    e.preventDefault();
    if (!imageFile) return;
    setImageUploading(true);
    setImageError("");

    const path = safeStoragePath("bulletin", imageFile.name);
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, imageFile);

    if (uploadError) {
      setImageUploading(false);
      setImageError("업로드에 실패했어요: " + uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("media_items")
      .insert({ title: current.issue, media_type: BULLETIN_IMAGE_TYPE, file_path: path });

    if (insertError) {
      setImageUploading(false);
      setImageError("등록에 실패했어요: " + insertError.message);
      return;
    }

    await pruneOldBulletinImages();
    setImageUploading(false);
    setImageFile(null);
    loadBulletinImages();
  }

  async function handleDeleteImage(item) {
    if (!window.confirm("이 주보 이미지를 삭제할까요?")) return;
    await supabase.storage.from("attachments").remove([item.file_path]);
    await supabase.from("media_items").delete().eq("id", item.id);
    loadBulletinImages();
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-4 pb-12">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-foreground">주보</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-foreground/50">
            {current.issue} · {current.date}
          </p>
          <KakaoShareButton
            title={`길가는교회 주보 (${current.issue})`}
            description={current.theme.verse}
            url="https://ggnch.shop/bulletin"
          />
        </div>
      </div>

      {isAdmin && (
        <form
          onSubmit={handleUploadImage}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-sm font-medium text-foreground/80">주보 이미지 등록 (관리자)</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
            <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
              🖼️ 이미지 선택
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {imageFile && <span className="text-foreground/70">{imageFile.name}</span>}
          </label>
          {imageError && <p className="text-sm text-red-600">{imageError}</p>}
          <button
            type="submit"
            disabled={imageUploading || !imageFile}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {imageUploading ? "업로드 중..." : "등록"}
          </button>
        </form>
      )}

      {bulletinImages[0] && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-brand-dark">이번 주 주보 이미지</p>
            {isAdmin && (
              <button
                onClick={() => handleDeleteImage(bulletinImages[0])}
                className="text-xs text-foreground/40 hover:text-red-600"
              >
                삭제
              </button>
            )}
          </div>
          <img
            src={bulletinImageUrl(bulletinImages[0])}
            alt="이번 주 주보"
            className="mt-2 w-full rounded-xl border border-black/10 dark:border-white/10"
          />
        </div>
      )}

      <BulletinContent bulletin={current} />

      {bulletinImages[1] && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground/50">지난주보 이미지</p>
            {isAdmin && (
              <button
                onClick={() => handleDeleteImage(bulletinImages[1])}
                className="text-xs text-foreground/40 hover:text-red-600"
              >
                삭제
              </button>
            )}
          </div>
          <img
            src={bulletinImageUrl(bulletinImages[1])}
            alt="지난주보"
            className="mt-2 w-full rounded-xl border border-black/10 dark:border-white/10"
          />
        </div>
      )}

      {past.length > 0 && (
        <section className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <h2 className="font-serif text-lg font-semibold text-foreground">지난 주보</h2>
          <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
            {past.map((b) => (
              <li key={b.issue}>
                <button
                  onClick={() => setOpenIssue(openIssue === b.issue ? null : b.issue)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span className="font-medium text-foreground">
                    {b.issue} · {b.date}
                  </span>
                  <span className="text-foreground/40">{openIssue === b.issue ? "숨기기" : "보기"}</span>
                </button>
                {openIssue === b.issue && (
                  <div className="px-4 pb-6">
                    <BulletinContent bulletin={b} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
