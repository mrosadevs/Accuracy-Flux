'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DragDropContext, Droppable, Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  Plus, MoreHorizontal, MessageSquare, Paperclip,
  Calendar, ChevronDown, LayoutGrid, List, Filter, Search, Loader2, X, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { useKanban, type ColumnWithCards } from '@/lib/hooks/use-kanban';
import type { KanbanCard } from '@/lib/types/database';

/* â”€â”€â”€ Add Card Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AddCardModal({
  columns, defaultColumnId, onClose, onSave,
}: {
  columns: ColumnWithCards[];
  defaultColumnId?: string;
  onClose: () => void;
  onSave: (columnId: string, card: Partial<KanbanCard>) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId ?? columns[0]?.id ?? '');
  const [clientName, setClientName] = useState('');
  const [priority, setPriority] = useState<KanbanCard['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim()) { setError('Card title is required.'); return; }
    if (!columnId) { setError('Please select a column.'); return; }
    setSaving(true); setError('');
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      await onSave(columnId, { title: title.trim(), client_name: clientName.trim() || null, priority, due_date: dueDate || null, assignee: assignee.trim() || null, tags: tagList });
      onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create card'); }
    finally { setSaving(false); }
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
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Add Card</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Card Title *</label>
            <input type="text" placeholder="e.g. Review Q4 financials" value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Column</label>
            <select value={columnId} onChange={e => setColumnId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
              {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as KanbanCard['priority'])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
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
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Client Name</label>
            <input type="text" placeholder="Johnson & Associates" value={clientName} onChange={e => setClientName(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Assignee</label>
            <input type="text" placeholder="Sarah Chen" value={assignee} onChange={e => setAssignee(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tags (comma-separated)</label>
            <input type="text" placeholder="Tax, 2025, Priority" value={tags} onChange={e => setTags(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Add Card</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


/* --- Edit Card Modal --- */
function EditCardModal({ card, columns, onClose, onSave }: { card: KanbanCard; columns: ColumnWithCards[]; onClose: () => void; onSave: (cardId: string, updates: Partial<KanbanCard>) => Promise<void> }) {
  const [title, setTitle] = useState(card.title);
  const [columnId, setColumnId] = useState(card.column_id);
  const [clientName, setClientName] = useState(card.client_name ?? '');
  const [priority, setPriority] = useState<KanbanCard['priority']>(card.priority);
  const [dueDate, setDueDate] = useState(card.due_date ?? '');
  const [assignee, setAssignee] = useState(card.assignee ?? '');
  const [tags, setTags] = useState(card.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      await onSave(card.id, { title: title.trim(), column_id: columnId, client_name: clientName.trim() || null, priority, due_date: dueDate || null, assignee: assignee.trim() || null, tags: tagList });
      onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to update card'); }
    finally { setSaving(false); }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Edit Card</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Card Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Column</label>
            <select value={columnId} onChange={e => setColumnId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
              {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as KanbanCard['priority'])}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Due Date</label>
              <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" /></div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Client Name</label>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Assignee</label>
            <input type="text" value={assignee} onChange={e => setAssignee(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tags (comma-separated)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
/* --- Delete Card Modal --- */
function DeleteCardModal({ card, onClose, onDelete }: { card: KanbanCard; onClose: () => void; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    try { await onDelete(card.id); onClose(); } catch { setDeleting(false); }
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <h2 className="text-base font-bold text-text-primary mb-1">Delete Card?</h2>
          <p className="text-sm text-text-muted mb-6">This will permanently delete <strong>{card.title}</strong>.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleDelete} disabled={deleting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-danger hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Card'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
const COLUMN_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#64748b',
];

/* --- Add Column Modal --- */
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Column Title</label>
            <input type="text" placeholder="e.g. In Review" value={title} onChange={e => setTitle(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLUMN_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={clsx('w-7 h-7 rounded-full transition-all', color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Add Column</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
const priorityColors = {
  low: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  high: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  urgent: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
};

const tagColors = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-green-50 text-green-700 border-green-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

function KanbanCardComponent({ card, index, onEdit, onDelete }: { card: KanbanCard; index: number; onEdit: () => void; onDelete: () => void }) {
  const priority = priorityColors[card.priority];
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-2">
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ y: -2 }}
            className={clsx(
              'bg-white rounded-xl border border-border p-3.5 cursor-grab active:cursor-grabbing transition-all group',
              snapshot.isDragging && 'shadow-xl shadow-primary-500/10 border-primary-300 rotate-2 scale-105'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={clsx('flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold', priority.bg, priority.text)}>
                  <div className={clsx('w-1.5 h-1.5 rounded-full', priority.dot)} />
                  {card.priority}
                </div>
                {card.due_date && (
                  <div className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Calendar className="w-3 h-3" />
                    {new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-surface-hover rounded">
                  <MoreHorizontal className="w-3.5 h-3.5 text-text-muted" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-30">
                      <button onClick={() => { setShowMenu(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-hover transition-colors">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button onClick={() => { setShowMenu(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-text-primary leading-snug mb-2">{card.title}</h4>

            {/* Client */}
            {card.client_name && (
              <p className="text-xs text-text-muted mb-2.5">{card.client_name}</p>
            )}

            {/* Progress Bar */}
            {card.progress > 0 && (
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-text-muted font-medium">Progress</span>
                  <span className="text-[10px] font-bold text-text-primary">{card.progress}%</span>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${card.progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={clsx(
                      'h-full rounded-full',
                      card.progress === 100
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : card.progress > 60
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                          : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    )}
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {card.tags.map((tag, i) => (
                  <span key={tag} className={clsx('text-[9px] font-semibold px-1.5 py-0.5 rounded-md border', tagColors[i % tagColors.length])}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border-light">
              <div className="flex items-center gap-3">
                {card.subtasks_total > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-text-muted">
                    <div className="w-3 h-3 rounded border border-text-muted/30 flex items-center justify-center">
                      <span className="text-[7px]">&#10003;</span>
                    </div>
                    {card.subtasks_completed}/{card.subtasks_total}
                  </div>
                )}
                {card.comments_count > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-text-muted">
                    <MessageSquare className="w-3 h-3" />
                    {card.comments_count}
                  </div>
                )}
                {card.attachments_count > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Paperclip className="w-3 h-3" />
                    {card.attachments_count}
                  </div>
                )}
              </div>
              {card.assignee && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-white">
                  {card.assignee.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({ boardId }: { boardId?: string }) {
  const { columns, loading, moveCard, addCard, editCard, deleteCard, addColumn, editColumn, deleteColumn } = useKanban(boardId);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [addCardColumn, setAddCardColumn] = useState<string | undefined>(undefined);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editCardTarget, setEditCardTarget] = useState<KanbanCard | null>(null);
  const [deleteCardTarget, setDeleteCardTarget] = useState<KanbanCard | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columnMenuId, setColumnMenuId] = useState<string | null>(null);
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  function openAddCard(columnId?: string) {
    setAddCardColumn(columnId);
    setShowAddCard(true);
  }

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    await moveCard(result.draggableId, destination.droppableId, destination.index);
  }, [moveCard]);

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

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence>
        {showAddCard && (
          <AddCardModal
            columns={columns}
            defaultColumnId={addCardColumn}
            onClose={() => setShowAddCard(false)}
            onSave={addCard}
          />
        )}
        {editCardTarget && (
          <EditCardModal card={editCardTarget} columns={columns} onClose={() => setEditCardTarget(null)} onSave={editCard} />
        )}
        {deleteCardTarget && (
          <DeleteCardModal card={deleteCardTarget} onClose={() => setDeleteCardTarget(null)} onDelete={deleteCard} />
        )}
        {showAddColumn && (
          <AddColumnModal onClose={() => setShowAddColumn(false)} onSave={async (title, color) => { await addColumn(title, color); }} />
        )}
      </AnimatePresence>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-hover rounded-xl p-1">
            <button
              onClick={() => setViewMode('board')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === 'board' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === 'list' ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors border border-border">
            <Filter className="w-3.5 h-3.5" />
            Filter
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-surface-hover rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-48 placeholder:text-text-muted"
            />
          </div>
          <motion.button
            onClick={() => openAddCard()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Card
          </motion.button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 -mx-2 px-2">
          {(columns as ColumnWithCards[]).map((column, colIndex) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: colIndex * 0.08 }}
              className="flex-shrink-0 w-[300px] 2xl:w-[320px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                  {renamingColumnId === column.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => { if (renameValue.trim()) editColumn(column.id, { title: renameValue.trim() }); setRenamingColumnId(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { if (renameValue.trim()) editColumn(column.id, { title: renameValue.trim() }); setRenamingColumnId(null); } if (e.key === 'Escape') setRenamingColumnId(null); }}
                      className="text-sm font-semibold text-text-primary bg-white rounded px-1 border border-primary-400 focus:outline-none w-full"
                    />
                  ) : (
                    <h3 className="text-sm font-semibold text-text-primary">{column.title}</h3>
                  )}
                  <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-full font-medium">
                    {column.items.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openAddCard(column.id)} className="p-1 hover:bg-surface-hover rounded transition-colors">
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
                          <button onClick={() => { setColumnMenuId(null); setRenamingColumnId(column.id); setRenameValue(column.title); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-hover transition-colors">
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Rename
                          </button>
                          <button onClick={() => { setColumnMenuId(null); if (confirm("Delete this column and all its cards?")) deleteColumn(column.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      'min-h-[200px] rounded-xl p-2 transition-colors',
                      snapshot.isDraggingOver ? 'bg-primary-50/50 border-2 border-dashed border-primary-200' : 'bg-background/50'
                    )}
                  >
                    {(searchQuery
                        ? column.items.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.client_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.assignee ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
                        : column.items
                      ).map((card, index) => (
                      <KanbanCardComponent key={card.id} card={card} index={index} onEdit={() => setEditCardTarget(card)} onDelete={() => setDeleteCardTarget(card)} />
                    ))}
                    {provided.placeholder}

                    <motion.button
                      onClick={() => openAddCard(column.id)}
                      whileHover={{ backgroundColor: 'rgba(241, 245, 249, 1)' }}
                      className="w-full py-2 rounded-xl text-xs text-text-muted hover:text-text-secondary flex items-center justify-center gap-1.5 transition-colors border border-dashed border-transparent hover:border-border"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add a card
                    </motion.button>
                  </div>
                )}
              </Droppable>
            </motion.div>
          ))}

          {/* Add Column */}
          <motion.button
            onClick={() => setShowAddColumn(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="flex-shrink-0 w-[300px] min-h-[200px] rounded-xl border-2 border-dashed border-border hover:border-primary-300 flex items-center justify-center gap-2 text-text-muted hover:text-primary-600 transition-all bg-white/30"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Column</span>
          </motion.button>
        </div>
      </DragDropContext>
    </div>
  );
}

