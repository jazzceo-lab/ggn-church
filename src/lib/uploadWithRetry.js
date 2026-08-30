import { supabase } from "@/lib/supabaseClient";

// 모바일 네트워크가 불안정하면 업로드 도중 "Failed to fetch"로 실패하는 경우가 잦아서
// 한 번 더 자동으로 재시도한다.
export async function uploadFileWithRetry(bucket, path, file, options) {
  let result = await supabase.storage.from(bucket).upload(path, file, options);
  if (result.error) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    result = await supabase.storage.from(bucket).upload(path, file, options);
  }
  return result;
}
