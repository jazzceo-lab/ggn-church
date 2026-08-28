"use client";

// 프로필 사진을 카톡처럼 눌러서 크게 보는 오버레이. 배경을 누르면 닫힘.
export default function AvatarLightbox({ url, onClose }) {
  if (!url) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <img src={url} alt="프로필 사진" className="max-h-[80vh] max-w-full rounded-lg object-contain" />
    </div>
  );
}
