-- Пульс данных: ежедневные напоминания (Web Push). Выполни один раз в Supabase → SQL Editor.
-- Перед запуском замени PROJECT_REF на id проекта и CRON_SECRET_HERE на секрет из Edge Functions → Secrets.

-- 1) подписки устройств на уведомления
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  hour       int  not null default 19 check (hour between 0 and 23),
  tz         text not null default 'Europe/Berlin',
  last_sent  date,
  updated_at timestamptz not null default now()
);
create index if not exists push_subs_user on public.push_subs(user_id);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon;
grant select, insert, update, delete on public.push_subs to authenticated;
drop policy if exists "push: own select" on public.push_subs;
drop policy if exists "push: own insert" on public.push_subs;
drop policy if exists "push: own update" on public.push_subs;
drop policy if exists "push: own delete" on public.push_subs;
create policy "push: own select" on public.push_subs for select to authenticated using (user_id = (select auth.uid()));
create policy "push: own insert" on public.push_subs for insert to authenticated with check (user_id = (select auth.uid()));
-- телефон может сменить аккаунт: новый владелец забирает тот же endpoint себе
create policy "push: own update" on public.push_subs for update to authenticated using (true) with check (user_id = (select auth.uid()));
create policy "push: own delete" on public.push_subs for delete to authenticated using (user_id = (select auth.uid()));

-- 2) каждые 15 минут вызываем функцию send-reminders
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('puls-reminders') where exists (select 1 from cron.job where jobname = 'puls-reminders');
select cron.schedule('puls-reminders', '*/15 * * * *', $job$
  select net.http_post(
    url     := 'https://PROJECT_REF.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'CRON_SECRET_HERE'),
    body    := '{}'::jsonb
  );
$job$);
