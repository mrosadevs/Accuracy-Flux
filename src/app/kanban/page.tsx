'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveBoard } from '@/lib/contexts/active-board-context';
import {
  Plus, ChevronDown, Star, Trash2, X, AlertCircle, Loader2,
  Calendar, Archive, Sparkles, Users,
} from 'lucide-react';
import clsx from 'clsx';
import { useKanbanBoards } from '@/lib/hooks/use-kanban-boards';
import { useSupabase, isSupabaseConfigured } from '@/lib/hooks/use-supabase';
import { useClients } from '@/lib/hooks/use-clients';
import type { KanbanBoard as KanbanBoardType } from '@/lib/types/database';

/* ─────────────────────────────────────────────────────────────────────────────
   Default Tax Season Columns
───────────────────────────────────────────────────────────────────────────── */
const DEFAULT_SEASON_COLUMNS = [
  { title: 'Clients',                color: '#64748b', sort_order: 0 },
  { title: 'Estimate Sent',          color: '#3b82f6', sort_order: 1 },
  { title: 'Estimate Approved',      color: '#8b5cf6', sort_order: 2 },
  { title: 'Waiting on Documents',   color: '#f59e0b', sort_order: 3 },
  { title: 'In Progress',            color: '#06b6d4', sort_order: 4 },
  { title: 'In Review',              color: '#ec4899', sort_order: 5 },
  { title: 'Filed / Submitted',      color: '#10b981', sort_order: 6 },
  { title: 'Complete',               color: '#22c55e', sort_order: 7 },
];

/* ─────────────────────────────────────────────────────────────────────────────
   New Season Modal
───────────────────────────────────────────────────────────────────────────── */
function NewSeasonModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (boardId: string, boardTitle: string) => void;
}) {
  const supabase = useSupabase();
  const { clients } = useClients();
  const configured = isSupabaseConfigured();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear + 1));
  const [boardName, setBoardName] = useState(`${currentYear + 1} Tax Season`);
  const [populateClients, setPopulateClients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Update board name when year changes
  function handleYearChange(y: string) {
    setYear(y);
    setBoardName(`${y} Tax Season`);
  }

  async function handleCreate() {
    if (!boardName.trim()) { setError('Board name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (!configured) {
        onCreated('mock-new-board', boardName.trim());
        onClose();
        return;
      }

      // 1. Create the board
      const { data: board, error: boardErr } = await supabase
        .from('kanban_boards')
        .insert({ title: boardName.trim(), year: parseInt(year) || null, starred: true, is_archived: false })
        .select()
        .single();
      if (boardErr) throw boardErr;

      // 2. Create default columns
      const colInserts = DEFAULT_SEASON_COLUMNS.map(col => ({ ...col, board_id: board.id }));
      const { data: cols, error: colErr } = await supabase
        .from('kanban_columns')
        .insert(colInserts)
        .select();
      if (colErr) throw colErr;

      // 3. Optionally create work items for all active clients
      if (populateClients && clients.length > 0 && cols && cols.length > 0) {
        const firstCol = cols.find((c: { sort_order: number }) => c.sort_order === 0) ?? cols[0];
        const workItemInserts = clients
          .filter(c => c.status === 'active' || c.status === 'onboarding')
          .map((client, idx) => ({
            title: `${year} Tax Return`,
            client_id: client.id,
            client_name: client.name,
            business_name: null,
            type: 'tax-return' as const,
            status: 'not-started' as const,
            priority: 'medium' as const,
            assignee: '',
            due_date: null,
            start_date: null,
            progress: 0,
            budget: 0,
            time_spent: 0,
            description: null,
            show_in_portal: false,
            board_id: board.id,
            column_id: firstCol.id,
            tags: [],
            sort_order: idx,
          }));

        if (workItemInserts.length > 0) {
          const { error: wiErr } = await supabase.from('work_items').insert(workItemInserts);
          if (wiErr) console.warn('Could not auto-populate clients:', wiErr.message);
        }
      }

      onCreated(board.id, boardName.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create season');
    } finally {
      setSaving(false);
    }
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
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Start New Season</h2>
              <p className="text-[11px] text-text-muted">Creates a fresh board with all columns pre-built</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Tax Year</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  type="number" value={year} onChange={e => handleYearChange(e.target.value)}
                  min="2020" max="2040"
                  className="w-full h-10 pl-8 pr-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Board Name</label>
              <input
                type="text" value={boardName} onChange={e => setBoardName(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Pre-built columns preview */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block">Pre-built Columns</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SEASON_COLUMNS.map(col => (
                <div key={col.title} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: col.color }}>
                  {col.title}
                </div>
              ))}
            </div>
          </div>

          {/* Auto-populate toggle */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-surface-hover/50 transition-colors">
            <input
              type="checkbox"
              checked={populateClients}
              onChange={e => setPopulateClients(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary-600 focus:ring-primary-500/20"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-xs font-semibold text-text-primary">Auto-populate active clients</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Creates a &quot;{year} Tax Return&quot; card for each active client in the &quot;New Client&quot; column
                {clients.filter(c => c.status === 'active' || c.status === 'onboarding').length > 0 &&
                  ` (${clients.filter(c => c.status === 'active' || c.status === 'onboarding').length} clients)`}
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <motion.button
              onClick={handleCreate}
              disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-3.5 h-3.5" />Create Season</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Kanban Page
───────────────────────────────────────────────────────────────────────────── */
export default function KanbanPage() {
  const { boards, loading, createBoard, deleteBoard, toggleStarred, refetch } = useKanbanBoards();
  const { activeBoardId, setActiveBoard } = useActiveBoard();
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const selectedBoard = boards.find(b => b.id === activeBoardId) ?? boards.find(b => !b.is_archived) ?? boards[0] ?? null;

  // Sync context when a fallback board is resolved (e.g. first load with no stored board)
  useEffect(() => {
    if (selectedBoard && selectedBoard.id !== activeBoardId) {
      setActiveBoard(selectedBoard.id, selectedBoard.title);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard?.id]);

  const activeBoards = boards.filter(b => !b.is_archived);
  const archivedBoards = boards.filter(b => b.is_archived);

  if (loading) {
    return (
      <AppShell title="Board" subtitle="Your tax season at a glance">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Board" subtitle="Drag and drop to manage your workflow">
      <AnimatePresence>
        {showNewSeason && (
          <NewSeasonModal
            onClose={() => setShowNewSeason(false)}
            onCreated={(boardId, boardTitle) => {
              refetch();
              setActiveBoard(boardId, boardTitle);
            }}
          />
        )}
        {showCreateBoard && (
          <CreateBoardModal
            onClose={() => setShowCreateBoard(false)}
            onCreate={async (title, year) => {
              const board = await createBoard(title, year);
              if (board) setActiveBoard(board.id, board.title);
              return board;
            }}
          />
        )}
      </AnimatePresence>

      <div className="h-full flex flex-col">
        {/* Board Header Bar */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0 flex-wrap">
          {/* Board selector dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setShowBoardPicker(!showBoardPicker)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary-300 transition-all"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            >
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-sm font-semibold text-text-primary">{selectedBoard?.title ?? 'Select Board'}</span>
              {selectedBoard?.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
              {selectedBoard?.is_archived && <Archive className="w-3 h-3 text-text-muted" />}
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            </motion.button>

            <AnimatePresence>
              {showBoardPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-80 bg-surface rounded-xl border border-border shadow-xl overflow-hidden z-30"
                >
                  <div className="p-2">
                    {/* Active boards */}
                    {activeBoards.length > 0 && (
                      <>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 py-1.5">Active Seasons</p>
                        {activeBoards.map((board, i) => (
                          <BoardPickerRow
                            key={board.id}
                            board={board}
                            selected={selectedBoard?.id === board.id}
                            onSelect={() => { setActiveBoard(board.id, board.title); setShowBoardPicker(false); }}
                            onToggleStar={() => toggleStarred(board.id)}
                            onArchive={async () => {
                              // TODO: archive support in use-kanban-boards
                            }}
                            onDelete={() => {
                              if (confirm(`Delete "${board.title}"? This will also delete all columns and cards.`)) {
                                deleteBoard(board.id);
                                if (selectedBoard?.id === board.id) {
                                  const next = boards.find(b => b.id !== board.id && !b.is_archived);
                                  if (next) setActiveBoard(next.id, next.title);
                                }
                              }
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* Archived boards */}
                    {archivedBoards.length > 0 && (
                      <>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 py-1.5 mt-2 border-t border-border pt-3">Archived</p>
                        {archivedBoards.map(board => (
                          <BoardPickerRow
                            key={board.id}
                            board={board}
                            selected={selectedBoard?.id === board.id}
                            archived
                            onSelect={() => { setActiveBoard(board.id, board.title); setShowBoardPicker(false); }}
                            onToggleStar={() => toggleStarred(board.id)}
                            onDelete={() => {
                              if (confirm(`Delete "${board.title}"?`)) {
                                deleteBoard(board.id);
                                if (selectedBoard?.id === board.id) {
                                  const next = boards.find(b => b.id !== board.id && !b.is_archived);
                                  if (next) setActiveBoard(next.id, next.title);
                                }
                              }
                            }}
                          />
                        ))}
                      </>
                    )}

                    {boards.length === 0 && (
                      <p className="text-xs text-text-muted text-center py-4">No boards yet</p>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="border-t border-border p-2 space-y-1">
                    <button
                      onClick={() => { setShowBoardPicker(false); setShowNewSeason(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      New Season (pre-built)
                    </button>
                    <button
                      onClick={() => { setShowBoardPicker(false); setShowCreateBoard(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Blank Board
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick-access tabs for starred boards */}
          <div className="hidden md:flex items-center gap-1">
            {boards.filter(b => b.starred && !b.is_archived).map(board => (
              <button
                key={board.id}
                onClick={() => setActiveBoard(board.id, board.title)}
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

          {/* New Season shortcut */}
          <motion.button
            onClick={() => setShowNewSeason(true)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Season
          </motion.button>
        </div>

        {/* Board Content */}
        {selectedBoard ? (
          <KanbanBoard boardId={selectedBoard.id} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-500" />
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">No board selected</p>
            <p className="text-xs text-text-muted mb-5">Start your first tax season to get going</p>
            <motion.button
              onClick={() => setShowNewSeason(true)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />Create Your First Season
            </motion.button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ─── Board Picker Row ─────────────────────────────────────────────────────── */
function BoardPickerRow({ board, selected, archived, onSelect, onToggleStar, onDelete, onArchive }: {
  board: KanbanBoardType;
  selected: boolean;
  archived?: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
  onArchive?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={clsx(
        'flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors group/board',
        selected ? 'bg-primary-50' : 'hover:bg-surface-hover'
      )}
    >
      <button onClick={onSelect} className="flex-1 text-left flex items-center gap-2">
        <div className="flex-1">
          <p className={clsx('text-sm font-medium', archived ? 'text-text-muted' : 'text-text-primary')}>{board.title}</p>
          <p className="text-[10px] text-text-muted">{board.year ? `Tax Year ${board.year}` : 'Ongoing'}{archived ? ' · Archived' : ''}</p>
        </div>
        {board.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
      </button>
      <div className="flex items-center gap-1 opacity-0 group-hover/board:opacity-100 transition-opacity">
        <button onClick={onToggleStar} className={clsx('p-1 rounded transition-colors', board.starred ? 'text-warning' : 'text-text-muted hover:text-warning')} title={board.starred ? 'Unstar' : 'Star'}>
          <Star className={clsx('w-3 h-3', board.starred && 'fill-warning')} />
        </button>
        <button onClick={onDelete} className="p-1 rounded text-text-muted hover:text-danger transition-colors" title="Delete board">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Create Blank Board Modal ─────────────────────────────────────────────── */
function CreateBoardModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (title: string, year: number | null) => Promise<KanbanBoardType | undefined>;
}) {
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
          <h2 className="text-sm font-bold text-text-primary">Create Blank Board</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Board Name *</label>
            <input type="text" placeholder="e.g. Advisory Projects" value={title} onChange={e => setTitle(e.target.value)} autoFocus
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
