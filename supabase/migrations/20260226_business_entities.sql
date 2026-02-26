-- Add business_entities JSONB column to clients
-- Stores: Array<{ name: string; entity_type: string }>
-- The existing `businesses text[]` column is kept for backward compat (stores names only)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS business_entities jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add business_name to portal_documents for per-company document filtering in the portal
ALTER TABLE public.portal_documents
  ADD COLUMN IF NOT EXISTS business_name text;
