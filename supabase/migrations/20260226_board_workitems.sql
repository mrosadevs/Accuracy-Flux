-- ─────────────────────────────────────────────────────────────────────────────
-- Link work_items to kanban boards/columns (makes work items the board cards)
-- Also adds tags (labels) and sort_order for drag-and-drop ordering
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS board_id    uuid        REFERENCES public.kanban_boards(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS column_id   uuid        REFERENCES public.kanban_columns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags        text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order  integer     NOT NULL DEFAULT 0;

-- Season archive flag on boards
ALTER TABLE public.kanban_boards
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Indexes for fast board/column lookups
CREATE INDEX IF NOT EXISTS idx_work_items_board_id  ON public.work_items(board_id);
CREATE INDEX IF NOT EXISTS idx_work_items_column_id ON public.work_items(column_id);
