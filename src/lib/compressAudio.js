// 설교 음성은 파일이 커서(보통 100MB 안팎) 무료 저장공간을 많이 잡아먹고,
// 불안정한 모바일 네트워크에서 업로드가 실패하기도 쉽다. 올리기 전에
// 브라우저 안에서(ffmpeg.wasm) 낮은 비트레이트 모노 MP3로 변환해서
// 용량을 크게 줄인다(원본이 이미지가 아니라 오디오라 리사이즈 대신 트랜스코딩).
//
// ffmpeg.wasm 코어(약 30MB)는 관리자가 실제로 음성 파일을 선택했을 때만
// CDN에서 받아오고(동적 import + 지연 로드), 일반 회원에게는 전혀 영향 없다.
// 변환에 실패하면(코어 로드 실패, 지원하지 않는 형식 등) 원본 파일을
// 그대로 반환해서 업로드 자체는 막지 않는다.

const CORE_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
const AUDIO_BITRATE = "96k";

let ffmpegPromise = null;

async function loadFfmpeg(onProgress) {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      if (onProgress) {
        ffmpeg.on("progress", ({ progress }) => onProgress(Math.min(1, Math.max(0, progress))));
      }
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

export async function compressAudioFile(file, onProgress) {
  try {
    const { fetchFile } = await import("@ffmpeg/util");
    const ffmpeg = await loadFfmpeg(onProgress);

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "dat";
    const inputName = `input.${ext}`;
    const outputName = "output.mp3";

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(["-i", inputName, "-vn", "-b:a", AUDIO_BITRATE, "-ac", "1", outputName]);
    const data = await ffmpeg.readFile(outputName);

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // 변환 결과가 원본보다 크면(짧고 이미 저용량인 파일 등) 원본을 그대로 쓴다.
    if (data.byteLength >= file.size) return file;

    const compressedName = file.name.replace(/\.[^.]+$/, "") + ".mp3";
    return new File([data], compressedName, { type: "audio/mpeg" });
  } catch (e) {
    console.error("오디오 압축 실패, 원본으로 업로드합니다:", e?.message ?? e);
    return file;
  }
}
