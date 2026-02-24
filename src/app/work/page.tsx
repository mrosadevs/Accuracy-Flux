'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkItems } from '@/lib/hooks/use-work-items';
import {
  Search, Filter, Plus, MoreHorizontal, ChevronDown, ChevronRight,
  Calendar, Clock, CheckCircle2, X, AlertCircle, Loader2 as Loader,
  Pause, Play, Eye, ArrowUpDown, Loader2, DollarSign
} from 'lucide-react';
import clsx from 'clsx';
import type { WorkItem } from '@/lib/types/database';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'not-started': { label: 'Not Started', color: 'text-text-muted', bg: 'bg-text-muted/10', icon: Pause },
  'in-progress': { label: 'In Progress', color: 'text-primary-600', bg: 'bg-primary-50', icon: Play },
  'waiting-on-client': { label: 'Waiting', color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
  'in-review': { label: 'In Review', color: 'text-accent-600', bg: 'bg-accent-400/10', icon: Eye },
  'completed': { label: 'Completed', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-700' },
  high: { label: 'High', color: 'bg-amber-50 text-amber-700' },
  urgent: { label: 'Urgent', color: 'bg-red-50 text-red-700' },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  'tax-return': { label: 'Tax Return', color: 'bg-green-50 text-green-700 border-green-200' },
  'bookkeeping': { label: 'Bookkeeping', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'payroll': { label: 'Payroll', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'advisory': { label: 'Advisory', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  'audit': { label: 'Audit', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'onboarding': { label: 'Onboarding', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

/* ─── New Work Item Modal ───────────────────────────────────────────── */
function NewWorkItemModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Partial<WorkItem>) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [type, setType] = useState<WorkItem['type']>('tax-return');
  const [priority, setPriority] = useState<WorkItem['priority']>('medium');
  const [status, setStatus] = useState<WorkItem['status']>('not-started');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ title: title.trim(), client_name: clientName.trim(), type, priority, status, assignee: assignee.trim(), due_date: dueDate || null, start_date: startDate || null, budget: parseFloat(budget) || 0 });
      onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create work item'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">New Work Item</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Title *</label>
            <input type="text" placeholder="e.g. 2025 Annual Tax Return" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Client Name</label>
            <input type="text" placeholder="Johnson & Associates LLC" value={clientName} onChange={e => setClientName(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Type</label>
              <select value={type} onChange={e => setType(e.target.value as WorkItem['type'])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="tax-return">Tax Return</option>
                <option value="bookkeeping">Bookkeeping</option>
                <option value="payroll">Payroll</option>
                <option value="advisory">Advisory</option>
                <option value="audit">Audit</option>
                <option value="onboarding">Onboarding</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as WorkItem['priority'])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as WorkItem['status'])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="waiting-on-client">Waiting on Client</option>
                <option value="in-review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Assignee</label>
              <input type="text" placeholder="Sarah Chen" value={assignee} onChange={e => setAssignee(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
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
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Budget ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input type="number" placeholder="0.00" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="0.01"
                className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Create</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function WorkPage() {
  const { workItems, loading, updateTaskCompletion, addWorkItem } = useWorkItems();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewItem, setShowNewItem] = useState(false);

  const filteredItems = workItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell title="Work" subtitle={`${workItems.length} active work items`}>
      <AnimatePresence>
        {showNewItem && <NewWorkItemModal onClose={() => setShowNewItem(false)} onSave={addWorkItem} />}
      </AnimatePresence>
      <div className="max-w-[1800px] mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search work items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 w-64 placeholder:text-text-muted transition-all"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors border border-border">
              <Filter className="w-3.5 h-3.5" />
              Filter
              <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors border border-border">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort
            </button>
          </div>
          <motion.button
            onClick={() => setShowNewItem(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Work Item
          </motion.button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm text-text-muted">Loading work items...</p>
            </div>
          </div>
        )}

        {/* Work Items List */}
        <div className="space-y-3">
          {filteredItems.map((item, i) => {
            const status = statusConfig[item.status];
            const priority = priorityConfig[item.priority];
            const type = typeConfig[item.type];
            const isExpanded = expandedItem === item.id;
            const completedTasks = item.tasks.filter(t => t.completed).length;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
                className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md hover:shadow-primary-500/5 transition-all"
              >
                {/* Main Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  {/* Expand Arrow */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-5 h-5 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </motion.div>

                  {/* Progress Ring */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#f1f5f9" strokeWidth="3"
                      />
                      <motion.path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={item.progress === 100 ? '#10b981' : '#3b82f6'}
                        strokeWidth="3" strokeLinecap="round"
                        initial={{ strokeDasharray: '0, 100' }}
                        animate={{ strokeDasharray: `${item.progress}, 100` }}
                        transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary">
                      {item.progress}%
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{item.title}</h3>
                      <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-full border', type.color)}>
                        {type.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">{item.client_name}</span>
                      <span className="text-xs text-text-muted">&middot;</span>
                      <span className="text-xs text-text-muted">{completedTasks}/{item.tasks.length} tasks</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3">
                    <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', priority.color)}>
                      {priority.label}
                    </span>
                    <div className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium', status.bg, status.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.due_date ? new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[9px] font-bold text-white">
                      {item.assignee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button className="p-1 hover:bg-surface-hover rounded" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                </div>

                {/* Expanded Task List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border-light">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {/* Tasks */}
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Tasks</h4>
                            <div className="space-y-2">
                              {item.tasks.map((task, ti) => (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: ti * 0.05 }}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                                  onClick={() => updateTaskCompletion(task.id, item.id, !task.completed)}
                                >
                                  <div className={clsx(
                                    'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                    task.completed
                                      ? 'bg-success border-success'
                                      : 'border-border hover:border-primary-400'
                                  )}>
                                    {task.completed && (
                                      <motion.svg
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        className="w-3 h-3 text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                      >
                                        <motion.path d="M20 6L9 17l-5-5" />
                                      </motion.svg>
                                    )}
                                  </div>
                                  <span className={clsx(
                                    'text-sm flex-1',
                                    task.completed ? 'text-text-muted line-through' : 'text-text-primary'
                                  )}>
                                    {task.title}
                                  </span>
                                  {task.assignee && (
                                    <span className="text-[10px] text-text-muted bg-surface-hover px-2 py-0.5 rounded-full">
                                      {task.assignee}
                                    </span>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Details */}
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Details</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between py-2 border-b border-border-light">
                                <span className="text-xs text-text-muted">Budget</span>
                                <span className="text-sm font-semibold text-text-primary">${item.budget.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-border-light">
                                <span className="text-xs text-text-muted">Time Spent</span>
                                <span className="text-sm font-semibold text-text-primary">{item.time_spent}h</span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-border-light">
                                <span className="text-xs text-text-muted">Start Date</span>
                                <span className="text-sm text-text-primary">{item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'}</span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-border-light">
                                <span className="text-xs text-text-muted">Due Date</span>
                                <span className="text-sm font-semibold text-text-primary">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <span className="text-xs text-text-muted">Assignee</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[8px] font-bold text-white">
                                    {item.assignee.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span className="text-sm text-text-primary">{item.assignee}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
