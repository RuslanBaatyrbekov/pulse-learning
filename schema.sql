-- Пульс данных: база прогресса.
-- Выполни целиком в Supabase: SQL Editor → New query → Run.

-- 1. Таблица прогресса: одна строка на ученика.
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  constraint progress_state_size check (pg_column_size(state) < 100000)
);

-- 2. Наблюдатели: кто может читать прогресс всех учеников.
create table if not exists public.observers (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- 3. Доступ только по правилам (Row Level Security).
alter table public.progress  enable row level security;
alter table public.observers enable row level security;

revoke all on public.progress  from anon;
revoke all on public.observers from anon;
grant select, insert, update on public.progress  to authenticated;
grant select                 on public.observers to authenticated;

-- Ученик видит и меняет только свою строку.
create policy "progress: read own" on public.progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "progress: insert own" on public.progress
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "progress: update own" on public.progress
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Наблюдатель читает все строки, но ничего не меняет.
create policy "progress: observer reads all" on public.progress
  for select to authenticated
  using (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));

-- Каждый может узнать только, наблюдатель ли он сам.
create policy "observers: read self" on public.observers
  for select to authenticated using (user_id = (select auth.uid()));

-- Удалять строки нельзя никому из приложения: политики на delete нет.

-- 6. Содержимое курса: уроки, задания, ответы. Читать могут только вошедшие.
create table if not exists public.course_content (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.course_content enable row level security;
revoke all on public.course_content from anon;
grant select on public.course_content to authenticated;
create policy "course: signed-in users read" on public.course_content
  for select to authenticated using (true);
-- Записывать уроки может только наблюдатель: вкладка «Наблюдение» → «Загрузить курс» (см. раздел 7).

-- 4. Живое обновление вкладки «Наблюдение».
alter publication supabase_realtime add table public.progress;

-- 5. ПОСЛЕ создания пользователей (шаг 4 инструкции) выполни отдельно,
--    подставив свой email:
-- insert into public.observers (user_id)
--   select id from auth.users where email = 'твой@email.de';

-- 7. Наблюдатель загружает новую версию курса прямо из приложения.
grant insert, update on public.course_content to authenticated;
drop policy if exists "course: observers insert" on public.course_content;
drop policy if exists "course: observers update" on public.course_content;
create policy "course: observers insert" on public.course_content for insert to authenticated
  with check (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));
create policy "course: observers update" on public.course_content for update to authenticated
  using (exists (select 1 from public.observers o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));

-- 8. Напоминания (Web Push) — отдельный файл push.sql.
