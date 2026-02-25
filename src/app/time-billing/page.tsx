'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeEntries } from '@/lib/hooks/use-time-entries';
import { useInvoices } from '@/lib/hooks/use-invoices';
import { useClients } from '@/lib/hooks/use-clients';
import { useWorkItems } from '@/lib/hooks/use-work-items';
import {
  Play, Square, Clock, TrendingUp, AlertCircle,
  Plus, FileText, MoreHorizontal, X, Save, Loader2, CheckCircle, Trash2, Link2, ListChecks, Briefcase
} from 'lucide-react';
import clsx from 'clsx';

const invoiceStatusColors: Record<string, string> = {
  paid:    'bg-success/10 text-success',
  sent:    'bg-primary-50 text-primary-600',
  overdue: 'bg-danger/10 text-danger',
  draft:   'bg-text-muted/10 text-text-muted',
};

/* ── Add Time Entry Modal ────────────────────────────────────────────── */
function AddEntryModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: {
    description: string; clientId: string | null; clientName: string;
    workItemId: string | null; taskId: string | null; hours: number; date: string; billable: boolean;
  }) => Promise<void>;
}) {
  const { clients }   = useClients();
  const { workItems } = useWorkItems();

  const [clientId,    setClientId]    = useState('');
  const [workItemId,  setWorkItemId]  = useState('');
  const [taskId,      setTaskId]      = useState('');
  const [hours,       setHours]       = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [billable,    setBillable]    = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  const filteredWorkItems = workItems.filter(w =>
    !clientId || w.client_id === clientId
  );

  const availableTasks = workItemId
    ? (workItems.find(w => w.id === workItemId)?.tasks ?? [])
    : [];

  function handleWorkItemChange(wid: string) {
    setWorkItemId(wid);
    setTaskId('');
    if (!wid) return;
    const wi = workItems.find(w => w.id === wid);
    if (wi && !clientId && wi.client_id) setClientId(wi.client_id);
  }

  function handleClientChange(cid: string) {
    setClientId(cid);
    if (workItemId) {
      const wi = workItems.find(w => w.id === workItemId);
      if (wi && wi.client_id && wi.client_id !== cid) { setWorkItemId(''); setTaskId(''); }
    }
  }

  async function handleSave() {
    if (!hours) { setError('Hours are required.'); return; }
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0) { setError('Enter a valid number of hours.'); return; }
    setSaving(true);
    try {
      const selectedClient = clients.find(c => c.id === clientId);
      const selectedTask = availableTasks.find(t => t.id === taskId);
      const selectedWorkItem = workItems.find(w => w.id === workItemId);
      const description = selectedTask?.title ?? selectedWorkItem?.title ?? '';
      await onSave({
        description,
        clientId: clientId || null,
        clientName: selectedClient?.name ?? '',
        workItemId: workItemId || null,
        taskId: taskId || null,
        hours: h, date, billable,
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to save';
      setError(msg);
    }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Log Time Entry</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Client</label>
            <select value={clientId} onChange={e => handleClientChange(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
              <option value="">No client (internal)</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />Work Item
            </label>
            <select value={workItemId} onChange={e => handleWorkItemChange(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
              <option value="">None</option>
              {filteredWorkItems.map(w => (
                <option key={w.id} value={w.id}>{w.title}{w.client_name ? ` (${w.client_name})` : ''}</option>
              ))}
            </select>
          </div>

          {workItemId && availableTasks.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
                <ListChecks className="w-3 h-3 text-primary-500" />Task
              </label>
              <select value={taskId} onChange={e => setTaskId(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="">No specific task</option>
                {availableTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}{t.assignee ? ` — ${t.assignee}` : ''}</option>
                ))}
              </select>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Hours *</label>
              <input type="number" step="0.25" min="0.25" placeholder="1.5" value={hours} onChange={e => setHours(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
            </div>
          </div>

          <button onClick={() => setBillable(!billable)}
            className={clsx('w-full h-10 px-4 rounded-xl text-xs font-semibold transition-colors border', billable ? 'bg-success/10 border-success/30 text-success' : 'bg-surface-hover border-border text-text-muted')}>
            {billable ? '✓ Billable' : 'Non-billable'}
          </button>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Log Time</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Start Timer Modal ────────────────────────────────────────────────── */
function StartTimerModal({ onClose, onStart }: {
  onClose: () => void;
  onStart: (data: {
    description: string; clientId: string | null; clientName: string;
    workItemId: string | null; workItemTitle: string; businessName: string;
    taskId: string | null; taskName: string; billable: boolean;
  }) => void;
}) {
  const { clients }   = useClients();
  const { workItems } = useWorkItems();

  const [clientId,    setClientId]    = useState('');
  const [workItemId,  setWorkItemId]  = useState('');
  const [taskId,      setTaskId]      = useState('');
  const [billable,    setBillable]    = useState(true);
  const [error,       setError]       = useState('');

  const filteredWorkItems = workItems.filter(w =>
    !clientId || w.client_id === clientId
  );

  const availableTasks = workItemId
    ? (workItems.find(w => w.id === workItemId)?.tasks ?? [])
    : [];

  const selectedWorkItem = workItems.find(w => w.id === workItemId) ?? null;
  const workItemBusiness = selectedWorkItem?.business_name ?? '';

  function handleWorkItemChange(wid: string) {
    setWorkItemId(wid);
    setTaskId('');
    if (!wid) return;
    const wi = workItems.find(w => w.id === wid);
    if (wi && !clientId && wi.client_id) setClientId(wi.client_id);
  }

  function handleClientChange(cid: string) {
    setClientId(cid);
    if (workItemId) {
      const wi = workItems.find(w => w.id === workItemId);
      if (wi && wi.client_id && wi.client_id !== cid) { setWorkItemId(''); setTaskId(''); }
    }
  }

  function handleStart() {
    if (!workItemId) { setError('Please select a work item.'); return; }
    const selectedClient = clients.find(c => c.id === clientId);
    const selectedTask = availableTasks.find(t => t.id === taskId);
    const description = selectedTask?.title ?? selectedWorkItem?.title ?? '';
    onStart({
      description,
      clientId: clientId || null,
      clientName: selectedClient?.name ?? '',
      workItemId: workItemId || null,
      workItemTitle: selectedWorkItem?.title ?? '',
      businessName: workItemBusiness,
      taskId: taskId || null,
      taskName: selectedTask?.title ?? '',
      billable,
    });
    onClose();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Start Timer</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Client</label>
            <select value={clientId} onChange={e => handleClientChange(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3 h-3" />Work Item
            </label>
            <select value={workItemId} onChange={e => handleWorkItemChange(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
              <option value="">None</option>
              {filteredWorkItems.map(w => (
                <option key={w.id} value={w.id}>{w.title}{w.client_name ? ` (${w.client_name}${w.business_name ? ' · ' + w.business_name : ''})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Show business badge when work item has one */}
          {workItemBusiness && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-accent-50 border border-accent-200 rounded-xl text-xs text-accent-700 font-medium">
                <Briefcase className="w-3 h-3" />Business: {workItemBusiness}
              </div>
            </motion.div>
          )}

          {workItemId && availableTasks.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
                <ListChecks className="w-3 h-3 text-primary-500" />Task
              </label>
              <select value={taskId} onChange={e => setTaskId(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="">No specific task</option>
                {availableTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}{t.assignee ? ` — ${t.assignee}` : ''}</option>
                ))}
              </select>
            </motion.div>
          )}

          <button onClick={() => setBillable(!billable)}
            className={clsx('w-full h-10 px-4 rounded-xl text-xs font-semibold transition-colors border', billable ? 'bg-success/10 border-success/30 text-success' : 'bg-surface-hover border-border text-text-muted')}>
            {billable ? '✓ Billable' : 'Non-billable'}
          </button>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleStart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-success hover:bg-success/90 text-white text-sm font-semibold flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />Start Timer
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function TimeBillingPage() {
  const {
    entries, loading: entriesLoading, activeTimer, elapsed, elapsedFormatted,
    startTimer, stopTimer, addManualEntry, deleteEntry,
    hoursThisWeek, hoursThisMonth,
  } = useTimeEntries();
  const { invoices, loading: invoicesLoading, outstanding, updateInvoiceStatus } = useInvoices();
  const [activeTab,      setActiveTab]      = useState<'time' | 'invoices'>('time');
  const [showAddEntry,   setShowAddEntry]   = useState(false);
  const [showStartTimer, setShowStartTimer] = useState(false);
  const [stoppingTimer,  setStoppingTimer]  = useState(false);

  useEffect(() => {
    try {
      const action = localStorage.getItem('af-auto-open');
      if (action === 'start-timer') {
        localStorage.removeItem('af-auto-open');
        setShowStartTimer(true);
      }
    } catch { /* ignore */ }
  }, []);

  async function handleStopTimer() {
    setStoppingTimer(true);
    try { await stopTimer(); } finally { setStoppingTimer(false); }
  }

  return (
    <AppShell title="Time & Billing" subtitle="Track time and manage invoices">
      <AnimatePresence>
        {showAddEntry   && <AddEntryModal   onClose={() => setShowAddEntry(false)}   onSave={addManualEntry} />}
        {showStartTimer && <StartTimerModal onClose={() => setShowStartTimer(false)} onStart={startTimer}   />}
      </AnimatePresence>

      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Hours This Week',  value: `${Math.round(hoursThisWeek * 10) / 10}h`,  icon: Clock,       color: 'text-primary-600 bg-primary-50'    },
            { label: 'Hours This Month', value: `${Math.round(hoursThisMonth * 10) / 10}h`, icon: Clock,       color: 'text-accent-600 bg-accent-400/10'  },
            { label: 'Total Entries',    value: entries.length,                               icon: TrendingUp,  color: 'text-success bg-success/10'        },
            { label: 'Outstanding',      value: `$${Math.round(outstanding).toLocaleString()}`, icon: AlertCircle, color: 'text-warning bg-warning/10'     },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-[10px] text-text-muted font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Timer Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={clsx('rounded-2xl p-5 text-white', activeTimer ? 'bg-gradient-to-r from-success to-emerald-600' : 'bg-gradient-to-r from-primary-600 to-primary-700')}>
          <div className="flex items-center justify-between">
            {activeTimer ? (
              <>
                <div className="flex items-center gap-4">
                  <motion.button onClick={handleStopTimer} disabled={stoppingTimer} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    {stoppingTimer ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                  </motion.button>
                  <div>
                    <p className="text-sm opacity-80 font-medium">Currently tracking</p>
                    <p className="text-lg font-bold">{activeTimer.description}{activeTimer.clientName ? ` — ${activeTimer.clientName}` : ''}</p>
                    <p className="text-xs opacity-70 mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>{activeTimer.billable ? 'Billable' : 'Non-billable'}</span>
                      {activeTimer.businessName && (
                        <span className="flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                          <Briefcase className="w-2.5 h-2.5" />{activeTimer.businessName}
                        </span>
                      )}
                      {activeTimer.taskName ? <span>· Task: {activeTimer.taskName}</span> : activeTimer.workItemTitle ? <span>· {activeTimer.workItemTitle}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold tracking-wider">{elapsedFormatted}</p>
                  <p className="text-xs opacity-60 mt-0.5">elapsed</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm opacity-80 font-medium">Timer</p>
                  <p className="text-base font-semibold opacity-90">No timer running</p>
                </div>
                <motion.button onClick={() => setShowStartTimer(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-semibold transition-colors">
                  <Play className="w-4 h-4" />Start Timer
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* Tabs + Actions */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex">
            {([
              { id: 'time'     as const, label: 'Time Entries', icon: Clock     },
              { id: 'invoices' as const, label: 'Invoices',     icon: FileText  },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx('flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all',
                  activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-text-muted hover:text-text-secondary')}>
                <tab.icon className="w-4 h-4" />{tab.label}
                {tab.id === 'time' && entries.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-bold">{entries.length}</span>
                )}
              </button>
            ))}
          </div>
          {activeTab === 'time' && (
            <motion.button onClick={() => setShowAddEntry(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors mb-1">
              <Plus className="w-4 h-4" />Log Time
            </motion.button>
          )}
        </div>

        {/* Time Entries */}
        {activeTab === 'time' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-border overflow-hidden">
            {entriesLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-primary-400 animate-spin" /></div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="w-10 h-10 text-text-muted/30 mb-3" />
                <p className="text-sm font-medium text-text-muted">No time entries yet</p>
                <p className="text-xs text-text-muted/70 mt-1">Start a timer or log time manually</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[2fr_1.5fr_0.8fr_1.2fr_0.8fr_0.6fr_auto] gap-4 px-5 py-3 bg-surface-hover/50 border-b border-border">
                  {['Staff / Description', 'Client', 'Hours', 'Task / Work Item', 'Date', 'Type', ''].map(h => (
                    <span key={h} className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {entries.map((entry, i) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-[2fr_1.5fr_0.8fr_1.2fr_0.8fr_0.6fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors items-center group">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
                        {(entry.user_name ?? 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{entry.description || '(no description)'}</p>
                        <p className="text-[10px] text-text-muted">{entry.user_name || 'Unknown'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{entry.client_name || '—'}</p>
                    <p className="text-sm font-mono font-semibold text-text-primary">{entry.hours}h</p>
                    <div className="min-w-0">
                      {entry.task_name ? (
                        <div className="flex items-center gap-1">
                          <ListChecks className="w-3 h-3 text-primary-400 flex-shrink-0" />
                          <p className="text-xs text-text-secondary truncate">{entry.task_name}</p>
                        </div>
                      ) : entry.work_item_id ? (
                        <div className="flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-text-muted flex-shrink-0" />
                          <p className="text-xs text-text-muted truncate">Work item</p>
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted">—</p>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      entry.billable ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted')}>
                      {entry.billable ? 'Billable' : 'Internal'}
                    </span>
                    <button onClick={() => deleteEntry(entry.id)}
                      className="p-1 hover:bg-danger/10 rounded opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5 text-danger" />
                    </button>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}

        {/* Invoices */}
        {activeTab === 'invoices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-border overflow-hidden">
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-primary-400 animate-spin" /></div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-text-muted/30 mb-3" />
                <p className="text-sm font-medium text-text-muted">No invoices yet</p>
                <p className="text-xs text-text-muted/70 mt-1">Create invoices from the Clients page</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[0.8fr_2fr_1fr_1fr_1fr_0.8fr_auto] gap-4 px-5 py-3 bg-surface-hover/50 border-b border-border">
                  {['Invoice', 'Client', 'Amount', 'Issued', 'Due', 'Status', ''].map(h => (
                    <span key={h} className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {invoices.map((invoice, i) => (
                  <motion.div key={invoice.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-[0.8fr_2fr_1fr_1fr_1fr_0.8fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors items-center group">
                    <p className="text-sm font-mono font-semibold text-primary-600">{invoice.invoice_number}</p>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {(invoice as Record<string, unknown> & { clients?: { name?: string } }).clients?.name ?? '—'}
                    </p>
                    <p className="text-sm font-bold text-text-primary">${invoice.amount.toLocaleString()}</p>
                    <p className="text-xs text-text-muted">
                      {invoice.issued_date ? new Date(invoice.issued_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                    <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', invoiceStatusColors[invoice.status ?? 'draft'])}>
                      {invoice.status}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {invoice.status !== 'paid' && (
                        <button onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                          className="p-1 hover:bg-success/10 rounded" title="Mark as paid">
                          <CheckCircle className="w-3.5 h-3.5 text-success" />
                        </button>
                      )}
                      <button className="p-1 hover:bg-surface-hover rounded">
                        <MoreHorizontal className="w-3.5 h-3.5 text-text-muted" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
