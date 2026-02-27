'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from './use-supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const supabase = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // When the session expires and can't be refreshed, redirect to login
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function verifyTOTP(code: string) {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: '', // Will be populated from mfa.listFactors
      code,
    });
    if (error) throw error;
    return data;
  }

  async function enrollTOTP() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw error;
    return data;
  }

  return { user, loading, signIn, signOut, verifyTOTP, enrollTOTP };
}
