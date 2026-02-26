-- Control which work items are visible to clients in their portal
-- By default nothing is shown; staff must explicitly enable per work item
ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS show_in_portal boolean NOT NULL DEFAULT false;
