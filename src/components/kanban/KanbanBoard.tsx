'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DragDropContext, Droppable, Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  Plus, MoreHorizontal, Calendar, LayoutGrid, List, Filter, Search,
  Loader2, X, AlertCircle, CheckCircle2, Circle, Clock, ChevronRight,
  Tag, Trash2, Pencil, Sparkles, Save, ChevronDown, User, DollarSign,
  FileText, Check, RefreshCw, Settings,
} from 'lucide-react';
import clsx from 'clsx';
import { useBoard, type WorkItemCard, type BoardColumn } from '@/lib/hooks/use-board';
import { useKanban } from '@/lib/hooks/use-kanban';
import type { WorkItem, Task } from '@/lib/types/database';
import type { BusinessEntity, EntityType } from '@/lib/types/database';
import { useClients } from '@/lib/hooks/use-clients';
import { useTeamMembers, type Profile } from '@/lib/hooks/use-profile';
import { getDefaultDeadline, ENTITY_TYPE_SHORT } from '@/lib/utils/tax-deadlines';
import { getMatchingTemplates } from '@/lib/templates/staff-templates';
import { useGlobalTags, type GlobalTag } from '@/lib/hooks/use-global-tags';

/* ─────────────────────────────────────────────────────────────────────────────
   Constants / helpers
───────────────────────────────────────────────────────────────────────────── */

const COLUMN_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#64748b',
];

const typeConfig: Record<string, { label: string; color: string }> = {
  'tax-return':   { label: 'Tax Return',   color: 'bg-green-50 text-green-700 border-green-200' },
  'bookkeeping':  { label: 'Bookkeeping',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'payroll':      { label: 'Payroll',      color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'advisory':     { label: 'Advisory',     color: 'bg-pink-50 text-pink-700 border-pink-200' },
  'audit':        { label: 'Audit',        color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'onboarding':   { label: 'Onboarding',   color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

const priorityDot: Record<string, string> = {
  low: 'bg-slate-400', medium: 'bg-blue-500', high: 'bg-amber-500', urgent: 'bg-red-500',
};
const priorityLabel: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
};
const priorityBg: Record<string, string> = {
  low: 'bg-slate-50 text-slate-600', medium: 'bg-blue-50 text-blue-600',
  high: 'bg-amber-50 text-amber-600', urgent: 'bg-red-50 text-red-600',
};

const tagColors = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-green-50 text-green-700 border-green-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-orange-50 text-orange-700 border-orange-200',
];

function tagColor(tag: string, idx: number) {
  if (tag === 'Waiting on Client') return 'bg-amber-50 text-amber-700 border-amber-300';
  if (tag === 'Referral') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (tag === 'Rush' || tag === 'Urgent') return 'bg-red-50 text-red-700 border-red-200';
  if (tag === 'VIP') return 'bg-yellow-50 text-yellow-700 border-yellow-300';
  return tagColors[idx % tagColors.length];
}

/** 16-color preset palette for the tag color picker */
const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#64748b', '#78716c',
];

function hexTagStyle(hex: string): React.CSSProperties {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    backgroundColor: `rgba(${r},${g},${b},0.12)`,
    color: hex,
    borderColor: `rgba(${r},${g},${b},0.35)`,
  };
}

function resolveTag(tag: string, idx: number, globalTags: GlobalTag[]): { className?: string; style?: React.CSSProperties } {
  const gt = globalTags.find(t => t.name === tag);
  if (gt) return { style: hexTagStyle(gt.color) };
  return { className: tagColor(tag, idx) };
}

function formatDate(d?: string | null) {
  if (!d) return null;
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function isOverdue(d?: string | null) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
}
function isDueSoon(d?: string | null) {
  if (!d) return false;
  const diff = new Date(d).getTime() - new Date().getTime();
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Tag Manager Modal
───────────────────────────────────────────────────────────────────────────── */

function TagManagerModal({
  tags, onClose, onCreate, onUpdate, onDelete,
}: {
  tags: GlobalTag[];
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showNewPicker, setShowNewPicker] = useState(false);
  const [showEditPicker, setShowEditPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    await onCreate(newName.trim(), newColor);
    setNewName('');
    setNewColor('#3b82f6');
    setSaving(false);
  }

  function startEdit(tag: GlobalTag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setShowEditPicker(false);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    await onUpdate(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-primary rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary-600" />Manage Labels
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* New tag row */}
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Color swatch */}
            <div className="relative">
              <button
                onClick={() => setShowNewPicker(p => !p)}
                className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-border flex-shrink-0 transition-transform hover:scale-110"
                style={{ backgroundColor: newColor }}
              />
              {showNewPicker && (
                <div className="absolute top-9 left-0 z-10 bg-surface-primary rounded-xl border border-border p-2 shadow-xl grid grid-cols-4 gap-1.5 w-32">
                  {TAG_COLORS.map(c => (
                    <button key={c} onClick={() => { setNewColor(c); setShowNewPicker(false); }}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: c === newColor ? '#fff' : 'transparent', outline: c === newColor ? `2px solid ${c}` : 'none' }}
                    />
                  ))}
                </div>
              )}
            </div>
            <input
              type="text" placeholder="New label name..."
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              className="flex-1 h-8 px-3 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
            <button
              onClick={handleCreate} disabled={!newName.trim() || saving}
              className="h-8 px-3 rounded-lg bg-primary-600 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}Create
            </button>
          </div>
        </div>

        {/* Tag list */}
        <div className="overflow-y-auto flex-1">
          {tags.length === 0 && (
            <p className="text-xs text-text-muted italic text-center py-8">No labels yet — create one above</p>
          )}
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-2.5 px-5 py-2.5 hover:bg-surface-hover group border-b border-border/50 last:border-0">
              {editingId === tag.id ? (
                <>
                  {/* Edit color swatch */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setShowEditPicker(p => !p)}
                      className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-border transition-transform hover:scale-110"
                      style={{ backgroundColor: editColor }}
                    />
                    {showEditPicker && (
                      <div className="absolute top-9 left-0 z-10 bg-surface-primary rounded-xl border border-border p-2 shadow-xl grid grid-cols-4 gap-1.5 w-32">
                        {TAG_COLORS.map(c => (
                          <button key={c} onClick={() => { setEditColor(c); setShowEditPicker(false); }}
                            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                            style={{ backgroundColor: c, borderColor: c === editColor ? '#fff' : 'transparent', outline: c === editColor ? `2px solid ${c}` : 'none' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 h-7 px-2 text-xs bg-white rounded-lg border border-primary-400 focus:outline-none ring-2 ring-primary-500/20"
                  />
                  <button onClick={saveEdit} className="h-7 px-2 rounded-lg bg-primary-600 text-white text-[10px] font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="h-7 px-2 rounded-lg border border-border text-[10px] text-text-secondary">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-1 cursor-default"
                    style={hexTagStyle(tag.color)}
                  >
                    {tag.name}
                  </span>
                  <button
                    onClick={() => startEdit(tag)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all"
                  ><Pencil className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => onDelete(tag.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
                  ><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Card Detail Side Panel
───────────────────────────────────────────────────────────────────────────── */

function CardDetailPanel({
  card, columns, onClose, onUpdate, onCompleteTask, onAddTask, onDeleteTask,
  onMoveColumn, onAddTag, onRemoveTag, onAssignTask, globalTags, onManageTags,
}: {
  card: WorkItemCard;
  columns: BoardColumn[];
  onClose: () => void;
  onUpdate: (updates: Partial<WorkItem>) => Promise<void>;
  onCompleteTask: (taskId: string, completed: boolean, taskStatus?: string) => Promise<void>;
  onAddTask: (title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onMoveColumn: (colId: string) => Promise<void>;
  onAddTag: (tag: string) => Promise<void>;
  onRemoveTag: (tag: string) => Promise<void>;
  onAssignTask: (taskId: string, assigneeId: string | null, assigneeName: string | null) => Promise<void>;
  globalTags: GlobalTag[];
  onManageTags: () => void;
}) {
  const { clients } = useClients();
  const { members } = useTeamMembers();
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    new Set(card.tasks.map(t => t.business_name ?? '__none__'))
  );
  function toggleGroup(key: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const selectedClient = clients.find(c => c.id === card.client_id) ?? null;
  const bizEntities: BusinessEntity[] = (selectedClient?.business_entities as BusinessEntity[] | null) ?? [];
  const entityType: EntityType | null = card.business_name
    ? (bizEntities.find(b => b.name === card.business_name)?.entity_type ?? null)
    : null;

  // Group tasks by business_name (entity). All groups start expanded.
  const taskGroups = (() => {
    const seen = new Map<string | null, Task[]>();
    for (const task of card.tasks) {
      const key = task.business_name ?? null;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(task);
    }
    // Order: entity order from bizEntities, then null group last
    const result: { name: string | null; entityType: EntityType | null; tasks: Task[] }[] = [];
    for (const be of bizEntities) {
      if (seen.has(be.name)) {
        result.push({ name: be.name, entityType: be.entity_type, tasks: seen.get(be.name)! });
        seen.delete(be.name);
      }
    }
    seen.forEach((tasks, name) => result.push({ name, entityType: null, tasks }));
    return result;
  })();

  const completedTasks = card.tasks.filter(t => t.completed).length;
  const totalTasks = card.tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  async function save(field: string, value: string | number | null) {
    setSaving(true);
    try { await onUpdate({ [field]: value }); }
    finally { setSaving(false); setEditing(null); }
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    await onAddTask(newTaskTitle.trim());
    setNewTaskTitle('');
  }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {editing === 'title' ? (
              <input
                autoFocus
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={() => save('title', editVal)}
                onKeyDown={e => { if (e.key === 'Enter') save('title', editVal); if (e.key === 'Escape') setEditing(null); }}
                className="w-full text-base font-bold text-text-primary bg-transparent border-b-2 border-primary-400 focus:outline-none pb-0.5"
              />
            ) : (
              <h2
                className="text-base font-bold text-text-primary cursor-pointer hover:text-primary-600 transition-colors leading-snug"
                onClick={() => { setEditing('title'); setEditVal(card.title); }}
              >
                {card.title}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', typeConfig[card.type]?.color)}>
                {typeConfig[card.type]?.label}
              </span>
              {entityType && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {ENTITY_TYPE_SHORT[entityType]}
                </span>
              )}
              <span className={clsx('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', priorityBg[card.priority])}>
                <div className={clsx('w-1.5 h-1.5 rounded-full', priorityDot[card.priority])} />
                {priorityLabel[card.priority]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {saving && <Loader2 className="w-4 h-4 text-text-muted animate-spin" />}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Move to column */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium w-20 flex-shrink-0">Column</span>
            <div className="relative flex-1">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary-300 text-xs font-medium text-text-primary transition-colors w-full"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: columns.find(c => c.id === card.column_id)?.color ?? '#64748b' }} />
                <span className="flex-1 text-left">{columns.find(c => c.id === card.column_id)?.title ?? 'No column'}</span>
                <ChevronDown className="w-3 h-3 text-text-muted" />
              </button>
              {showMoveMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMoveMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl border border-border shadow-xl overflow-hidden z-20">
                    {columns.map(col => (
                      <button
                        key={col.id}
                        onClick={async () => { setShowMoveMenu(false); await onMoveColumn(col.id); }}
                        className={clsx('w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors', col.id === card.column_id ? 'bg-primary-50 text-primary-700' : 'hover:bg-surface-hover text-text-primary')}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                        {col.title}
                        {col.id === card.column_id && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Client */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium w-20 flex-shrink-0">Client</span>
            <select
              value={card.client_id ?? ''}
              onChange={e => {
                const client = clients.find(c => c.id === e.target.value);
                onUpdate({ client_id: e.target.value || null, client_name: client?.name ?? '' });
              }}
              className="flex-1 h-8 px-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            >
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </div>

          {/* Entity type pills (read-only, derived from client) */}
          {bizEntities.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium w-20 flex-shrink-0">Entities</span>
              <div className="flex flex-wrap gap-1">
                {bizEntities.map(be => (
                  <span key={be.name} className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-surface-hover text-text-secondary border-border">
                    {ENTITY_TYPE_SHORT[be.entity_type]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Due Date (full width — assignee is per-task, not per card) */}
          <div>
            <label className="text-xs text-text-muted font-medium block mb-1">Due Date</label>
            <input
              type="date"
              value={card.due_date ?? ''}
              onChange={e => onUpdate({ due_date: e.target.value || null })}
              className="w-full h-8 px-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
          </div>

          {/* Budget */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium w-20 flex-shrink-0">Budget</span>
            {editing === 'budget' ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  autoFocus type="number" min="0" step="0.01"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={() => save('budget', parseFloat(editVal) || 0)}
                  onKeyDown={e => { if (e.key === 'Enter') save('budget', parseFloat(editVal) || 0); if (e.key === 'Escape') setEditing(null); }}
                  className="flex-1 h-8 px-2 text-xs bg-white rounded-lg border border-primary-400 focus:outline-none ring-2 ring-primary-500/20"
                />
              </div>
            ) : (
              <button
                onClick={() => { setEditing('budget'); setEditVal(String(card.budget ?? 0)); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary-300 text-xs font-medium text-text-primary transition-colors"
              >
                <DollarSign className="w-3 h-3 text-text-muted" />
                {(card.budget ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
              </button>
            )}
            {card.time_spent > 0 && (
              <span className="text-xs text-text-muted">· {card.time_spent}h logged</span>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary">Labels</span>
              <div className="flex items-center gap-1.5">
                <button onClick={onManageTags} className="p-1 rounded hover:bg-surface-hover text-text-muted" title="Manage labels">
                  <Settings className="w-3 h-3" />
                </button>
                <button onClick={() => { setShowTagDropdown(p => !p); setTagSearch(''); }} className="text-[10px] text-primary-600 hover:underline flex items-center gap-0.5">
                  <Plus className="w-3 h-3" />Add
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(card.tags ?? []).map((tag, i) => {
                const { className: tc, style: ts } = resolveTag(tag, i, globalTags);
                return (
                  <span key={tag} className={clsx('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', tc)} style={ts}>
                    {tag}
                    <button onClick={() => onRemoveTag(tag)} className="hover:opacity-60 transition-opacity">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
              {(card.tags ?? []).length === 0 && (
                <span className="text-[11px] text-text-muted italic">No labels</span>
              )}
            </div>
            {/* Tag dropdown */}
            {showTagDropdown && (
              <div ref={tagDropdownRef} className="mt-2 bg-white rounded-xl border border-border shadow-lg overflow-hidden">
                <div className="p-2 border-b border-border">
                  <input
                    autoFocus type="text" placeholder="Search or create label..."
                    value={tagSearch} onChange={e => setTagSearch(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Escape') { setShowTagDropdown(false); return; }
                      if (e.key === 'Enter' && tagSearch.trim()) {
                        await onAddTag(tagSearch.trim());
                        setTagSearch(''); setShowTagDropdown(false);
                      }
                    }}
                    className="w-full h-7 px-2 text-xs bg-surface-hover rounded-lg focus:outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {globalTags
                    .filter(t => !( card.tags ?? []).includes(t.name) && t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={async () => { await onAddTag(t.name); setTagSearch(''); setShowTagDropdown(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover text-left"
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-text-primary">{t.name}</span>
                      </button>
                    ))
                  }
                  {tagSearch.trim() && !globalTags.some(t => t.name.toLowerCase() === tagSearch.trim().toLowerCase()) && (
                    <button
                      onClick={async () => { await onAddTag(tagSearch.trim()); setTagSearch(''); setShowTagDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-hover text-left border-t border-border"
                    >
                      <Plus className="w-3 h-3 text-primary-600 flex-shrink-0" />
                      <span className="text-xs text-primary-600">Create &ldquo;{tagSearch.trim()}&rdquo;</span>
                    </button>
                  )}
                  {globalTags.filter(t => !(card.tags ?? []).includes(t.name) && t.name.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && !tagSearch.trim() && (
                    <p className="text-[11px] text-text-muted italic text-center py-3">No labels available — type to create one</p>
                  )}
                </div>
                <div className="border-t border-border">
                  <button onClick={() => { setShowTagDropdown(false); onManageTags(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:bg-surface-hover">
                    <Settings className="w-3 h-3" />Manage labels
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Notes</span>
            </div>
            {editing === 'description' ? (
              <div className="space-y-2">
                <textarea
                  autoFocus value={editVal} rows={3}
                  onChange={e => setEditVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-primary-400 focus:outline-none ring-2 ring-primary-500/20 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => save('description', editVal)} className="h-7 px-3 rounded-lg bg-primary-600 text-white text-xs font-semibold flex items-center gap-1"><Save className="w-3 h-3" />Save</button>
                  <button onClick={() => setEditing(null)} className="h-7 px-3 rounded-lg border border-border text-xs text-text-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => { setEditing('description'); setEditVal(card.description ?? ''); }}
                className="min-h-[60px] px-3 py-2 text-xs text-text-secondary rounded-xl border border-dashed border-border hover:border-primary-300 hover:bg-primary-50/30 cursor-text transition-colors"
              >
                {card.description ?? <span className="text-text-muted italic">Click to add notes...</span>}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary">Tasks</span>
                {totalTasks > 0 && (
                  <span className="text-[10px] text-text-muted bg-surface-hover px-2 py-0.5 rounded-full font-medium">
                    {completedTasks}/{totalTasks}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-1 text-[10px] text-primary-600 hover:underline"
              >
                <Sparkles className="w-3 h-3" />Apply Template
              </button>
            </div>

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div className="mb-3">
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    className={clsx('h-full rounded-full transition-all duration-500', progressPct === 100 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-primary-400 to-primary-500')}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {taskGroups.map(group => {
                const groupKey = group.name ?? '__none__';
                const isExpanded = expandedGroups.has(groupKey);
                const done = group.tasks.filter(t => t.completed).length;
                const total = group.tasks.length;
                return (
                  <div key={groupKey}>
                    {/* Entity section header — only shown when tasks have a business_name */}
                    {group.name && (
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="flex items-center gap-1.5 w-full py-1 px-1.5 rounded-lg hover:bg-surface-hover mb-0.5 group/gh"
                      >
                        <ChevronRight className={clsx('w-3 h-3 text-text-muted transition-transform flex-shrink-0', isExpanded && 'rotate-90')} />
                        <span className="text-[11px] font-semibold text-text-primary flex-1 text-left truncate">{group.name}</span>
                        {group.entityType && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-surface-hover text-text-secondary border-border flex-shrink-0">
                            {ENTITY_TYPE_SHORT[group.entityType]}
                          </span>
                        )}
                        <span className="text-[10px] text-text-muted flex-shrink-0 ml-1">{done}/{total}</span>
                      </button>
                    )}
                    {/* Task rows */}
                    {isExpanded && (
                      <div className={clsx('space-y-1', group.name && 'pl-3 border-l-2 border-border ml-1.5')}>
                        {group.tasks.map(task => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onComplete={(completed, status) => onCompleteTask(task.id, completed, status)}
                            onDelete={() => onDeleteTask(task.id)}
                            onAssign={(assigneeId, assigneeName) => onAssignTask(task.id, assigneeId, assigneeName)}
                            teamMembers={members}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add task */}
            <div className="flex gap-2 mt-3">
              <input
                ref={taskInputRef}
                type="text"
                placeholder="Add a task..."
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                className="flex-1 h-8 px-3 text-xs bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
              />
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="h-8 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Template Modal */}
        <AnimatePresence>
          {showTemplateModal && (
            <ApplyTemplateModal
              card={card}
              entityType={entityType}
              onClose={() => setShowTemplateModal(false)}
              onApply={async (titles) => {
                for (const t of titles) await onAddTask(t);
                setShowTemplateModal(false);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ─── Task Row ─────────────────────────────────────────────────────────────── */
function TaskRow({ task, onComplete, onDelete, onAssign, teamMembers }: {
  task: Task;
  onComplete: (completed: boolean, status?: string) => void;
  onDelete: () => void;
  onAssign: (assigneeId: string | null, assigneeName: string | null) => void;
  teamMembers: Profile[];
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const isWaiting = task.status === 'waiting-on-client';

  const assignedMember = task.assignee_id
    ? teamMembers.find(m => m.id === task.assignee_id)
    : null;

  return (
    <div className={clsx('group flex items-start gap-2 p-2 rounded-lg transition-colors', isWaiting ? 'bg-amber-50' : 'hover:bg-surface-hover/60')}>
      <button
        onClick={() => onComplete(!task.completed, task.completed ? 'not-started' : 'completed')}
        className="mt-0.5 flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : isWaiting ? (
          <Clock className="w-4 h-4 text-amber-500" />
        ) : (
          <Circle className="w-4 h-4 text-text-muted/40 hover:text-primary-400 transition-colors" />
        )}
      </button>
      <span className={clsx('flex-1 text-xs leading-snug', task.completed ? 'line-through text-text-muted' : isWaiting ? 'text-amber-700' : 'text-text-primary')}>
        {task.title}
        {isWaiting && <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Waiting</span>}
      </span>

      {/* Per-task assignee avatar / picker */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowAssignPicker(!showAssignPicker)}
          title={assignedMember ? `Assigned to ${assignedMember.name}` : 'Assign to…'}
          className={clsx(
            'w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all',
            assignedMember
              ? 'ring-1 ring-white text-white'
              : 'border border-dashed border-text-muted/30 text-text-muted/40 opacity-0 group-hover:opacity-100 hover:border-primary-400 hover:text-primary-400'
          )}
          style={assignedMember ? { backgroundColor: assignedMember.color ?? '#3b82f6' } : undefined}
        >
          {assignedMember
            ? (assignedMember.initials ?? assignedMember.name.split(' ').map(n => n[0]).join('').slice(0, 2))
            : <User className="w-3 h-3" />
          }
        </button>
        {showAssignPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAssignPicker(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-30">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">Assign task to</p>
              {teamMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setShowAssignPicker(false); onAssign(m.id, m.name); }}
                  className={clsx('w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-hover transition-colors', task.assignee_id === m.id ? 'bg-primary-50 text-primary-700' : 'text-text-primary')}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ backgroundColor: m.color ?? '#3b82f6' }}>
                    {m.initials ?? m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  {m.name}
                  {task.assignee_id === m.id && <Check className="w-3 h-3 ml-auto text-primary-500" />}
                </button>
              ))}
              {task.assignee_id && (
                <button
                  onClick={() => { setShowAssignPicker(false); onAssign(null, null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:bg-surface-hover transition-colors border-t border-border"
                >
                  <X className="w-3.5 h-3.5" />Unassign
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setShowMenu(!showMenu)} className="p-0.5 hover:bg-surface-hover rounded">
          <MoreHorizontal className="w-3.5 h-3.5 text-text-muted" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-20">
              {!task.completed && (
                <>
                  <button
                    onClick={() => { setShowMenu(false); onComplete(false, 'waiting-on-client'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />Mark Waiting on Client
                  </button>
                  {isWaiting && (
                    <button
                      onClick={() => { setShowMenu(false); onComplete(false, 'not-started'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />Clear Waiting Status
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => { setShowMenu(false); onDelete(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />Delete Task
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Apply Template Modal ─────────────────────────────────────────────────── */
function ApplyTemplateModal({ card, entityType, onClose, onApply }: {
  card: WorkItemCard;
  entityType: EntityType | null;
  onClose: () => void;
  onApply: (titles: string[]) => Promise<void>;
}) {
  const templates = getMatchingTemplates(card.type, entityType ?? undefined);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0] ?? null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set(templates[0]?.tasks.map(t => t.title) ?? []));
  const [applying, setApplying] = useState(false);

  function toggleTask(title: string) {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }

  const phases = selectedTemplate ? [...new Set(selectedTemplate.tasks.map(t => t.phase))] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Apply Template</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {templates.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTemplate(t); setSelectedTasks(new Set(t.tasks.map(task => task.title))); }}
                  className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-all border', selectedTemplate?.id === t.id ? 'bg-primary-600 text-white border-primary-600' : 'border-border text-text-secondary hover:border-primary-300')}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          {templates.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">No templates available for this work type.</p>
          )}
          {selectedTemplate && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{selectedTasks.size} of {selectedTemplate.tasks.length} selected</span>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedTasks(new Set(selectedTemplate.tasks.map(t => t.title)))} className="text-xs text-primary-600 hover:underline">Select all</button>
                  <button onClick={() => setSelectedTasks(new Set())} className="text-xs text-text-muted hover:underline">Clear</button>
                </div>
              </div>
              {phases.map(phase => (
                <div key={phase}>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{phase}</p>
                  <div className="space-y-1">
                    {selectedTemplate.tasks.filter(t => t.phase === phase).map(task => (
                      <label key={task.title} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-hover/60 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.title)}
                          onChange={() => toggleTask(task.title)}
                          className="mt-0.5 rounded border-border text-primary-600 focus:ring-primary-500/20"
                        />
                        <span className="text-xs text-text-primary leading-snug">{task.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
          <motion.button
            onClick={async () => { if (!selectedTasks.size) return; setApplying(true); await onApply([...selectedTasks]); setApplying(false); }}
            disabled={applying || selectedTasks.size === 0}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" />Add {selectedTasks.size} Tasks</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   New Card Modal
───────────────────────────────────────────────────────────────────────────── */
function NewCardModal({ columns, defaultColumnId, onClose, onSave }: {
  columns: BoardColumn[];
  defaultColumnId?: string;
  onClose: () => void;
  onSave: (columnId: string, input: Partial<WorkItem>) => Promise<void>;
}) {
  const { clients } = useClients();
  const { members } = useTeamMembers();
  const [title, setTitle] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId ?? columns[0]?.id ?? '');
  const [clientId, setClientId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [type, setType] = useState<WorkItem['type']>('tax-return');
  const [priority, setPriority] = useState<WorkItem['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedClient = clients.find(c => c.id === clientId) ?? null;
  const bizEntities: BusinessEntity[] = (selectedClient?.business_entities as BusinessEntity[] | null) ?? [];

  function handleClientChange(cid: string) { setClientId(cid); setBusinessName(''); }
  function handleBusinessChange(name: string) {
    setBusinessName(name);
    if (name && !dueDate) {
      const entity = bizEntities.find(b => b.name === name);
      if (entity && type === 'tax-return') setDueDate(getDefaultDeadline(entity.entity_type));
    }
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!columnId) { setError('Please select a column.'); return; }
    setSaving(true); setError('');
    try {
      await onSave(columnId, {
        title: title.trim(),
        client_id: clientId || null,
        client_name: selectedClient?.name ?? '',
        business_name: businessName || null,
        type, priority,
        due_date: dueDate || null,
        budget: parseFloat(budget) || 0,
      });
      onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create card'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">New Work Item</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Title *</label>
            <input type="text" placeholder="e.g. 2025 Tax Return" value={title} onChange={e => setTitle(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Column</label>
              <select value={columnId} onChange={e => setColumnId(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
                {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Type</label>
              <select value={type} onChange={e => setType(e.target.value as WorkItem['type'])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
                {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Client</label>
            <select value={clientId} onChange={e => handleClientChange(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </div>
          {selectedClient && (selectedClient.businesses ?? []).length > 0 && (
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Business</label>
              <select value={businessName} onChange={e => handleBusinessChange(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
                <option value="">No business</option>
                {selectedClient.businesses.map(b => {
                  const ent = bizEntities.find(be => be.name === b);
                  return <option key={b} value={b}>{b}{ent ? ` (${ENTITY_TYPE_SHORT[ent.entity_type]})` : ''}</option>;
                })}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as WorkItem['priority'])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Budget ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input type="number" placeholder="0.00" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="0.01"
                className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Create</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Add Column Modal
───────────────────────────────────────────────────────────────────────────── */
function AddColumnModal({ onClose, onSave }: { onClose: () => void; onSave: (title: string, color: string) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try { await onSave(title.trim(), color); onClose(); } catch { setSaving(false); }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Add Column</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Column Title</label>
            <input type="text" placeholder="e.g. In Review" value={title} onChange={e => setTitle(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLUMN_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={clsx('w-7 h-7 rounded-full transition-all', color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Add</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Board Card (shown on the kanban column)
───────────────────────────────────────────────────────────────────────────── */
function BoardCard({ card, index, onOpen, onDelete, globalTags }: {
  card: WorkItemCard;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  globalTags: GlobalTag[];
}) {
  const [showMenu, setShowMenu] = useState(false);
  const completedTasks = card.tasks.filter(t => t.completed).length;
  const totalTasks = card.tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : card.progress ?? 0;
  const overdue = isOverdue(card.due_date);
  const dueSoon = isDueSoon(card.due_date);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-2.5">
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            onClick={onOpen}
            className={clsx(
              'bg-white rounded-xl border border-border p-3.5 cursor-pointer transition-all group select-none',
              snapshot.isDragging
                ? 'shadow-2xl shadow-primary-500/15 border-primary-300 rotate-1.5 scale-105'
                : 'hover:shadow-md hover:border-primary-200'
            )}
          >
            {/* Top row: type badge + priority dot + menu */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', typeConfig[card.type]?.color)}>
                  {typeConfig[card.type]?.label}
                </span>
                <div className={clsx('w-1.5 h-1.5 rounded-full', priorityDot[card.priority])} title={priorityLabel[card.priority]} />
              </div>
              <button
                onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-hover transition-all"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-text-muted" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={e => { e.stopPropagation(); setShowMenu(false); }} />
                  <div className="absolute right-0 top-6 w-32 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-30">
                    <button onClick={e => { e.stopPropagation(); setShowMenu(false); onOpen(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-hover">
                      <Pencil className="w-3.5 h-3.5 text-amber-500" />Open
                    </button>
                    <button onClick={e => { e.stopPropagation(); setShowMenu(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Client name */}
            <p className="text-sm font-semibold text-text-primary leading-snug mb-0.5">{card.client_name || 'No client'}</p>
            {card.business_name && (
              <p className="text-[10px] text-text-muted mb-1.5">{card.business_name}</p>
            )}

            {/* Title (work description) */}
            <p className="text-xs text-text-secondary leading-snug mb-2.5">{card.title}</p>

            {/* Tags */}
            {(card.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {(card.tags ?? []).map((tag, i) => {
                  const { className: tc, style: ts } = resolveTag(tag, i, globalTags);
                  return (
                    <span key={tag} className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded-full border', tc)} style={ts}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div className="mb-2.5">
                <div className="h-1 bg-background rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-500', progressPct === 100 ? 'bg-green-500' : 'bg-primary-500')}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer: tasks count + due date */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-border/50">
              {totalTasks > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-text-muted">
                  <div className={clsx('w-3 h-3 rounded border flex items-center justify-center text-[7px]', completedTasks === totalTasks ? 'border-success text-success' : 'border-text-muted/30')}>
                    {completedTasks === totalTasks ? '✓' : ''}
                  </div>
                  {completedTasks}/{totalTasks}
                </div>
              )}
              {card.due_date && (
                <div className={clsx('flex items-center gap-1 text-[10px] font-medium', overdue ? 'text-danger' : dueSoon ? 'text-warning' : 'text-text-muted')}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(card.due_date)}
                  {overdue && <span className="text-[8px] font-bold bg-danger/10 text-danger px-1 rounded">OVERDUE</span>}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   List View Row
───────────────────────────────────────────────────────────────────────────── */
function ListRow({ card, column, onOpen, onDelete, globalTags }: {
  card: WorkItemCard;
  column?: BoardColumn;
  onOpen: () => void;
  onDelete: () => void;
  globalTags: GlobalTag[];
}) {
  const completedTasks = card.tasks.filter(t => t.completed).length;
  const totalTasks = card.tasks.length;
  const overdue = isOverdue(card.due_date);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-border hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer group"
    >
      {column && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-primary truncate">{card.client_name || 'No client'}</span>
          {card.business_name && <span className="text-[10px] text-text-muted">· {card.business_name}</span>}
          <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border', typeConfig[card.type]?.color)}>{typeConfig[card.type]?.label}</span>
        </div>
        <p className="text-xs text-text-muted truncate">{card.title}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {(card.tags ?? []).slice(0, 2).map((tag, i) => {
          const { className: tc, style: ts } = resolveTag(tag, i, globalTags);
          return (
            <span key={tag} className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded-full border hidden md:inline', tc)} style={ts}>{tag}</span>
          );
        })}
        {totalTasks > 0 && (
          <span className="text-[10px] text-text-muted hidden sm:inline">{completedTasks}/{totalTasks} tasks</span>
        )}
        {card.due_date && (
          <span className={clsx('text-[10px] font-medium hidden sm:inline', overdue ? 'text-danger' : 'text-text-muted')}>
            {formatDate(card.due_date)}
          </span>
        )}
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1 rounded hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-3.5 h-3.5 text-text-muted" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setShowMenu(false); }} />
              <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-20">
                <button onClick={e => { e.stopPropagation(); setShowMenu(false); onOpen(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-hover">
                  <Pencil className="w-3.5 h-3.5 text-amber-500" />Open
                </button>
                <button onClick={e => { e.stopPropagation(); setShowMenu(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5">
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main KanbanBoard Component
───────────────────────────────────────────────────────────────────────────── */
export default function KanbanBoard({ boardId }: { boardId?: string }) {
  const {
    columns, loading,
    moveCard, addCard, updateCard, deleteCard,
    addTask, deleteTask, assignTask, completeTask,
    addTag, removeTag,
    addColumn, editColumn, deleteColumn,
  } = useBoard(boardId);

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<WorkItemCard | null>(null);
  const [addCardColumn, setAddCardColumn] = useState<string | undefined>(undefined);
  const [showNewCard, setShowNewCard] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columnMenuId, setColumnMenuId] = useState<string | null>(null);
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WorkItemCard | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);

  const { tags: globalTags, ensureTag, createTag: createGlobalTag, updateTag: updateGlobalTag, deleteTag: deleteGlobalTag } = useGlobalTags();

  // Keep selectedCard in sync with real-time updates
  useEffect(() => {
    if (!selectedCard) return;
    const updated = columns.flatMap(c => c.cards).find(c => c.id === selectedCard.id);
    if (updated) setSelectedCard(updated);
  }, [columns]); // eslint-disable-line

  function openNewCard(columnId?: string) {
    setAddCardColumn(columnId);
    setShowNewCard(true);
  }

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    await moveCard(result.draggableId, destination.droppableId, destination.index);
  }, [moveCard]);

  // Filtered cards
  const allCards = columns.flatMap(c => c.cards);
  const filteredCards = allCards.filter(card => {
    const matchesSearch = !searchQuery || [card.title, card.client_name, card.business_name, ...(card.tags ?? [])].some(s => s?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !filterType || card.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-text-muted">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!boardId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <LayoutGrid className="w-8 h-8 text-primary-500" />
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">No board selected</p>
        <p className="text-xs text-text-muted">Select a season or create a new one above</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence>
        {showNewCard && (
          <NewCardModal
            columns={columns}
            defaultColumnId={addCardColumn}
            onClose={() => setShowNewCard(false)}
            onSave={addCard}
          />
        )}
        {showAddColumn && (
          <AddColumnModal onClose={() => setShowAddColumn(false)} onSave={addColumn} />
        )}
        {selectedCard && (
          <CardDetailPanel
            key={selectedCard.id}
            card={selectedCard}
            columns={columns}
            onClose={() => setSelectedCard(null)}
            onUpdate={updates => updateCard(selectedCard.id, updates)}
            onCompleteTask={(taskId, completed, status) => completeTask(taskId, selectedCard.id, completed, status)}
            onAddTask={title => addTask(selectedCard.id, title)}
            onDeleteTask={taskId => deleteTask(taskId)}
            onMoveColumn={colId => moveCard(selectedCard.id, colId)}
            onAddTag={async tag => { await addTag(selectedCard.id, tag); await ensureTag(tag); }}
            onRemoveTag={tag => removeTag(selectedCard.id, tag)}
            onAssignTask={(taskId, assigneeId, assigneeName) => assignTask(taskId, assigneeName, assigneeId)}
            globalTags={globalTags}
            onManageTags={() => setShowTagManager(true)}
          />
        )}
        {/* TagManagerModal MUST render after CardDetailPanel so it stacks above it (same z-50, later DOM = on top) */}
        {showTagManager && (
          <TagManagerModal
            tags={globalTags}
            onClose={() => setShowTagManager(false)}
            onCreate={async (name, color) => { await createGlobalTag(name, color); }}
            onUpdate={updateGlobalTag}
            onDelete={deleteGlobalTag}
          />
        )}
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-danger" />
                </div>
                <h2 className="text-base font-bold text-text-primary mb-1">Delete this card?</h2>
                <p className="text-sm text-text-muted mb-6"><strong>{deleteTarget.client_name || deleteTarget.title}</strong> and all its tasks will be permanently removed.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover">Cancel</button>
                  <motion.button onClick={async () => { await deleteCard(deleteTarget.id); setDeleteTarget(null); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 h-10 rounded-xl bg-danger hover:bg-red-700 text-white text-sm font-semibold">Delete</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-hover rounded-xl p-1">
            <button onClick={() => setViewMode('board')}
              className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', viewMode === 'board' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary')}>
              <LayoutGrid className="w-3.5 h-3.5" />Board
            </button>
            <button onClick={() => setViewMode('list')}
              className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', viewMode === 'list' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary')}>
              <List className="w-3.5 h-3.5" />List
            </button>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="h-8 px-3 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-text-secondary"
          >
            <option value="">All Types</option>
            {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text" placeholder="Search clients, cards..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-surface-hover rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-52 placeholder:text-text-muted"
            />
          </div>
          <motion.button onClick={() => openNewCard()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Card
          </motion.button>
        </div>
      </div>

      {/* ── Board View ─────────────────────────────────────────────────────────── */}
      {viewMode === 'board' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 -mx-2 px-2 items-start">
            {columns.map((column, colIndex) => {
              const visibleCards = column.cards.filter(card => {
                const matchesSearch = !searchQuery || [card.title, card.client_name, card.business_name, ...(card.tags ?? [])].some(s => s?.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesType = !filterType || card.type === filterType;
                return matchesSearch && matchesType;
              });

              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: colIndex * 0.06 }}
                  className="flex-shrink-0 w-[290px] 2xl:w-[310px]"
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
                      {renamingColumnId === column.id ? (
                        <input
                          autoFocus value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => { if (renameValue.trim()) editColumn(column.id, { title: renameValue.trim() }); setRenamingColumnId(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') { if (renameValue.trim()) editColumn(column.id, { title: renameValue.trim() }); setRenamingColumnId(null); } if (e.key === 'Escape') setRenamingColumnId(null); }}
                          className="text-sm font-semibold text-text-primary bg-white rounded px-1 border border-primary-400 focus:outline-none flex-1 min-w-0"
                        />
                      ) : (
                        <h3 className="text-sm font-semibold text-text-primary truncate">{column.title}</h3>
                      )}
                      <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-full font-medium flex-shrink-0">{visibleCards.length}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openNewCard(column.id)} className="p-1 hover:bg-surface-hover rounded transition-colors">
                        <Plus className="w-3.5 h-3.5 text-text-muted" />
                      </button>
                      <div className="relative">
                        <button onClick={e => { e.stopPropagation(); setColumnMenuId(columnMenuId === column.id ? null : column.id); }} className="p-1 hover:bg-surface-hover rounded transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5 text-text-muted" />
                        </button>
                        {columnMenuId === column.id && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setColumnMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-30">
                              <button onClick={() => { setColumnMenuId(null); setRenamingColumnId(column.id); setRenameValue(column.title); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-hover">
                                <Pencil className="w-3.5 h-3.5 text-amber-500" />Rename
                              </button>
                              <button onClick={() => { setColumnMenuId(null); if (confirm('Delete this column? All cards will be unassigned.')) deleteColumn(column.id); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5">
                                <Trash2 className="w-3.5 h-3.5" />Delete Column
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column body */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={clsx(
                          'min-h-[120px] rounded-xl p-2 transition-colors',
                          snapshot.isDraggingOver ? 'bg-primary-50/50 border-2 border-dashed border-primary-200' : 'bg-background/50'
                        )}
                      >
                        {visibleCards.map((card, idx) => (
                          <BoardCard
                            key={card.id}
                            card={card}
                            index={idx}
                            onOpen={() => setSelectedCard(card)}
                            onDelete={() => setDeleteTarget(card)}
                            globalTags={globalTags}
                          />
                        ))}
                        {provided.placeholder}
                        <motion.button
                          onClick={() => openNewCard(column.id)}
                          whileHover={{ backgroundColor: 'rgba(241,245,249,1)' }}
                          className="w-full py-2 rounded-xl text-xs text-text-muted hover:text-text-secondary flex items-center justify-center gap-1.5 transition-colors border border-dashed border-transparent hover:border-border"
                        >
                          <Plus className="w-3.5 h-3.5" />Add a card
                        </motion.button>
                      </div>
                    )}
                  </Droppable>
                </motion.div>
              );
            })}

            {/* Add Column */}
            <motion.button
              onClick={() => setShowAddColumn(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              className="flex-shrink-0 w-[290px] min-h-[120px] rounded-xl border-2 border-dashed border-border hover:border-primary-300 flex items-center justify-center gap-2 text-text-muted hover:text-primary-600 transition-all bg-white/30 self-start"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Column</span>
            </motion.button>
          </div>
        </DragDropContext>
      )}

      {/* ── List View ──────────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredCards.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-sm">No cards found</div>
          ) : (
            filteredCards.map(card => {
              const col = columns.find(c => c.id === card.column_id);
              return (
                <ListRow
                  key={card.id}
                  card={card}
                  column={col}
                  onOpen={() => setSelectedCard(card)}
                  onDelete={() => setDeleteTarget(card)}
                  globalTags={globalTags}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
