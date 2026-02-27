-- ============================================================
-- Migration: one work_item per business entity
--
-- Before: one work_item per client, entities grouped inside the card
-- After:  one work_item per entity with auto-set due_date and entity_type
--
-- Run BEFORE add_tasks_v2.sql (tasks will be recreated by that script).
-- ============================================================

-- 1. Add entity_type column (stores the entity type key for the card)
ALTER TABLE public.work_items ADD COLUMN IF NOT EXISTS entity_type text;

-- 2. For clients WITH entities: create one work_item per entity,
--    then delete the old combined work_item (CASCADE removes its tasks).
WITH old_ids AS (
  SELECT wi.id
  FROM public.work_items wi
  JOIN public.clients c ON c.id = wi.client_id
  WHERE c.business_entities IS NOT NULL
    AND jsonb_array_length(c.business_entities) > 0
),
new_items AS (
  INSERT INTO public.work_items (
    title, client_id, client_name, type, status, priority,
    column_id, board_id, due_date, entity_type, business_name,
    description, assignee_id, assignee, sort_order
  )
  SELECT
    (be->>'name') || ' 2025 Tax Return'  AS title,
    c.id                                  AS client_id,
    c.name                                AS client_name,
    wi.type,
    wi.status,
    wi.priority,
    wi.column_id,
    wi.board_id,
    CASE (be->>'entity_type')
      WHEN 's-corp'      THEN '2026-03-15'::date
      WHEN 'partnership' THEN '2026-03-15'::date
      WHEN 'llc-multi'   THEN '2026-03-15'::date
      WHEN 'non-profit'  THEN '2026-05-15'::date
      ELSE '2026-04-15'::date
    END                                   AS due_date,
    (be->>'entity_type')                  AS entity_type,
    (be->>'name')                         AS business_name,
    wi.description,
    wi.assignee_id,
    wi.assignee,
    wi.sort_order
  FROM public.work_items wi
  JOIN public.clients c ON c.id = wi.client_id
  CROSS JOIN LATERAL jsonb_array_elements(c.business_entities) AS be
  WHERE wi.id IN (SELECT id FROM old_ids)
  RETURNING id
),
del AS (
  DELETE FROM public.work_items
  WHERE id IN (SELECT id FROM old_ids)
  RETURNING id
)
SELECT 'inserted' AS op, count(*) FROM new_items
UNION ALL
SELECT 'deleted',           count(*) FROM del;

-- 3. For individual clients (no entities): stamp entity_type and due_date
UPDATE public.work_items wi
SET
  entity_type = 'individual',
  due_date    = '2026-04-15'::date
FROM public.clients c
WHERE c.id = wi.client_id
  AND (c.business_entities IS NULL OR jsonb_array_length(c.business_entities) = 0)
  AND wi.entity_type IS NULL;
