'use client';

/**
 * Auth Callback Page
 *
 * Handles ALL auth redirect flows from Supabase emails:
 *  - Invite links  → hash fragment  #access_token=...  (admin inviteUserByEmail)
 *  - Password reset → PKCE code     ?code=...           (resetPasswordForEmail)
 *  - Magic links   → OTP token_hash ?token_hash=...
 *
 * Must be a CLIENT component so it can read the URL hash (server routes never
 * receive hash fragments — the browser strips them before sending the request).
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { EmailOtpType } from '@supabase/supabase-js';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient();
        const next = searchParams.get('next') ?? '/dashboard';

        // ── 0. Check hash fragment for errors FIRST (e.g. expired invite links)
        const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
        const hashParams = new URLSearchParams(hash);
        const hashError = hashParams.get('error');
        if (hashError) {
          const errorCode = hashParams.get('error_code') ?? '';
          // Expired invite — show a dedicated message
          if (errorCode === 'otp_expired' || hashError === 'access_denied') {
            router.replace('/invite-expired');
          } else {
            const desc = hashParams.get('error_description') ?? hashError;
            router.replace(`/login?error=${encodeURIComponent(desc)}`);
          }
          return;
        }

        // ── 0b. Check query-string errors ─────────────────────────────────────
        const errorParam = searchParams.get('error');
        if (errorParam) {
          router.replace(`/login?error=${encodeURIComponent(errorParam)}`);
          return;
        }

        const code = searchParams.get('code');
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type') as EmailOtpType | null;

        // ── 1. PKCE code exchange (password-reset emails) ──────────────────────
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            router.replace(`/set-password?next=${encodeURIComponent(next)}`);
            return;
          }
        }

        // ── 2. OTP token_hash (magic links) ────────────────────────────────────
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (!error) {
            router.replace(`/set-password?next=${encodeURIComponent(next)}`);
            return;
          }
        }

        // ── 3. Hash-fragment flow (invite emails from admin API) ───────────────
        // Explicitly set session from hash tokens — more reliable than waiting
        // for the Supabase client to auto-parse the hash asynchronously.
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!sessionError) {
            router.replace(`/set-password?next=${encodeURIComponent(next)}`);
            return;
          }
        }

        // Fallback: check if Supabase already parsed the hash on its own
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace(`/set-password?next=${encodeURIComponent(next)}`);
          return;
        }

        // Nothing matched — send to login with an error flag
        router.replace('/login?error=auth_callback_failed');
      } catch {
        // Safety net — never leave the user stuck on the loading screen
        router.replace('/login?error=auth_callback_failed');
      }
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-text-muted">Setting up your account…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
