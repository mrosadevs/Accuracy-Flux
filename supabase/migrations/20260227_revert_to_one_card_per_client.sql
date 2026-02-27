-- ============================================================
-- Revert to 1 work_item (card) per client.
-- The per-entity split created duplicate cards — consolidate back.
-- Wipe all tasks so the user can apply templates cleanly per entity.
-- ============================================================

-- 1. Keep only the oldest work_item per client, delete the rest
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY created_at) AS rn
  FROM public.work_items
  WHERE client_id IS NOT NULL
),
to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM public.work_items WHERE id IN (SELECT id FROM to_delete);

-- 2. Reset entity_type and business_name (these are now per-entity inside the card, not on the work_item)
UPDATE public.work_items SET entity_type = NULL, business_name = NULL;

-- 3. Set due_date = earliest entity deadline for clients that have entities
UPDATE public.work_items wi
SET due_date = (
  SELECT MIN(
    CASE (be->>'entity_type')
      WHEN 's-corp'      THEN '2026-03-15'::date
      WHEN 'partnership' THEN '2026-03-15'::date
      WHEN 'llc-multi'   THEN '2026-03-15'::date
      WHEN 'non-profit'  THEN '2026-05-15'::date
      ELSE                    '2026-04-15'::date
    END
  )
  FROM public.clients c
  CROSS JOIN LATERAL jsonb_array_elements(c.business_entities) AS be
  WHERE c.id = wi.client_id
    AND c.business_entities IS NOT NULL
    AND jsonb_array_length(c.business_entities) > 0
)
WHERE EXISTS (
  SELECT 1 FROM public.clients c
  WHERE c.id = wi.client_id
    AND c.business_entities IS NOT NULL
    AND jsonb_array_length(c.business_entities) > 0
);

-- 4. Set due_date for individual clients (no entities)
UPDATE public.work_items wi
SET due_date = '2026-04-15'::date
FROM public.clients c
WHERE c.id = wi.client_id
  AND (c.business_entities IS NULL OR jsonb_array_length(c.business_entities) = 0)
  AND wi.due_date IS NULL;

-- 5. Wipe all tasks — user will apply templates per entity
DELETE FROM public.tasks;
