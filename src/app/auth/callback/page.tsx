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
      const supabase = createClient();
      const next = searchParams.get('next') ?? '/dashboard';
      const code = searchParams.get('code');
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type') as EmailOtpType | null;
      const errorParam = searchParams.get('error');

      if (errorParam) {
        router.replace(`/login?error=${errorParam}`);
        return;
      }

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
      // The Supabase browser client auto-parses #access_token=... from the URL
      // and stores the session.  We just need to read it back.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(`/set-password?next=${encodeURIComponent(next)}`);
        return;
      }

      // Nothing matched — send to login with an error flag
      router.replace('/login?error=auth_callback_failed');
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
