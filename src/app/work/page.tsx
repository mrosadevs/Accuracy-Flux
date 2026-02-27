'use client';

import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useWorkItems, type WorkItemWithTasks } from '@/lib/hooks/use-work-items';
import { useClients } from '@/lib/hooks/use-clients';
import { useGlobalTags } from '@/lib/hooks/use-global-tags';
import { useTeamMembers } from '@/lib/hooks/use-profile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, CheckCircle2, Circle, Clock, AlertTriangle, Play, Pause,
  Calendar, DollarSign, ChevronDown, User, Tag, Loader2, Briefcase,
  CheckSquare, Filter,
} from 'lucide-react';
import clsx from 'clsx';
import type { BusinessEntity, EntityType } from '@/lib/types/database';
import { ENTITY_TYPE_SHORT, getDefaultDeadline } from '@/lib/utils/tax-deadlines';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  'not-started':      { label: 'Not Started',       dot: 'bg-slate-400',    text: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
  'in-progress':      { label: 'In Progress',        dot: 'bg-primary-500',  text: 'text-primary-700', bg: 'bg-primary-50 border-primary-200' },
  'waiting-on-client':{ label: 'Waiting on Client',  dot: 'bg-amber-400',    text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  'in-review':        { label: 'In Review',           dot: 'bg-purple-500',   text: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
  'completed':        { label: 'Completed',           dot: 'bg-green-500',    text: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
};

const ALL_STATUSES = Object.keys(statusConfig);

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d + 'T23:59:59') < new Date();
}

/* ─── Work Item Card ────────────────────────────────────────────────────────── */
function WorkItemCard({
  item,
  bizEntities,
  tagColorMap,
  onClick,
}: {
  item: WorkItemWithTasks;
  bizEntities: BusinessEntity[];
  tagColorMap: Record<string, string>;
  onClick: () => void;
}) {
  const status = statusConfig[item.status] ?? statusConfig['not-started'];
  const completedTasks = item.tasks.filter(t => t.completed).length;
  const totalTasks = item.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdue = isOverdue(item.due_date);
  const timeSpentH = item.time_spent ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-border hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 p-4 cursor-pointer transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-primary truncate">{item.client_name}</p>
          {item.business_name && (
            <p className="text-[11px] text-text-muted truncate">{item.business_name}</p>
          )}
        </div>
        <span className={clsx('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', status.bg, status.text)}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Entity type pills */}
      {bizEntities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {bizEntities.slice(0, 3).map(be => (
            <span key={be.name} className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">
              {ENTITY_TYPE_SHORT[be.entity_type as EntityType] ?? be.entity_type}
            </span>
          ))}
          {bizEntities.length > 3 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-surface-hover text-text-muted border-border">
              +{bizEntities.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-muted">{completedTasks}/{totalTasks} tasks</span>
            <span className="text-[10px] font-semibold text-text-secondary">{progress}%</span>
          </div>
          <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={clsx('h-full rounded-full', progress === 100 ? 'bg-green-500' : 'bg-primary-500')}
            />
          </div>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-text-muted">
        <div className="flex items-center gap-2">
          {/* Due date */}
          {item.due_date && (
            <span className={clsx('flex items-center gap-0.5', overdue && item.status !== 'completed' ? 'text-danger font-semibold' : '')}>
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(item.due_date)}
            </span>
          )}
          {/* Time spent — show "Completed in Xh" when all tasks done */}
          {timeSpentH > 0 && (
            completedTasks > 0 && completedTasks === totalTasks ? (
              <span className="flex items-center gap-0.5 text-green-700 font-semibold">
                <CheckSquare className="w-2.5 h-2.5" />
                {timeSpentH}h total
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {timeSpentH}h
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Fee */}
          {item.budget > 0 && (
            <span className={clsx(
              'flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-full border',
              item.payment_status === 'received'
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            )}>
              ${item.budget.toLocaleString()}
              {item.payment_status === 'received' && <CheckCircle2 className="w-2.5 h-2.5" />}
            </span>
          )}
          {/* Labels */}
          {(item.tags ?? []).slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded-full border text-[9px] font-semibold"
              style={{
                backgroundColor: tagColorMap[tag] ? `${tagColorMap[tag]}20` : undefined,
                borderColor: tagColorMap[tag] ? `${tagColorMap[tag]}60` : undefined,
                color: tagColorMap[tag] ?? '#64748b',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Edit Panel ────────────────────────────────────────────────────────────── */
function WorkItemEditPanel({
  item,
  bizEntities,
  onClose,
  onUpdate,
  onCompleteTask,
}: {
  item: WorkItemWithTasks;
  bizEntities: BusinessEntity[];
  onClose: () => void;
  onUpdate: (updates: Partial<WorkItemWithTasks>) => Promise<void>;
  onCompleteTask: (taskId: string, workItemId: string, completed: boolean) => Promise<void>;
}) {
  const { members } = useTeamMembers();
  const [saving, setSaving] = useState(false);

  async function toggle(field: string, value: unknown) {
    setSaving(true);
    await onUpdate({ [field]: value } as Partial<WorkItemWithTasks>);
    setSaving(false);
  }

  const completedTasks = item.tasks.filter(t => t.completed).length;
  const totalTasks = item.tasks.length;
  const timeSpentH = item.time_spent ?? 0;

  // Group tasks by business_name
  const taskGroups = useMemo(() => {
    if (bizEntities.length === 0) return [{ name: null, entityType: null as EntityType | null, tasks: item.tasks }];
    const byBiz = new Map<string, typeof item.tasks>();
    const unassigned: typeof item.tasks = [];
    for (const t of item.tasks) {
      if (t.business_name) {
        const arr = byBiz.get(t.business_name) ?? [];
        arr.push(t);
        byBiz.set(t.business_name, arr);
      } else { unassigned.push(t); }
    }
    const result: { name: string | null; entityType: EntityType | null; tasks: typeof item.tasks }[] = [];
    for (const be of bizEntities) {
      result.push({ name: be.name, entityType: be.entity_type as EntityType, tasks: byBiz.get(be.name) ?? [] });
    }
    if (unassigned.length > 0) result.push({ name: null, entityType: null, tasks: unassigned });
    return result;
  }, [item.tasks, bizEntities]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary truncate">{item.client_name}</p>
            <p className="text-[11px] text-text-muted">{item.title}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {saving && <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Entity pills */}
          {bizEntities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bizEntities.map(be => {
                const deadline = getDefaultDeadline(be.entity_type as EntityType, 2025);
                return (
                  <div key={be.name} className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-indigo-50 border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-700">{be.name}</span>
                    <span className="text-[9px] text-indigo-500">·</span>
                    <span className="text-[9px] text-indigo-600">{ENTITY_TYPE_SHORT[be.entity_type as EntityType]}</span>
                    <span className="text-[9px] text-indigo-500">·</span>
                    <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                    <span className="text-[9px] text-indigo-600">{formatDate(deadline)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">Status</label>
              <select
                value={item.status}
                onChange={e => toggle('status', e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">Priority</label>
              <select
                value={item.priority}
                onChange={e => toggle('priority', e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due date + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">Due Date</label>
              <input
                type="date"
                value={item.due_date ?? ''}
                onChange={e => toggle('due_date', e.target.value || null)}
                className="w-full h-8 px-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">Assignee</label>
              <select
                value={item.assignee_id ?? ''}
                onChange={e => {
                  const m = members.find(m => m.id === e.target.value);
                  toggle('assignee_id', m?.id ?? null);
                  toggle('assignee', m?.name ?? '');
                }}
                className="w-full h-8 px-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              >
                <option value="">Unassigned</option>
                {members.filter(m => m.role !== 'client').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fee + Payment */}
          <div>
            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">Fee & Payment</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
                <input
                  type="number" min="0" step="1"
                  value={item.budget}
                  onChange={e => toggle('budget', parseFloat(e.target.value) || 0)}
                  className="w-full h-8 pl-6 pr-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
              <button
                onClick={() => {
                  const received = item.payment_status !== 'received';
                  toggle('payment_status', received ? 'received' : 'pending');
                  toggle('payment_received_at', received ? new Date().toISOString() : null);
                }}
                className={clsx(
                  'flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex-shrink-0',
                  item.payment_status === 'received'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {item.payment_status === 'received' ? <><CheckCircle2 className="w-3 h-3" />Received</> : <><Clock className="w-3 h-3" />Pending</>}
              </button>
            </div>
          </div>

          {/* Time spent summary */}
          {timeSpentH > 0 && (
            <div className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs',
              completedTasks > 0 && completedTasks === totalTasks
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-surface-hover text-text-muted'
            )}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {completedTasks > 0 && completedTasks === totalTasks ? (
                <span className="font-semibold">
                  ✓ Completed in {timeSpentH}h
                </span>
              ) : (
                <span><span className="font-semibold text-text-primary">{timeSpentH}h</span> logged so far</span>
              )}
              {item.budget > 0 && (
                <span className="ml-auto font-semibold">
                  ${Math.round(item.budget / timeSpentH)}/hr
                </span>
              )}
            </div>
          )}

          {/* Tasks grouped by entity */}
          {totalTasks > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Tasks</label>
                <span className="text-[10px] text-text-muted bg-surface-hover px-1.5 py-0.5 rounded-full">{completedTasks}/{totalTasks}</span>
              </div>
              <div className="space-y-2">
                {taskGroups.map(group => (
                  <div key={group.name ?? '__none__'} className="rounded-xl border border-border overflow-hidden">
                    {group.name && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover/50 border-b border-border">
                        <span className="text-[10px] font-semibold text-text-primary">{group.name}</span>
                        {group.entityType && (
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded border bg-white text-indigo-700 border-indigo-200">
                            {ENTITY_TYPE_SHORT[group.entityType]}
                          </span>
                        )}
                        {group.entityType && (
                          <span className="text-[9px] text-text-muted ml-auto flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(getDefaultDeadline(group.entityType, 2025))}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="divide-y divide-border">
                      {group.tasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => onCompleteTask(task.id, item.id, !task.completed)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover/50 transition-colors text-left group/task"
                        >
                          {task.completed
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            : <Circle className="w-3.5 h-3.5 text-text-muted flex-shrink-0 group-hover/task:text-primary-400" />
                          }
                          <span className={clsx('text-xs flex-1 truncate', task.completed ? 'line-through text-text-muted' : 'text-text-primary')}>
                            {task.title}
                          </span>
                          {task.assignee && (
                            <span className="text-[9px] text-text-muted flex-shrink-0">{task.assignee.split(' ')[0]}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function WorkItemsPage() {
  const { workItems, loading, updateWorkItem, updateTaskCompletion } = useWorkItems();
  const { clients } = useClients();
  const { tags: globalTags } = useGlobalTags();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState<'' | 'pending' | 'received'>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkItemWithTasks | null>(null);

  // Keep selectedItem in sync with live updates
  useMemo(() => {
    if (!selectedItem) return;
    const updated = workItems.find(w => w.id === selectedItem.id);
    if (updated) setSelectedItem(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItems]);

  const tagColorMap = useMemo(() =>
    Object.fromEntries(globalTags.map(t => [t.name, t.color])),
    [globalTags]
  );

  const clientMap = useMemo(() =>
    new Map(clients.map(c => [c.id, c])),
    [clients]
  );

  const filtered = useMemo(() => {
    return workItems.filter(item => {
      if (search) {
        const q = search.toLowerCase();
        const matches = [item.title, item.client_name, item.business_name, ...(item.tags ?? [])].some(s => s?.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterPayment && (item.payment_status ?? 'pending') !== filterPayment) return false;
      return true;
    });
  }, [workItems, search, filterStatus, filterPayment]);

  const activeFilterCount = (filterStatus ? 1 : 0) + (filterPayment ? 1 : 0);

  // Stats
  const total = workItems.length;
  const inProgress = workItems.filter(w => w.status === 'in-progress').length;
  const waiting = workItems.filter(w => w.status === 'waiting-on-client').length;
  const completed = workItems.filter(w => w.status === 'completed').length;

  return (
    <AppShell title="Work Items" subtitle="Browse and edit all client work items">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',       value: total,       color: 'text-text-primary' },
          { label: 'In Progress', value: inProgress,  color: 'text-primary-600' },
          { label: 'Waiting',     value: waiting,     color: 'text-amber-600' },
          { label: 'Completed',   value: completed,   color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border px-4 py-3">
            <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-[11px] text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search clients, work items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-8 text-xs bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 placeholder:text-text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-surface-hover rounded">
              <X className="w-3.5 h-3.5 text-text-muted" />
            </button>
          )}
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(p => !p)}
            className={clsx(
              'flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-all',
              activeFilterCount > 0
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-border text-text-secondary hover:border-primary-300'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">{activeFilterCount}</span>
            )}
          </button>

          {showFilters && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowFilters(false)} />
              <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl border border-border shadow-xl z-30 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">Filters</span>
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setFilterStatus(''); setFilterPayment(''); }} className="text-[10px] text-primary-600 hover:underline">Clear</button>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Status</p>
                  <div className="space-y-0.5">
                    <button onClick={() => setFilterStatus('')} className={clsx('w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors', !filterStatus ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-surface-hover text-text-secondary')}>All</button>
                    {ALL_STATUSES.map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)} className={clsx('w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-2', filterStatus === s ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-surface-hover text-text-secondary')}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', statusConfig[s].dot)} />
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Payment</p>
                  <div className="flex gap-1.5">
                    {(['', 'pending', 'received'] as const).map(p => (
                      <button key={p} onClick={() => setFilterPayment(p)}
                        className={clsx('flex-1 py-1.5 text-[10px] font-semibold rounded-lg border transition-all',
                          filterPayment === p ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-border text-text-secondary hover:border-primary-200')}>
                        {p === '' ? 'All' : p === 'pending' ? 'Pending' : 'Received'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <span className="text-xs text-text-muted ml-auto">{filtered.length} items</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Briefcase className="w-10 h-10 text-text-muted/30 mb-3" />
          <p className="text-sm font-semibold text-text-primary">No work items found</p>
          <p className="text-xs text-text-muted mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(item => {
              const client = clientMap.get(item.client_id ?? '');
              const bizEntities: BusinessEntity[] = (client?.business_entities as BusinessEntity[] | null) ?? [];
              return (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  bizEntities={bizEntities}
                  tagColorMap={tagColorMap}
                  onClick={() => setSelectedItem(item)}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit panel */}
      <AnimatePresence>
        {selectedItem && (() => {
          const client = clientMap.get(selectedItem.client_id ?? '');
          const bizEntities: BusinessEntity[] = (client?.business_entities as BusinessEntity[] | null) ?? [];
          return (
            <WorkItemEditPanel
              item={selectedItem}
              bizEntities={bizEntities}
              onClose={() => setSelectedItem(null)}
              onUpdate={async updates => { await updateWorkItem(selectedItem.id, updates as Partial<WorkItemWithTasks & Record<string, unknown>>); }}
              onCompleteTask={updateTaskCompletion}
            />
          );
        })()}
      </AnimatePresence>
    </AppShell>
  );
}
