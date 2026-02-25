-- Migration: Multi-business support per client
-- Run this in your Supabase dashboard → SQL Editor

-- 1. Add businesses array to clients (each client can have multiple business entities)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS businesses text[] NOT NULL DEFAULT '{}';

-- 2. Add business_name to work_items (which business entity this work is for)
ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS business_name text DEFAULT NULL;
