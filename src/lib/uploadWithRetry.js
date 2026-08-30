import { supabase } from "@/lib/supabaseClient";

// 모바일 네트워크가 불안정하면 업로드 도중 "Failed to fetch"로 실패하는 경우가 잦아서
// 자동으로 재시도한다. 재시도 1번으로는 계속 실패하는 사례가 있어 최대 3번,
// 시도할 때마다 대기 시간을 늘려가며(1초 → 2초) 다시 시도한다.
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 2000];

export async function uploadFileWithRetry(bucket, path, file, options) {
  let result;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    result = await supabase.storage.from(bucket).upload(path, file, options);
    if (!result.error) return result;
    const delay = RETRY_DELAYS_MS[attempt];
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return result;
}
