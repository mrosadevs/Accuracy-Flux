'use client';

import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useWorkItems, type WorkItemWithTasks } from '@/lib/hooks/use-work-items';
import { useClients } from '@/lib/hooks/use-clients';
import { useGlobalTags } from '@/lib/hooks/use-global-tags';
import { useTeamMembers } from '@/lib/hooks/use-profile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, CheckCircle2, Circle, Clock, Calendar, DollarSign,
  Loader2, Briefcase, CheckSquare, Filter, Building2, User,
} from 'lucide-react';
import clsx from 'clsx';
import type { BusinessEntity, EntityType, Task } from '@/lib/types/database';
import { ENTITY_TYPE_SHORT, getDefaultDeadline } from '@/lib/utils/tax-deadlines';

/* ─── types ─────────────────────────────────────────────────────────────────── */
interface EntityCard {
  workItem: WorkItemWithTasks;
  entityName: string | null;     // null = no entities → show as individual
  entityType: EntityType | null;
  deadline: string | null;
  tasks: Task[];                 // tasks belonging to this entity only
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  'not-started':       { label: 'Not Started',      dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
  'in-progress':       { label: 'In Progress',       dot: 'bg-primary-500', text: 'text-primary-700', bg: 'bg-primary-50 border-primary-200' },
  'waiting-on-client': { label: 'Waiting on Client', dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  'in-review':         { label: 'In Review',          dot: 'bg-purple-500',  text: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
  'completed':         { label: 'Completed',          dot: 'bg-green-500',   text: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
};

const ALL_STATUSES = Object.keys(statusConfig);

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  // Handles both YYYY-MM-DD and full ISO strings
  const dateStr = d.length === 10 ? d : d.split('T')[0];
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(d: string | null | undefined) {
  if (!d) return false;
  const dateStr = d.length === 10 ? d : d.split('T')[0];
  return new Date(dateStr + 'T23:59:59') < new Date();
}

/* ─── Entity Card component ─────────────────────────────────────────────────── */
function EntityCardView({
  card,
  tagColorMap,
  onClick,
  index,
}: {
  card: EntityCard;
  tagColorMap: Record<string, string>;
  onClick: () => void;
  index: number;
}) {
  const { workItem, entityName, entityType, deadline, tasks } = card;
  const status = statusConfig[workItem.status] ?? statusConfig['not-started'];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdue = isOverdue(deadline);
  const timeSpentH = workItem.time_spent ?? 0;
  // Proportional time for this entity
  const totalAllTasks = workItem.tasks.length;
  const entityTimeH = totalAllTasks > 0 && timeSpentH > 0
    ? Math.round((tasks.length / totalAllTasks) * timeSpentH * 10) / 10
    : 0;

  const displayName = entityName ?? workItem.client_name;
  const subtitle = entityName ? workItem.client_name : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-border hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 p-4 cursor-pointer transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {entityName ? (
              <Building2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
            ) : (
              <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
            )}
            <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
          </div>
          {subtitle && (
            <p className="text-[11px] text-text-muted truncate pl-4">{subtitle}</p>
          )}
        </div>
        <span className={clsx('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', status.bg, status.text)}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Entity type + deadline */}
      {entityType && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">
            {ENTITY_TYPE_SHORT[entityType] ?? entityType}
          </span>
          {deadline && (
            <span className={clsx('flex items-center gap-0.5 text-[10px]', overdue && workItem.status !== 'completed' ? 'text-danger font-semibold' : 'text-text-muted')}>
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(deadline)}
            </span>
          )}
        </div>
      )}

      {/* Task progress */}
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

      {/* No tasks yet */}
      {totalTasks === 0 && (
        <p className="text-[10px] text-text-muted/60 mb-3 italic">No tasks yet</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 text-[10px] text-text-muted">
        <div className="flex items-center gap-2">
          {/* Due date (individual cards use item.due_date) */}
          {!entityType && workItem.due_date && (
            <span className={clsx('flex items-center gap-0.5', isOverdue(workItem.due_date) && workItem.status !== 'completed' ? 'text-danger font-semibold' : '')}>
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(workItem.due_date)}
            </span>
          )}
          {/* Time spent */}
          {entityTimeH > 0 && (
            completedTasks > 0 && completedTasks === totalTasks ? (
              <span className="flex items-center gap-0.5 text-green-700 font-semibold">
                <CheckSquare className="w-2.5 h-2.5" />
                {entityTimeH}h total
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {entityTimeH}h
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Fee */}
          {workItem.budget > 0 && (
            <span className={clsx(
              'flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-full border',
              workItem.payment_status === 'received'
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            )}>
              ${workItem.budget.toLocaleString()}
              {workItem.payment_status === 'received' && <CheckCircle2 className="w-2.5 h-2.5" />}
            </span>
          )}
          {/* Tags */}
          {(workItem.tags ?? []).slice(0, 2).map(tag => (
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
  focusEntityName,
  onClose,
  onUpdate,
  onCompleteTask,
}: {
  item: WorkItemWithTasks;
  bizEntities: BusinessEntity[];
  focusEntityName: string | null;
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

  // Group tasks by business_name, focusEntityName group first
  const taskGroups = useMemo(() => {
    if (bizEntities.length === 0) {
      return [{ name: null as string | null, entityType: null as EntityType | null, tasks: item.tasks }];
    }
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

    // Put focusEntity first
    const orderedEntities = focusEntityName
      ? [
          ...bizEntities.filter(be => be.name === focusEntityName),
          ...bizEntities.filter(be => be.name !== focusEntityName),
        ]
      : bizEntities;

    for (const be of orderedEntities) {
      result.push({ name: be.name, entityType: be.entity_type as EntityType, tasks: byBiz.get(be.name) ?? [] });
    }
    if (unassigned.length > 0) result.push({ name: null, entityType: null, tasks: unassigned });
    return result;
  }, [item.tasks, bizEntities, focusEntityName]);

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
            {focusEntityName && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-indigo-400" />
                <p className="text-[11px] text-indigo-600 font-medium">{focusEntityName}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {saving && <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
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
                {item.payment_status === 'received'
                  ? <><CheckCircle2 className="w-3 h-3" />Received</>
                  : <><Clock className="w-3 h-3" />Pending</>
                }
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
                <span className="font-semibold">✓ Completed in {timeSpentH}h</span>
              ) : (
                <span><span className="font-semibold text-text-primary">{timeSpentH}h</span> logged so far</span>
              )}
              {item.budget > 0 && timeSpentH > 0 && (
                <span className="ml-auto font-semibold">${Math.round(item.budget / timeSpentH)}/hr</span>
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
                  <div
                    key={group.name ?? '__none__'}
                    className={clsx(
                      'rounded-xl border overflow-hidden',
                      group.name === focusEntityName
                        ? 'border-indigo-300 ring-1 ring-indigo-200'
                        : 'border-border'
                    )}
                  >
                    {group.name && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover/50 border-b border-border">
                        <Building2 className="w-3 h-3 text-indigo-400" />
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
                      {group.tasks.length === 0 ? (
                        <p className="px-3 py-2 text-[10px] text-text-muted/60 italic">No tasks for this entity</p>
                      ) : (
                        group.tasks.map(task => (
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
                        ))
                      )}
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

  // Selected: { workItem, focusEntityName }
  const [selected, setSelected] = useState<{ workItem: WorkItemWithTasks; focusEntityName: string | null } | null>(null);

  // Tag colour map
  const tagColorMap = useMemo(() =>
    Object.fromEntries(globalTags.map(t => [t.name, t.color])),
    [globalTags]
  );

  // Client lookup
  const clientMap = useMemo(() =>
    new Map(clients.map(c => [c.id, c])),
    [clients]
  );

  // Keep selectedItem in sync with live work-item updates
  useMemo(() => {
    if (!selected) return;
    const updated = workItems.find(w => w.id === selected.workItem.id);
    if (updated) setSelected(prev => prev ? { ...prev, workItem: updated } : null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItems]);

  // ── Build flat entity-card list ───────────────────────────────────────────
  const entityCards = useMemo((): EntityCard[] => {
    const cards: EntityCard[] = [];

    for (const item of workItems) {
      const client = clientMap.get(item.client_id ?? '');
      const bizEntities: BusinessEntity[] = (client?.business_entities as BusinessEntity[] | null) ?? [];

      if (bizEntities.length === 0) {
        // Individual / no entities → one card for the whole work item
        cards.push({
          workItem: item,
          entityName: null,
          entityType: null,
          deadline: item.due_date,
          tasks: item.tasks,
        });
      } else {
        // One card per business entity
        for (const be of bizEntities) {
          const entityTasks = item.tasks.filter(t => t.business_name === be.name);
          cards.push({
            workItem: item,
            entityName: be.name,
            entityType: be.entity_type as EntityType,
            deadline: getDefaultDeadline(be.entity_type as EntityType, 2025) ?? item.due_date,
            tasks: entityTasks,
          });
        }
      }
    }

    return cards;
  }, [workItems, clientMap]);

  // ── Filter entity cards ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return entityCards.filter(card => {
      if (search) {
        const q = search.toLowerCase();
        const matches = [
          card.entityName,
          card.workItem.client_name,
          card.workItem.business_name,
          ...(card.workItem.tags ?? []),
        ].some(s => s?.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filterStatus && card.workItem.status !== filterStatus) return false;
      if (filterPayment && (card.workItem.payment_status ?? 'pending') !== filterPayment) return false;
      return true;
    });
  }, [entityCards, search, filterStatus, filterPayment]);

  const activeFilterCount = (filterStatus ? 1 : 0) + (filterPayment ? 1 : 0);

  // Stats (based on entity cards)
  const total = entityCards.length;
  const inProgress = entityCards.filter(c => c.workItem.status === 'in-progress').length;
  const waiting = entityCards.filter(c => c.workItem.status === 'waiting-on-client').length;
  const completedCount = entityCards.filter(c => c.workItem.status === 'completed').length;

  return (
    <AppShell title="Work Items" subtitle="One card per company — synced with the board">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',       value: total,          color: 'text-text-primary' },
          { label: 'In Progress', value: inProgress,     color: 'text-primary-600' },
          { label: 'Waiting',     value: waiting,        color: 'text-amber-600' },
          { label: 'Completed',   value: completedCount, color: 'text-green-600' },
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
            placeholder="Search companies, clients..."
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

        <span className="text-xs text-text-muted ml-auto">{filtered.length} companies</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Briefcase className="w-10 h-10 text-text-muted/30 mb-3" />
          <p className="text-sm font-semibold text-text-primary">No companies found</p>
          <p className="text-xs text-text-muted mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((card, i) => (
              <EntityCardView
                key={`${card.workItem.id}__${card.entityName ?? 'individual'}`}
                card={card}
                tagColorMap={tagColorMap}
                index={i}
                onClick={() => setSelected({ workItem: card.workItem, focusEntityName: card.entityName })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit panel */}
      <AnimatePresence>
        {selected && (() => {
          const client = clientMap.get(selected.workItem.client_id ?? '');
          const bizEntities: BusinessEntity[] = (client?.business_entities as BusinessEntity[] | null) ?? [];
          return (
            <WorkItemEditPanel
              item={selected.workItem}
              bizEntities={bizEntities}
              focusEntityName={selected.focusEntityName}
              onClose={() => setSelected(null)}
              onUpdate={async updates => {
                await updateWorkItem(selected.workItem.id, updates as Partial<WorkItemWithTasks & Record<string, unknown>>);
              }}
              onCompleteTask={updateTaskCompletion}
            />
          );
        })()}
      </AnimatePresence>
    </AppShell>
  );
}
