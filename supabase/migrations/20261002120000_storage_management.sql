-- 저장소 용량 관리: 관리자용 사용량 조회 + 찬송가 악보 압축용 관리자 쓰기 권한
-- + 채팅 첨부(사진·동영상) 90일 자동삭제 예약 작업.

create or replace function public.storage_usage()
returns json
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'admin only';
  end if;
  return json_build_object(
    'storage_bytes', (select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects),
    'db_bytes', pg_database_size(current_database()),
    'buckets', (select json_object_agg(bucket_id, bytes) from (
      select bucket_id, sum((metadata->>'size')::bigint) bytes from storage.objects group by bucket_id
    ) b)
  );
end;
$$;
revoke all on function public.storage_usage() from public, anon;
grant execute on function public.storage_usage() to authenticated;

-- 관리자 화면의 "악보 압축" 버튼이 같은 이름으로 덮어쓰기(upsert)할 수 있게.
create policy "관리자는 hymns 업로드 가능" on storage.objects for insert to authenticated
  with check (bucket_id = 'hymns' and exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "관리자는 hymns 수정 가능" on storage.objects for update to authenticated
  using (bucket_id = 'hymns' and exists (select 1 from profiles where id = auth.uid() and is_admin));

-- 매일 04:30 KST에 90일 지난 채팅 사진·동영상 파일 정리.
select cron.schedule(
  'cleanup-chat-attachments',
  '30 19 * * *',
  $$
  select net.http_post(
    url := 'https://ncskpuolqlkgckqtrcwb.supabase.co/functions/v1/cleanup-chat-attachments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_AdVsZfs6kH0uQ8bAP8tVSQ__ULT4pha'
    ),
    body := '{}'::jsonb
  );
  $$
);
