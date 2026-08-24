// Supabase Storage 키는 한글 등 비 ASCII 문자를 포함한 파일명을 거부할 수 있어
// 원본 파일명 대신 안전한 임의 이름으로 저장 경로를 만든다.
export function safeStoragePath(folder, fileName) {
  const ext = fileName.includes(".") ? fileName.split(".").pop().replace(/[^a-zA-Z0-9]/g, "") : "";
  const random = Math.random().toString(36).slice(2, 8);
  return `${folder}/${Date.now()}-${random}${ext ? `.${ext}` : ""}`;
}
