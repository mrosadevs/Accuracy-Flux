'use client';

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any> | null = null;

// Lazy singleton lives outside React so components never mutate module state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): SupabaseClient<any> {
  if (!client) {
    client = createClient();
  }
  return client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSupabase(): SupabaseClient<any> {
  return useMemo(() => getClient(), []);
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return !!(url && !url.includes('YOUR_PROJECT_REF') && key && !key.includes('YOUR_ANON_KEY'));
}
