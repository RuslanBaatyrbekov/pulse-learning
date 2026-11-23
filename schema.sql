-- Pulse: progress and courses database (new installation).
-- A database created by an older version of this file: run migrations/001_multi_course.sql instead.
-- After this file, also run migrations/002_progress_safety.sql.
-- Run the whole file in Supabase: SQL Editor → New query → Run.

-- 1. Progress table: one row per learner and course.
create table if not exists public.progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  text not null default 'main',
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  constraint progress_pkey primary key (user_id, course_id),
  constraint progress_state_size check (pg_column_size(state) < 100000)
);

-- 2. Observers: who can read the progress of all learners.
create table if not exists public.observers (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- 3. Access only through rules (Row Level Security).
alter table public.progress  enable row level security;
alter table public.observers enable row level security;

revoke all on public.progress  from anon;
revoke all on public.observers from anon;
grant select, insert, update on public.progress  to authenticated;
grant select                 on public.observers to authenticated;

-- A learner sees and changes only their own rows.
create policy "progress: read own" on public.progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "progress: insert own" on public.progress
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "progress: update own" on public.progress
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- An observer reads all rows but changes nothing.
create policy "progress: observer reads all" on public.progress
  for select to authenticated
  using (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));

-- Everyone can only find out whether they themselves are an observer.
create policy "observers: read self" on public.observers
  for select to authenticated using (user_id = (select auth.uid()));

-- Nobody can delete rows from the app: there is no delete policy.

-- 6. Courses: lessons, tasks, answers. There can be several courses.
--    open = true: every signed-in user sees the course; otherwise only those it was granted to (course_access).
create table if not exists public.course_content (
  id         text primary key,
  title      text,
  open       boolean not null default false,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.course_content enable row level security;
revoke all on public.course_content from anon;
grant select on public.course_content to authenticated;

-- Access to closed courses. Only an observer grants and revokes it.
create table if not exists public.course_access (
  user_id   uuid not null references auth.users (id) on delete cascade,
  course_id text not null references public.course_content (id) on delete cascade,
  primary key (user_id, course_id)
);
alter table public.course_access enable row level security;
revoke all on public.course_access from anon;
grant select, insert, delete on public.course_access to authenticated;
create policy "access: read own or observer" on public.course_access for select to authenticated
  using (user_id = (select auth.uid())
    or exists (select 1 from public.observers o where o.user_id = (select auth.uid())));
create policy "access: observers insert" on public.course_access for insert to authenticated
  with check (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));
create policy "access: observers delete" on public.course_access for delete to authenticated
  using (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));

create policy "course: read open, granted or observer" on public.course_content for select to authenticated
  using (open
    or exists (select 1 from public.course_access a where a.course_id = course_content.id and a.user_id = (select auth.uid()))
    or exists (select 1 from public.observers o where o.user_id = (select auth.uid())));
-- Only an observer writes courses: Observer tab → Upload course (see section 7).

-- 4. Live updates in the Observer tab.
alter publication supabase_realtime add table public.progress;

-- 5. AFTER creating the users (step 4 of the guide), run separately,
--    with your own email:
-- insert into public.observers (user_id)
--   select id from auth.users where email = 'you@example.com';

-- 7. An observer uploads a new course version right from the app.
grant insert, update on public.course_content to authenticated;
drop policy if exists "course: observers insert" on public.course_content;
drop policy if exists "course: observers update" on public.course_content;
create policy "course: observers insert" on public.course_content for insert to authenticated
  with check (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));
create policy "course: observers update" on public.course_content for update to authenticated
  using (exists (select 1 from public.observers o where o.user_id = (select auth.uid())))
  with check (exists (select 1 from public.observers o where o.user_id = (select auth.uid())));

-- 8. Reminders (Web Push) are in a separate file, push.sql.
