-- One-time data repair: restore report scores into the simulation columns.
--
-- WHY THIS EXISTS
-- `reports.scores` is where a report's risk/decision/confidence figures are
-- computed and stored, as one coherent triple derived from a single forecast. The
-- matching columns on `simulations` are a denormalized copy, kept so the
-- simulations list and dashboard can sort and filter without joining `reports`.
-- Report generation before commit dbdc07d did not write that copy, so 16 rows
-- created 2026-08-11..2026-08-18 hold a report with real scores while
-- `simulations."riskScore"/"decisionScore"/"confidenceScore"` are NULL.
--
-- The visible symptom was two pages disagreeing about the same simulation: the
-- compare page reads `reports.scores` first and showed real numbers, while the
-- results page and the simulations list read only the copy and said
-- "Not assessed". Commit 8eef246 fixed the results endpoint to fall back to the
-- report, but `mapSim` (the list and dashboard) still reads the columns, and
-- adding a join to that hot path to paper over stale rows is the wrong trade.
-- Hence this backfill.
--
-- WHAT IT TOUCHES
-- A row is repaired when ANY of its three score columns is NULL while the report
-- carries all three — that is, a missing or torn write, in either direction. All
-- three columns are then restored together from the report, because they were
-- computed together: filling only the NULL one could leave a row mixing a stale
-- figure with a fresh one, which is a worse state than the one we started in. A
-- row whose three columns are all populated is never touched, and once repaired
-- no column is NULL, so re-running this is a no-op.
--
-- `updatedAt` is deliberately left alone: nothing orders by it (every list uses
-- `createdAt`), the row's meaning has not changed, and Prisma's @updatedAt is
-- client-side so raw SQL would have to set it by hand anyway.
--
-- `scores` is written with JSON.stringify into a jsonb column, so some rows hold
-- a jsonb *string* containing JSON rather than a jsonb object — the same mixed
-- shape as `users.roles`. The `case` below normalizes both.

-- ── 1. DRY RUN — review before writing anything ──────────────────────────────
with r as (
  select "simulationId" as sim_id,
         case when jsonb_typeof(scores) = 'object' then scores
              else (scores #>> '{}')::jsonb end as sc
  from reports
)
select s.id,
       s.title,
       s."createdAt"::date as created,
       s."riskScore"       as risk_now,
       s."decisionScore"   as decision_now,
       s."confidenceScore" as confidence_now,
       round((r.sc ->> 'riskScore')::numeric)::int       as risk_from_report,
       round((r.sc ->> 'decisionScore')::numeric)::int   as decision_from_report,
       round((r.sc ->> 'confidenceScore')::numeric)::int as confidence_from_report
from simulations s
join r on r.sim_id = s.id
where (s."riskScore" is null or s."decisionScore" is null or s."confidenceScore" is null)
  and r.sc ->> 'riskScore'       is not null
  and r.sc ->> 'decisionScore'   is not null
  and r.sc ->> 'confidenceScore' is not null
order by s."createdAt";

-- ── 2. THE BACKFILL ─────────────────────────────────────────────────────────
with r as (
  select "simulationId" as sim_id,
         case when jsonb_typeof(scores) = 'object' then scores
              else (scores #>> '{}')::jsonb end as sc
  from reports
)
update simulations s
set "riskScore"       = round((r.sc ->> 'riskScore')::numeric)::int,
    "decisionScore"   = round((r.sc ->> 'decisionScore')::numeric)::int,
    "confidenceScore" = round((r.sc ->> 'confidenceScore')::numeric)::int
from r
where r.sim_id = s.id
  and (s."riskScore" is null or s."decisionScore" is null or s."confidenceScore" is null)
  and r.sc ->> 'riskScore'       is not null
  and r.sc ->> 'decisionScore'   is not null
  and r.sc ->> 'confidenceScore' is not null;

-- ── 3. VERIFY — bucket 4 must be gone ───────────────────────────────────────
-- Expected after the backfill: bucket 4 disappears and bucket 3 absorbs its rows.
-- Bucket 5 being empty on this platform is what makes the repair possible at all —
-- every report carries real scores, so nothing has to be recomputed. "Scored"
-- below means all three columns are populated, matching what the backfill treats
-- as healthy, so a torn row cannot hide in bucket 3.
select case
         when r.id is null
              and s."riskScore" is null and s."decisionScore" is null and s."confidenceScore" is null
           then '1. no report, no score'
         when r.id is null                                  then '2. score without a report'
         when s."riskScore" is not null and s."decisionScore" is not null
              and s."confidenceScore" is not null           then '3. healthy: report + sim both scored'
         when (case when jsonb_typeof(r.scores) = 'object' then r.scores
                    else (r.scores #>> '{}')::jsonb end) ->> 'decisionScore' is not null
           then '4. BUG: report has scores, sim columns are NULL'
         else '5. report exists but carries no scores'
       end as bucket,
       count(*)                 as row_count,
       min(s."createdAt")::date as first_seen,
       max(s."createdAt")::date as last_seen
from simulations s
left join reports r on r."simulationId" = s.id
group by 1
order by 1;
