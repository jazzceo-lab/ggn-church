// 프로필 사진처럼 작게 표시되는 이미지는 휴대폰 카메라 원본(수 MB)을 그대로
// 올릴 필요가 없다. 불안정한 모바일 네트워크에서 업로드 도중 끊기는 걸 줄이려고
// 올리기 전에 미리 축소해서 용량을 크게 낮춘다. 축소에 실패하면(지원 안 하는
// 이미지 형식 등) 원본 파일을 그대로 반환해서 업로드 자체는 막지 않는다.
export async function resizeImageFile(file, { maxSize = 800, quality = 0.85 } = {}) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;

    const resizedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], resizedName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
