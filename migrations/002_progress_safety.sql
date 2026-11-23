-- Pulse: safety net for learner progress. Run once in Supabase → SQL Editor (after 001); safe to run again.
--
-- 1) The database refuses any save that loses XP or finished lessons, unless the learner pressed
--    "Reset" or imported a code (the app marks those with state.wipe). The refused copy goes to
--    progress_history and the stored row stays as it was; the app merges it back on its next sync.
--    So an old cached app version or a fresh device can no longer wipe anyone's progress.
-- 2) A deliberate reset is accepted, and the state before it is kept in progress_history.
-- 3) If pg_cron is enabled (push.sql turns it on), a full snapshot of all progress is kept every night
--    at 03:00 for 14 days.
--
-- Restore one learner in one course:
--   update public.progress
--      set state = (select state from public.progress_history where id = <ID>), updated_at = now()
--    where user_id = '<USER_ID>' and course_id = '<COURSE_ID>';
-- Find the copies:  select id, course_id, reason, saved_at from public.progress_history
--                   where user_id = '<USER_ID>' order by saved_at desc;

create table if not exists public.progress_history (
  id        bigserial primary key,
  user_id   uuid not null,
  course_id text not null default 'main',
  state     jsonb not null,
  reason    text not null,
  saved_at  timestamptz not null default now()
);
alter table public.progress_history add column if not exists course_id text not null default 'main';
create index if not exists progress_history_user on public.progress_history (user_id, course_id, saved_at desc);
-- no policies: only the dashboard and the SQL editor (service role) can read it
alter table public.progress_history enable row level security;
revoke all on public.progress_history from anon, authenticated;

create or replace function public.progress_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  old_xp   numeric := coalesce((old.state->>'xp')::numeric, 0);
  new_xp   numeric := coalesce((new.state->>'xp')::numeric, 0);
  old_done int := (select count(*) from jsonb_object_keys(coalesce(old.state->'done', '{}'::jsonb)));
  new_done int := (select count(*) from jsonb_object_keys(coalesce(new.state->'done', '{}'::jsonb)));
  wiped    boolean := coalesce((new.state->>'wipe')::numeric, 0) > coalesce((old.state->>'t')::numeric, 0);
begin
  if new_xp < old_xp or new_done < old_done then
    if wiped then
      insert into progress_history (user_id, course_id, state, reason)
      values (old.user_id, old.course_id, old.state,
              format('reset by learner: xp %s→%s, lessons %s→%s', old_xp, new_xp, old_done, new_done));
      return new;
    end if;
    insert into progress_history (user_id, course_id, state, reason)
    values (old.user_id, old.course_id, new.state,
            format('refused: xp %s→%s, lessons %s→%s', old_xp, new_xp, old_done, new_done));
    return old;  -- keep the richer copy
  end if;
  return new;
end $$;

drop trigger if exists progress_guard on public.progress;
create trigger progress_guard before update on public.progress
  for each row execute function public.progress_guard();

-- nightly snapshot, only where pg_cron is available
do $outer$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('pulse-snapshot') where exists (select 1 from cron.job where jobname = 'pulse-snapshot');
    perform cron.schedule('pulse-snapshot', '0 3 * * *', $job$
      insert into public.progress_history (user_id, course_id, state, reason)
        select user_id, course_id, state, 'nightly' from public.progress;
      delete from public.progress_history where reason = 'nightly' and saved_at < now() - interval '14 days';
    $job$);
  end if;
end $outer$;
