'use client';

import { useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile, useTeamMembers } from '@/lib/hooks/use-profile';
import type { Profile } from '@/lib/hooks/use-profile';
import {
  UserPlus, Shield, User, UserCog, Loader2, AlertCircle, CheckCircle,
  Send, X, ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

const roleConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  owner: { label: 'Owner', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Shield },
  admin: { label: 'Admin', color: 'text-primary-700', bg: 'bg-primary-50 border-primary-200', icon: UserCog },
  staff: { label: 'Staff', color: 'text-text-secondary', bg: 'bg-surface-hover border-border', icon: User },
  client: { label: 'Client', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: User },
};

/* ─── Invite Staff Modal ────────────────────────────────────────────── */
function InviteStaffModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleInvite() {
    if (!email.trim() || !name.trim()) { setError('Email and name are required.'); return; }
    setSending(true); setError('');
    try {
      const res = await fetch('/api/invite-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invite');
      setSent(true);
      setTimeout(onClose, 2000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to send invite'); }
    finally { setSending(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Invite Team Member</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">Invite Sent!</h3>
              <p className="text-xs text-text-muted">{name} will receive an email to set up their account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Full Name *</label>
                <input type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Email *</label>
                <input
                  type="text"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  placeholder="jane@yourfirm.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={e => { const len = e.target.value.length; e.target.setSelectionRange(len, len); }}
                  onKeyUp={e => {
                    // If a password manager selected all text, move cursor back to end
                    const t = e.currentTarget;
                    if (t.selectionStart === 0 && t.selectionEnd === t.value.length && t.value.length > 0) {
                      t.setSelectionRange(t.value.length, t.value.length);
                    }
                  }}
                  className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Role</label>
                <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'staff')}
                  className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                  <option value="staff">Staff — Can manage clients, work, and kanban</option>
                  <option value="admin">Admin — Can also invite/manage team members</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
                <motion.button onClick={handleInvite} disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Send Invite</>}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Team Page ─────────────────────────────────────────────────────── */
export default function TeamPage() {
  const { isAdmin, isOwner } = useProfile();
  const { members, loading, updateMemberRole } = useTeamMembers();
  const [showInvite, setShowInvite] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [roleMsg, setRoleMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  // Stable reference — prevents AnimatePresence from re-initialising the modal on parent re-renders
  const handleCloseInvite = useCallback(() => setShowInvite(false), []);

  async function handleRoleChange(memberId: string, newRole: Profile['role']) {
    setChangingRole(memberId);
    try {
      await updateMemberRole(memberId, newRole);
      setRoleMsg(prev => ({ ...prev, [memberId]: { ok: true, text: 'Role updated' } }));
      setTimeout(() => setRoleMsg(prev => { const next = { ...prev }; delete next[memberId]; return next; }), 2000);
    } catch (err: unknown) {
      setRoleMsg(prev => ({ ...prev, [memberId]: { ok: false, text: err instanceof Error ? err.message : 'Failed' } }));
    } finally { setChangingRole(null); }
  }

  return (
    <AppShell title="Team" subtitle={`${members.length} team members`}>
      <AnimatePresence>
        {showInvite && <InviteStaffModal key="invite-modal" onClose={handleCloseInvite} />}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div />
          {isAdmin && (
            <motion.button onClick={() => setShowInvite(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" />
              Invite Team Member
            </motion.button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, i) => {
              const rc = roleConfig[member.role];
              const RoleIcon = rc?.icon ?? User;
              const initials = member.initials ?? member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              const msg = roleMsg[member.id];

              return (
                <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: member.color ?? '#3b82f6' }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{member.name}</p>
                    <div className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-1', rc?.bg, rc?.color)}>
                      <RoleIcon className="w-3 h-3" />
                      {rc?.label}
                    </div>
                  </div>

                  {/* Role change — owner only, can't change own role */}
                  <div className="flex items-center gap-3">
                    {msg && (
                      <span className={clsx('text-xs font-medium', msg.ok ? 'text-success' : 'text-danger')}>{msg.text}</span>
                    )}
                    {isOwner && member.role !== 'owner' && (
                      <div className="relative">
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member.id, e.target.value as Profile['role'])}
                          disabled={changingRole === member.id}
                          className="h-9 pl-3 pr-8 text-xs bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                        {changingRole === member.id && <Loader2 className="absolute right-7 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-primary-500" />}
                      </div>
                    )}
                    {member.role === 'owner' && (
                      <span className="text-xs text-text-muted px-3 py-2 bg-surface-hover rounded-xl">Owner</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Role legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-2xl border border-border p-5">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Role Permissions</h3>
          <div className="space-y-3">
            {[
              { role: 'owner', desc: 'Full access to everything, including billing and owner-only settings. Cannot be changed.' },
              { role: 'admin', desc: 'Can manage clients, work, kanban, and invite/manage team members.' },
              { role: 'staff', desc: 'Can manage clients, work items, and kanban cards. Cannot manage team.' },
            ].map(({ role, desc }) => {
              const rc = roleConfig[role];
              const RoleIcon = rc.icon;
              return (
                <div key={role} className="flex items-start gap-3">
                  <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border flex-shrink-0 mt-0.5', rc.bg, rc.color)}>
                    <RoleIcon className="w-3 h-3" />
                    {rc.label}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
