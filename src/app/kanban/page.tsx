'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Calendar, Archive, Star } from 'lucide-react';
import clsx from 'clsx';

const boards = [
  { id: '2026', name: '2026 Tax Season', year: 2026, color: '#3b82f6', active: true, starred: true },
  { id: '2025', name: '2025 Tax Season', year: 2025, color: '#8b5cf6', active: false, starred: false },
  { id: '2024', name: '2024 Archive', year: 2024, color: '#64748b', active: false, starred: false },
  { id: 'onboarding', name: 'Client Onboarding', year: null, color: '#10b981', active: true, starred: true },
  { id: 'advisory', name: 'Advisory Projects', year: null, color: '#ec4899', active: true, starred: false },
];

export default function KanbanPage() {
  const [selectedBoard, setSelectedBoard] = useState(boards[0]);
  const [showBoardPicker, setShowBoardPicker] = useState(false);

  return (
    <AppShell title="Board" subtitle="Drag and drop to manage your workflow">
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
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedBoard.color }} />
              <span className="text-sm font-semibold text-text-primary">{selectedBoard.name}</span>
              {selectedBoard.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
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
                      <motion.button
                        key={board.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => { setSelectedBoard(board); setShowBoardPicker(false); }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          selectedBoard.id === board.id ? 'bg-primary-50 dark:bg-primary-500/10' : 'hover:bg-surface-hover'
                        )}
                      >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: board.color }} />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-text-primary">{board.name}</p>
                          <p className="text-[10px] text-text-muted">
                            {board.year ? `Tax Year ${board.year}` : 'Ongoing'}
                            {!board.active && ' · Archived'}
                          </p>
                        </div>
                        {board.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
                        {!board.active && <Archive className="w-3 h-3 text-text-muted" />}
                      </motion.button>
                    ))}
                  </div>
                  <div className="border-t border-border p-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">
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
                onClick={() => setSelectedBoard(board)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  selectedBoard.id === board.id
                    ? 'bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                )}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: board.color }} />
                {board.name}
              </button>
            ))}
          </div>
        </div>

        <KanbanBoard boardId={selectedBoard.id} />
      </div>
    </AppShell>
  );
}

