'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Star, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useKanbanBoards } from '@/lib/hooks/use-kanban-boards';
import type { KanbanBoard as KanbanBoardType } from '@/lib/types/database';

function CreateBoardModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, year: number | null) => Promise<KanbanBoardType | undefined> }) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!title.trim()) { setError('Board name is required.'); return; }
    setSaving(true); setError('');
    try {
      await onCreate(title.trim(), year ? parseInt(year) : null);
      onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create board'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-sm font-bold text-text-primary">Create New Board</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Board Name *</label>
            <input type="text" placeholder="e.g. 2027 Tax Season" value={title} onChange={e => setTitle(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tax Year (optional)</label>
            <input type="number" placeholder="e.g. 2027" value={year} onChange={e => setYear(e.target.value)} min="2000" max="2099"
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleCreate} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-3.5 h-3.5" />Create</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function KanbanPage() {
  const { boards, loading, createBoard, deleteBoard, toggleStarred } = useKanbanBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  // Auto-select first board when boards load
  const selectedBoard = boards.find(b => b.id === selectedBoardId) ?? boards[0] ?? null;

  if (loading) {
    return (
      <AppShell title="Board" subtitle="Drag and drop to manage your workflow">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Board" subtitle="Drag and drop to manage your workflow">
      <AnimatePresence>
        {showCreateBoard && (
          <CreateBoardModal
            onClose={() => setShowCreateBoard(false)}
            onCreate={async (title, year) => {
              const board = await createBoard(title, year);
              if (board) setSelectedBoardId(board.id);
              return board;
            }}
          />
        )}
      </AnimatePresence>

      <div className="h-full flex flex-col">
        {/* Board Selector */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div className="relative">
            <motion.button
              onClick={() => setShowBoardPicker(!showBoardPicker)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary-300 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="text-sm font-semibold text-text-primary">{selectedBoard?.title ?? 'Select Board'}</span>
              {selectedBoard?.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            </motion.button>

            <AnimatePresence>
              {showBoardPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-72 bg-surface rounded-xl border border-border shadow-xl overflow-hidden z-30"
                >
                  <div className="p-2">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 py-1.5">Your Boards</p>
                    {boards.map((board, i) => (
                      <motion.div
                        key={board.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group/board',
                          selectedBoard?.id === board.id ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-surface-hover'
                        )}
                      >
                        <button
                          onClick={() => { setSelectedBoardId(board.id); setShowBoardPicker(false); }}
                          className="flex-1 text-left flex items-center gap-2"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text-primary">{board.title}</p>
                            <p className="text-[10px] text-text-muted">{board.year ? `Tax Year ${board.year}` : 'Ongoing'}</p>
                          </div>
                          {board.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover/board:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); toggleStarred(board.id); }}
                            className={clsx('p-1 rounded transition-colors', board.starred ? 'text-warning hover:text-warning/70' : 'text-text-muted hover:text-warning')}
                            title={board.starred ? 'Unstar' : 'Star'}
                          >
                            <Star className={clsx('w-3 h-3', board.starred && 'fill-warning')} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm(`Delete \"${board.title}\"? This will also delete all its columns and cards.`)) {
                                deleteBoard(board.id);
                                if (selectedBoard?.id === board.id) setSelectedBoardId(null);
                              }
                            }}
                            className="p-1 rounded text-text-muted hover:text-danger transition-colors"
                            title="Delete board"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="border-t border-border p-2">
                    <button
                      onClick={() => { setShowBoardPicker(false); setShowCreateBoard(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Board
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Board tabs for quick switching */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {boards.filter(b => b.starred).map(board => (
              <button
                key={board.id}
                onClick={() => setSelectedBoardId(board.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  selectedBoard?.id === board.id
                    ? 'bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                )}
              >
                <Star className="w-2.5 h-2.5 text-warning fill-warning" />
                {board.title}
              </button>
            ))}
          </div>
        </div>

        {selectedBoard ? (
          <KanbanBoard boardId={selectedBoard.id} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <p className="text-sm font-medium text-text-muted mb-3">No board selected</p>
            <button onClick={() => setShowCreateBoard(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" />Create your first board
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}