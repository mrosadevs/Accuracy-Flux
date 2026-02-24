'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Shield,
  Smartphone, CheckCircle2, Key, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { useSupabase } from '@/lib/hooks/use-supabase';

function LoginPageInner() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'login' | '2fa' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'staff' | 'client'>('staff');
  const [error, setError] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Show errors passed via ?error= from auth callback (e.g. expired invite link)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        // If Supabase isn't configured yet, just redirect to dashboard (dev mode)
        if (signInError.message?.includes('fetch') || signInError.message?.includes('Load failed')) {
          router.push('/dashboard');
          return;
        }
        throw signInError;
      }

      // Check if MFA is required
      if (data.session?.user) {
        const { data: mfaData } = await supabase.auth.mfa.listFactors();
        const totpFactor = mfaData?.totp?.find(f => f.status === 'verified');

        if (totpFactor) {
          setMfaFactorId(totpFactor.id);
          setStep('2fa');
        } else {
          // Always redirect based on actual DB role, not which tab was clicked
          const { data: profileData } = await supabase
            .from('profiles').select('role').eq('id', data.session.user.id).single();
          router.push(profileData?.role === 'client' ? '/portal' : '/dashboard');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('fetch') || msg.includes('Load failed') || msg.includes('Invalid URL')) {
        // Supabase not configured — allow dev bypass
        router.push('/dashboard');
      } else {
        setError(msg === 'Invalid login credentials' ? 'Wrong email or password.' : msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (!challenge) throw new Error('MFA challenge failed');

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: fullCode,
      });

      if (verifyError) throw verifyError;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profileData } = user
        ? await supabase.from('profiles').select('role').eq('id', user.id).single()
        : { data: null };
      router.push(profileData?.role === 'client' ? '/portal' : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setIsLoading(true); setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? window.location.origin + "/auth/callback" : "/auth/callback",
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally { setIsLoading(false); }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0">
          {[
            { size: 'w-96 h-96', pos: 'top-[10%] left-[10%]', anim: { x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }, dur: 15 },
            { size: 'w-64 h-64', pos: 'bottom-[20%] right-[10%]', anim: { x: [0, -80, 0], y: [0, 80, 0], scale: [1, 0.8, 1] }, dur: 12 },
            { size: 'w-48 h-48', pos: 'top-[50%] left-[30%]', anim: { x: [0, 60, 0], y: [0, -60, 0] }, dur: 10 },
          ].map((orb, i) => (
            <motion.div
              key={i}
              className={`absolute ${orb.size} rounded-full ${i === 2 ? 'bg-pink-500/10' : 'bg-white/5'}`}
              animate={orb.anim}
              transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
              style={{ top: orb.pos.includes('top') ? orb.pos.split(' ')[0].replace('top-[', '').replace(']', '') : undefined, bottom: orb.pos.includes('bottom') ? orb.pos.split(' ')[0].replace('bottom-[', '').replace(']', '') : undefined }}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative flex flex-col justify-center px-16 z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Accuracy Flux</h1>
                <p className="text-sm text-white/60">Practice Management</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Streamline your<br />
              <span className="bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                accounting practice
              </span>
            </h2>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Manage clients, automate workflows, and grow your practice with the most modern accounting platform.
            </p>

            <div className="mt-10 space-y-4">
              {[
                'End-to-end encrypted file sharing',
                'Two-factor authentication (TOTP)',
                'Real-time collaboration',
                'Secure client portal',
              ].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white/80" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">Accuracy Flux</span>
          </div>

          {/* Login Type Toggle */}
          <div className="flex items-center bg-surface-hover rounded-2xl p-1.5 mb-8">
            {(['staff', 'client'] as const).map(type => (
              <button
                key={type}
                onClick={() => { setLoginType(type); setError(''); }}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  loginType === type
                    ? 'bg-white shadow-sm text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {type === 'staff' ? 'Staff Login' : 'Client Portal'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 className="text-2xl font-bold text-text-primary mb-1">
                  {loginType === 'staff' ? 'Welcome back' : 'Client Access'}
                </h2>
                <p className="text-sm text-text-muted mb-8">
                  {loginType === 'staff'
                    ? 'Sign in to your practice account'
                    : 'Access your secure client portal'}
                </p>

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
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        placeholder="you@example.com"
                        className="w-full h-12 pl-10 pr-4 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        placeholder="Enter your password"
                        className="w-full h-12 pl-10 pr-12 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500" />
                      <span className="text-xs text-text-secondary">Remember me</span>
                    </label>
                    <button onClick={() => { setStep("forgot"); setError(""); setResetSent(false); }} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      Forgot password?
                    </button>
                  </div>

                  <motion.button
                    onClick={handleLogin}
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary-500/20 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>

              </motion.div>
            ) : step === 'forgot' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                {resetSent ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Check your email</h2>
                    <p className="text-sm text-text-muted mb-8">We&apos;ve sent a password reset link to <strong>{email}</strong>.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
                      <Key className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Reset Password</h2>
                    <p className="text-sm text-text-muted mb-8 text-left">Enter your email and we&apos;ll send you a link to reset your password.</p>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-4 py-3 bg-danger/5 border border-danger/20 rounded-xl mb-4 text-sm text-danger text-left">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                      </motion.div>
                    )}
                    <div className="space-y-4 text-left">
                      <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} placeholder="you@example.com"
                            className="w-full h-12 pl-10 pr-4 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
                        </div>
                      </div>
                      <motion.button onClick={handleForgotPassword} disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                        className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary-500/20 disabled:opacity-70">
                        {isLoading ? (
                          <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                        ) : (<><Mail className="w-4 h-4" />Send Reset Link</>)}
                      </motion.button>
                    </div>
                  </>
                )}
                <button onClick={() => { setStep('login'); setError(''); setResetSent(false); }} className="mt-6 text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Back to login
                </button>
              </motion.div>
) : (
              <motion.div
                key="2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400/10 to-pink-500/10 flex items-center justify-center mx-auto mb-5"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Shield className="w-8 h-8 text-accent-600" />
                </motion.div>

                <h2 className="text-2xl font-bold text-text-primary mb-1">Two-Factor Auth</h2>
                <p className="text-sm text-text-muted mb-8">
                  Enter the 6-digit code from your authenticator app
                </p>

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

                <div className="flex justify-center gap-3 mb-6">
                  {code.map((digit, i) => (
                    <motion.input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-12 h-14 text-center text-xl font-bold bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    />
                  ))}
                </div>

                <motion.button
                  onClick={handleVerify2FA}
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary-500/20 disabled:opacity-70"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>

                <div className="mt-6 space-y-3">
                  <button className="flex items-center justify-center gap-2 text-xs text-text-muted hover:text-text-secondary w-full py-2">
                    <Smartphone className="w-3.5 h-3.5" />
                    Send code via SMS instead
                  </button>
                  <button className="flex items-center justify-center gap-2 text-xs text-text-muted hover:text-text-secondary w-full py-2">
                    <Key className="w-3.5 h-3.5" />
                    Use recovery code
                  </button>
                </div>

                <button
                  onClick={() => { setStep('login'); setCode(['', '', '', '', '', '']); setError(''); }}
                  className="mt-4 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Back to login
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-text-muted flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Protected by enterprise-grade encryption
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
