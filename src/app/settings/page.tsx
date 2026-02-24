'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion } from 'framer-motion';
import { useProfile } from '@/lib/hooks/use-profile';
import { useSupabase } from '@/lib/hooks/use-supabase';
import { useRouter } from 'next/navigation';
import {
  User, Lock, LogOut, Save, Loader2, AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import clsx from 'clsx';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export default function SettingsPage() {
  const { profile, updateProfile, loading } = useProfile();
  const supabase = useSupabase();
  const router = useRouter();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [signingOut, setSigningOut] = useState(false);

  const displayName = name || profile?.name || '';
  const displayColor = selectedColor || profile?.color || '#3b82f6';
  const initials = displayName ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AF';

  async function handleSaveProfile() {
    setSavingProfile(true); setProfileMsg(null);
    try {
      const cleanName = (name || profile?.name || '').trim();
      await updateProfile({
        name: cleanName,
        color: selectedColor || profile?.color || '#3b82f6',
        initials: cleanName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      });
      setProfileMsg({ ok: true, text: 'Profile saved!' });
    } catch (err: unknown) {
      setProfileMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to save' });
    } finally { setSavingProfile(false); }
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) { setPwMsg({ ok: false, text: 'Please fill all fields.' }); return; }
    if (newPassword !== confirmPassword) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    if (newPassword.length < 8) { setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return; }
    setSavingPw(true); setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMsg({ ok: true, text: 'Password updated successfully!' });
      setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update password' });
    } finally { setSavingPw(false); }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <AppShell title="Settings" subtitle="Account & preferences">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Settings" subtitle="Account & preferences">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Profile</h2>
              <p className="text-xs text-text-muted">Your name and avatar color</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg transition-colors"
              style={{ backgroundColor: displayColor }}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{displayName || 'Your Name'}</p>
              <p className="text-xs text-text-muted capitalize">{profile?.role ?? 'staff'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Display Name</label>
              <input type="text" placeholder={profile?.name ?? 'Your name'}
                value={name || profile?.name || ''} onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-2 block">Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <button key={color} onClick={() => setSelectedColor(color)}
                    className={clsx('w-8 h-8 rounded-lg transition-all', (selectedColor || profile?.color) === color ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : 'hover:scale-105')}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            {profileMsg && (
              <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-xs', profileMsg.ok ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-danger/20')}>
                {profileMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {profileMsg.text}
              </div>
            )}
            <motion.button onClick={handleSaveProfile} disabled={savingProfile} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-70">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </motion.button>
          </div>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Password</h2>
              <p className="text-xs text-text-muted">Change your account password</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} placeholder="Min. 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {pwMsg && (
              <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-xs', pwMsg.ok ? 'bg-success/5 text-success border border-success/20' : 'bg-danger/5 text-danger border border-danger/20')}>
                {pwMsg.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {pwMsg.text}
              </div>
            )}
            <motion.button onClick={handleChangePassword} disabled={savingPw} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-70">
              {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </motion.button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-danger/5 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-danger" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary">Sign Out</h2>
                <p className="text-xs text-text-muted">End your current session on all devices</p>
              </div>
            </div>
            <motion.button onClick={handleSignOut} disabled={signingOut} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/20 text-danger hover:bg-danger/5 text-sm font-semibold transition-colors disabled:opacity-70">
              {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Sign Out
            </motion.button>
          </div>
        </motion.div>

      </div>
    </AppShell>
  );
}
