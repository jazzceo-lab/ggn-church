-- push_subscriptions.endpoint에 단독 unique 제약이 걸려 있어서, 같은 기기에서
-- 계정 A로 알림을 켠 뒤 계정 B로도 켜면 upsert(onConflict: endpoint)가 A의 행을
-- B로 덮어써버렸다. 그러면 A는 실제로는 알림이 꺼진 상태가 되어 "알림 켜기"
-- 배너가 계속 뜬다. 같은 기기라도 계정별로 각자 구독을 유지하도록
-- (user_id, endpoint) 조합으로 unique 제약을 다시 건다.
--
-- 제약/인덱스 이름을 알 수 없어(마이그레이션 이전에 Studio에서 만들어짐) 동적으로
-- 찾아서 제거한다.

do $$
declare
  con record;
begin
  for con in
    select conname
    from pg_constraint
    where conrelid = 'public.push_subscriptions'::regclass
      and contype = 'u'
      and conkey = array[(
        select attnum from pg_attribute
        where attrelid = 'public.push_subscriptions'::regclass and attname = 'endpoint'
      )]
  loop
    execute format('alter table public.push_subscriptions drop constraint %I', con.conname);
  end loop;
end $$;

do $$
declare
  idx record;
begin
  for idx in
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and indexdef ilike '%UNIQUE%'
      and indexdef ilike '%(endpoint)%'
  loop
    execute format('drop index if exists public.%I', idx.indexname);
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.push_subscriptions'::regclass
      and conname = 'push_subscriptions_user_endpoint_key'
  ) then
    alter table public.push_subscriptions
      add constraint push_subscriptions_user_endpoint_key unique (user_id, endpoint);
  end if;
end $$;
