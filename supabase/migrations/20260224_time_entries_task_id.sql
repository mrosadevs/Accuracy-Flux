-- Add task_id column to time_entries (was missing from original schema)
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
