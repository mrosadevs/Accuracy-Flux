'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MoreHorizontal, Mail, Phone, Building2, Pencil, Trash2,
  LayoutGrid, List, Send, X, FileText, Receipt, CheckCircle,
  Calendar, DollarSign, AlertCircle, Loader2, UserPlus, Lock
} from 'lucide-react';
import clsx from 'clsx';
import { useClients } from '@/lib/hooks/use-clients';
import { useTeamMembers } from '@/lib/hooks/use-profile';
import { useInvoices } from '@/lib/hooks/use-invoices';
import type { Client } from '@/lib/types/database';

const statusColors = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  onboarding: 'bg-accent-400/10 text-accent-600 border-accent-400/20',
};
const statusDots = {
  active: 'bg-success',
  inactive: 'bg-text-muted',
  onboarding: 'bg-accent-500',
};

/* ─── Invoice Modal ─────────────────────────────────────────────────── */
function InvoiceModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const { createInvoice } = useInvoices(client.id);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [taxRate, setTaxRate] = useState('0');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const taxNum = parseFloat(taxRate) || 0;
  const taxAmount = (amountNum * taxNum) / 100;
  const total = amountNum + taxAmount;

  async function handleSend() {
    if (!description.trim()) { setError('Please add a description.'); return; }
    if (!amountNum) { setError('Please enter an amount.'); return; }
    setSending(true); setError('');
    try {
      await createInvoice({ client_id: client.id, amount: amountNum, tax_amount: taxAmount, description: description.trim(), due_date: dueDate, line_items: [{ description: description.trim(), amount: amountNum }] });
      setSent(true);
      setTimeout(onClose, 1800);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to send invoice'); }
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
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Send Invoice</h2>
              <p className="text-xs text-text-muted">{client.name}{client.company ? ` · ${client.company}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1">Invoice Sent!</h3>
              <p className="text-sm text-text-muted">Invoice emailed to {client.email}</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="p-6 space-y-4">
              {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Description</label>
                <input type="text" placeholder="e.g. 2025 Annual Tax Return preparation" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01"
                      className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tax Rate (%)</label>
                  <input type="number" placeholder="0" value={taxRate} onChange={e => setTaxRate(e.target.value)} min="0" max="100" step="0.1"
                    className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
                </div>
              </div>
              {amountNum > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-hover rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary"><span>Subtotal</span><span>${amountNum.toFixed(2)}</span></div>
                  {taxNum > 0 && <div className="flex justify-between text-xs text-text-secondary"><span>Tax ({taxRate}%)</span><span>${taxAmount.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-sm font-bold text-text-primary border-t border-border pt-2 mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  <p className="text-[10px] text-text-muted">Will be emailed to {client.email}</p>
                </motion.div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
                <motion.button onClick={handleSend} disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Send Invoice</>}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ─── New Client Modal ──────────────────────────────────────────────── */
function NewClientModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<Client>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'individual' | 'business'>('individual');
  const [status, setStatus] = useState<'active' | 'onboarding' | 'inactive'>('onboarding');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { members } = useTeamMembers();

  async function handleSave() {
    if (!name.trim()) { setError('Client name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ name: name.trim(), company: company.trim(), email: email.trim(), phone: phone.trim(), type, status, assigned_to: assignedTo.trim() });
      onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create client'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Add New Client</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Full Name *</label>
              <input type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Company</label>
              <input type="text" placeholder="Acme Corp" value={company} onChange={e => setCompany(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Email *</label>
              <input type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Phone</label>
              <input type="tel" placeholder="(555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Type</label>
              <select value={type} onChange={e => setType(e.target.value as typeof type)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as typeof status)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Assigned To</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name} ({m.role})</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5" />Add Client</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Invite to Portal Modal ────────────────────────────────────────── */
function InvitePortalModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const alreadyHasPortal = !!client.portal_user_id;

  async function handleInvite() {
    setSending(true); setError('');
    try {
      const res = await fetch('/api/invite-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, email: client.email, clientName: client.name }),
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Invite to Portal</h2>
              <p className="text-xs text-text-muted">{client.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">Invite Sent!</h3>
              <p className="text-xs text-text-muted">An email was sent to {client.email} with instructions to set up their portal account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alreadyHasPortal && (
                <div className="px-3 py-2.5 bg-warning/5 border border-warning/20 rounded-xl text-xs text-warning flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  This client already has a portal account. Sending again will let them reset access.
                </div>
              )}
              {error && <div className="px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
              <div className="bg-surface-hover rounded-xl p-4 space-y-1">
                <p className="text-xs font-semibold text-text-secondary">Invitation will be sent to:</p>
                <p className="text-sm font-medium text-text-primary">{client.email}</p>
                <p className="text-[10px] text-text-muted mt-2">The client will receive a secure link to create their password and access only their portal — no staff features visible.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
                <motion.button onClick={handleInvite} disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
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

/* ─── Clients Page ──────────────────────────────────────────────────── */

/* ─── Edit Client Modal ────────────────────────────────────────── */
function EditClientModal({ client, onClose, onSave }: { client: Client; onClose: () => void; onSave: (id: string, data: Partial<Client>) => Promise<void> }) {
  const [name, setName] = useState(client.name);
  const [company, setCompany] = useState(client.company ?? "");
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [status, setStatus] = useState<Client["status"]>(client.status);
  const [assignedTo, setAssignedTo] = useState(client.assigned_to ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { members } = useTeamMembers();

  async function handleSave() {
    if (!name.trim()) { setError("Client name is required."); return; }
    setSaving(true); setError("");
    try {
      await onSave(client.id, { name: name.trim(), company: company.trim(), email: email.trim(), phone: phone.trim(), status, assigned_to: assignedTo.trim() });
      onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to update client"); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Edit Client</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Company</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Client["status"])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Assigned To</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.name}>{m.name} ({m.role})</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Pencil className="w-3.5 h-3.5" />Save Changes</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Delete Client Modal ─────────────────────────────────────── */
function DeleteClientModal({ client, onClose, onDelete }: { client: Client; onClose: () => void; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true); setError("");
    try { await onDelete(client.id); onClose(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to delete client"); }
    finally { setDeleting(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <h2 className="text-base font-bold text-text-primary mb-1">Delete Client?</h2>
          <p className="text-sm text-text-muted mb-1">This will permanently delete <strong>{client.name}</strong>.</p>
          <p className="text-xs text-text-muted mb-6">Associated invoices and data will also be removed.</p>
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger mb-4"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleDelete} disabled={deleting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-danger hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" />Delete</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


export default function ClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [invoiceClient, setInvoiceClient] = useState<Client | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClientTarget, setDeleteClientTarget] = useState<Client | null>(null);
  const [inviteClient, setInviteClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell title="Clients" subtitle={`${clients.length} total clients`}>
      <AnimatePresence>
        {invoiceClient && <InvoiceModal client={invoiceClient} onClose={() => setInvoiceClient(null)} />}
        {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} onSave={addClient} />}
        {editClient && <EditClientModal client={editClient} onClose={() => setEditClient(null)} onSave={updateClient} />}
        {deleteClientTarget && <DeleteClientModal client={deleteClientTarget} onClose={() => setDeleteClientTarget(null)} onDelete={deleteClient} />}
        {inviteClient && <InvitePortalModal client={inviteClient} onClose={() => setInviteClient(null)} />}
      </AnimatePresence>

      <div className="max-w-[1800px] mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" placeholder="Search clients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 w-64 placeholder:text-text-muted transition-all" />
            </div>
            <div className="flex items-center bg-surface-hover rounded-xl p-1">
              {['all', 'active', 'onboarding', 'inactive'].map(status => (
                <button key={status} onClick={() => setSelectedStatus(status)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', selectedStatus === status ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary')}>
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-hover rounded-xl p-1">
              <button onClick={() => setViewMode('grid')} className={clsx('p-1.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={clsx('p-1.5 rounded-lg transition-all', viewMode === 'list' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted')}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <motion.button onClick={() => setShowNewClient(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Add Client
            </motion.button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm text-text-muted">Loading clients...</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredClients.map((client, i) => (
              <motion.div key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="relative bg-white rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-primary-500/5 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{client.name}</h3>
                      {client.company && <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" />{client.company}</p>}
                    </div>
                  </div>
                  <div className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', statusColors[client.status])}>
                    <div className={clsx('w-1.5 h-1.5 rounded-full', statusDots[client.status])} />
                    {client.status}
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-text-secondary"><Mail className="w-3.5 h-3.5 text-text-muted" />{client.email}</div>
                  {client.phone && <div className="flex items-center gap-2 text-xs text-text-secondary"><Phone className="w-3.5 h-3.5 text-text-muted" />{client.phone}</div>}
                </div>
                {client.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {client.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-100">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border-light">
                  <div>
                    <p className="text-[10px] text-text-muted">Total Billed</p>
                    <p className="text-sm font-bold text-text-primary">${client.total_billed.toLocaleString()}</p>
                  </div>
                  {client.outstanding_balance > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted">Outstanding</p>
                      <p className="text-sm font-bold text-danger">${client.outstanding_balance.toLocaleString()}</p>
                    </div>
                  )}
                  {client.assigned_to && (
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted">Assigned</p>
                      <p className="text-xs font-medium text-text-primary">{client.assigned_to}</p>
                    </div>
                  )}
                </div>
                {/* Hover actions */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 bg-gradient-to-t from-white via-white/95 to-transparent rounded-b-2xl">
                  <motion.button onClick={e => { e.stopPropagation(); setInvoiceClient(client); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                    <FileText className="w-3 h-3" />Invoice
                  </motion.button>
                  <motion.button onClick={e => { e.stopPropagation(); setInviteClient(client); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className={clsx('flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors',
                      client.portal_user_id ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-text-secondary bg-surface-hover hover:bg-border')}>
                    <Lock className="w-3 h-3" />{client.portal_user_id ? 'Portal ✓' : 'Portal Invite'}
                  </motion.button>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button onClick={e => { e.stopPropagation(); setEditClient(client); }} whileHover={{ scale: 1.1 }} className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"><Pencil className="w-3 h-3" /></motion.button>
                  <motion.button onClick={e => { e.stopPropagation(); setDeleteClientTarget(client); }} whileHover={{ scale: 1.1 }} className="p-1.5 bg-danger hover:bg-red-700 text-white rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></motion.button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-primary-400 via-accent-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,auto] gap-4 px-5 py-3 bg-surface-hover/50 border-b border-border">
              {['Client', 'Contact', 'Status', 'Billed', 'Assigned To', ''].map(h => (
                <span key={h} className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{h}</span>
              ))}
            </div>
            {filteredClients.map((client, i) => (
              <motion.div key={client.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,auto] gap-4 px-5 py-3.5 border-b border-border-light hover:bg-surface-hover/50 transition-colors items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{client.name}</p>
                    {client.company && <p className="text-xs text-text-muted">{client.company}</p>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{client.email}</p>
                  <p className="text-xs text-text-muted">{client.phone}</p>
                </div>
                <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', statusColors[client.status])}>
                  <div className={clsx('w-1.5 h-1.5 rounded-full', statusDots[client.status])} />{client.status}
                </span>
                <p className="text-sm font-semibold text-text-primary">${client.total_billed.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">{client.assigned_to}</p>
                <div className="flex items-center gap-1">
                  <motion.button onClick={() => setInvoiceClient(client)} whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Receipt className="w-3 h-3" />Invoice
                  </motion.button>
                  <motion.button onClick={() => setInviteClient(client)} whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-green-600 hover:bg-green-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Lock className="w-3 h-3" />Portal
                  </motion.button>
                  <motion.button onClick={e => { e.stopPropagation(); setEditClient(client); }} whileHover={{ scale: 1.05 }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-600 hover:bg-amber-50 transition-colors opacity-0 group-hover:opacity-100"><Pencil className="w-3 h-3" />Edit</motion.button>
                  <motion.button onClick={e => { e.stopPropagation(); setDeleteClientTarget(client); }} whileHover={{ scale: 1.05 }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-danger hover:bg-danger/5 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" />Delete</motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
