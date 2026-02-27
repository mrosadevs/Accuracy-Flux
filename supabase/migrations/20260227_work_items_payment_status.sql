-- Add payment tracking columns to work_items
-- payment_status: 'pending' (default) or 'received'
-- payment_received_at: timestamp when payment was marked received (for monthly revenue reporting)

ALTER TABLE public.work_items
  ADD COLUMN IF NOT EXISTS payment_status      text        NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'received')),
  ADD COLUMN IF NOT EXISTS payment_received_at timestamptz;
