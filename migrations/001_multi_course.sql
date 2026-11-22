-- Pulse: several courses in one project.
-- For a database created from the old schema.sql (one course 'main', one progress row per learner).
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- What changes:
--   * course_content gets a title and an "open" flag. Existing courses stay open to every
--     signed-in user, exactly as before; new courses are closed until the observer opens them
--     or grants them to specific learners.
--   * course_access: which learner may see which closed course (written by observers only).
--   * progress gets course_id; the primary key becomes (user_id, course_id).
--     Every existing row becomes course_id = 'main', nothing is copied or rewritten.
--   * Apps still running the previous app.js keep working: they write without course_id,
--     the default 'main' fills it and the upsert hits the same row.

begin;

-- 1. Courses: title and visibility.
alter table public.course_content add column if not exists title text;
-- a course without meta.brand is shown with the original branding, so it gets that name in the list
update public.course_content set title = coalesce(data->'meta'->>'brand', 'Пульс данных') where title is null or title = '';
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'course_content' and column_name = 'open') then
    alter table public.course_content add column open boolean not null default false;
    -- existing courses were readable by everyone signed in: keep it that way
    update public.course_content set open = true;
  end if;
end $$;

-- 2. Access to closed courses.
create table if not exists public.course_access (
  user_id   uuid not null references auth.users (id) on delete cascade,
  course_id text not null references public.course_content (id) on delete cascade,
  primary key (user_id, course_id)
);
alter table public.course_access enable row level security;
revoke all on public.course_access from anon;
grant select, insert, delete on public.course_access to authenticated;
drop policy if exists "access: read own or observer" on public.course_access;
drop policy if exists "access: observers insert" on public.course_access;
drop policy if exists "access: observers delete" on public.course_access;
create policy "access: read own or observer" on public.course_access for select to authenticated
  using (user_id = (select auth.uid())
    or exists (select 1 from public.observers o where o.user_id = (select auth.uid())));
create policy "access: observers insert" on public.course_access for insert to authenticated
  with check (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));
create policy "access: observers delete" on public.course_access for delete to authenticated
  using (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));

-- 3. Who may read a course: open ones, granted ones, and observers read everything.
drop policy if exists "course: signed-in users read" on public.course_content;
drop policy if exists "course: read open, granted or observer" on public.course_content;
create policy "course: read open, granted or observer" on public.course_content for select to authenticated
  using (open
    or exists (select 1 from public.course_access a where a.course_id = course_content.id and a.user_id = (select auth.uid()))
    or exists (select 1 from public.observers o where o.user_id = (select auth.uid())));

-- 4. Progress per course.
alter table public.progress add column if not exists course_id text not null default 'main';
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'progress_pkey'
             and conrelid = 'public.progress'::regclass and array_length(conkey, 1) = 1) then
    alter table public.progress drop constraint progress_pkey;
    alter table public.progress add constraint progress_pkey primary key (user_id, course_id);
  end if;
end $$;

commit;
