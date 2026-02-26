-- Add status field to tasks for per-task workflow tracking
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not-started'
    CHECK (status IN ('not-started', 'in-progress', 'waiting-on-client', 'in-review', 'completed'));

-- Backfill: tasks that are already marked completed should get 'completed' status
UPDATE public.tasks SET status = 'completed' WHERE completed = true;
