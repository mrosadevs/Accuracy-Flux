'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Zap, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function SetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/dashboard';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSetPassword() {
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push(nextPath), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set password. The link may have expired — please request a new one.');
    } finally {
      setSaving(false);
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">Accuracy Flux</span>
        </div>

        {done ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-success" />
            </motion.div>
            <h2 className="text-xl font-bold text-text-primary mb-2">All set!</h2>
            <p className="text-sm text-text-muted">Redirecting you now…</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Set Your Password</h2>
              <p className="text-sm text-text-muted mt-2">
                Choose a secure password to complete your account setup.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-danger/5 border border-danger/20 rounded-xl mb-4 text-sm text-danger"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-12 pl-10 pr-12 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={`flex-1 h-1 rounded-full transition-colors ${strength >= 1 ? (strength === 1 ? 'bg-danger' : strength === 2 ? 'bg-warning' : 'bg-success') : 'bg-border'}`} />
                    <div className={`flex-1 h-1 rounded-full transition-colors ${strength >= 2 ? (strength === 2 ? 'bg-warning' : 'bg-success') : 'bg-border'}`} />
                    <div className={`flex-1 h-1 rounded-full transition-colors ${strength >= 3 ? 'bg-success' : 'bg-border'}`} />
                    <span className="text-[10px] text-text-muted ml-1 w-12">
                      {strength === 1 ? 'Weak' : strength === 2 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                    placeholder="Repeat your password"
                    className="w-full h-12 pl-10 pr-12 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-danger mt-1">Passwords do not match</p>
                )}
              </div>

              <motion.button
                onClick={handleSetPassword}
                disabled={saving}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary-500/20 disabled:opacity-70 mt-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Set Password &amp; Continue
                  </>
                )}
              </motion.button>
            </div>

            <p className="text-center text-[10px] text-text-muted mt-6 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Protected by enterprise-grade encryption
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    }>
      <SetPasswordInner />
    </Suspense>
  );
}
