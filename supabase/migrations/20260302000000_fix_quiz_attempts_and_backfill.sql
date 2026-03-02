-- Ensure quiz_attempts has fields used by /api/training/quiz-complete
alter table public.quiz_attempts
  add column if not exists attempt_number integer not null default 1,
  add column if not exists answers jsonb;

-- Backfill missing passed quiz attempts from training_progress
insert into public.quiz_attempts (
  user_id,
  module_id,
  attempt_number,
  score,
  passed,
  answers,
  completed_at
)
select
  tp.user_id,
  tp.module_id,
  coalesce(existing.max_attempt, 0) + row_number() over (
    partition by tp.user_id, tp.module_id
    order by coalesce(tp.completed_at, tp.updated_at, now())
  ) as attempt_number,
  coalesce(tp.quiz_score, 100) as score,
  true as passed,
  null::jsonb as answers,
  coalesce(tp.completed_at, tp.updated_at, now()) as completed_at
from public.training_progress tp
left join (
  select user_id, module_id, max(attempt_number) as max_attempt
  from public.quiz_attempts
  group by user_id, module_id
) existing
  on existing.user_id = tp.user_id and existing.module_id = tp.module_id
where tp.resource_type = 'quiz'
  and tp.quiz_passed = true
  and not exists (
    select 1
    from public.quiz_attempts qa
    where qa.user_id = tp.user_id
      and qa.module_id = tp.module_id
      and qa.passed = true
  );
