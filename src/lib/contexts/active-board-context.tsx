'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured } from '@/lib/hooks/use-supabase';

export interface BoardSummary {
  id: string;
  title: string;
  starred: boolean;
}

interface ActiveBoardCtx {
  activeBoardId: string | null;
  activeBoardName: string | null;
  boards: BoardSummary[];
  setActiveBoard: (id: string, name: string) => void;
  ready: boolean;
}

const Ctx = createContext<ActiveBoardCtx>({
  activeBoardId: null,
  activeBoardName: null,
  boards: [],
  setActiveBoard: () => {},
  ready: false,
});

const LS_KEY = 'af-active-board';

export function ActiveBoardProvider({ children }: { children: React.ReactNode }) {
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoardName, setActiveBoardName] = useState<string | null>(null);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [ready, setReady] = useState(false);

  const setActiveBoard = useCallback((id: string, name: string) => {
    setActiveBoardId(id);
    setActiveBoardName(name);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ id, name }));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Lazy import to avoid SSR issues
    import('@supabase/ssr').then(({ createBrowserClient }) => {
      const supabase = createBrowserClient(url, key);
      supabase
        .from('kanban_boards')
        .select('id, title, starred, is_archived')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (!data) { setReady(true); return; }

          const list: BoardSummary[] = data.map(b => ({
            id: b.id,
            title: b.title,
            starred: b.starred ?? false,
          }));
          setBoards(list);

          // Try to restore from localStorage
          try {
            const stored = localStorage.getItem(LS_KEY);
            if (stored) {
              const { id, name } = JSON.parse(stored);
              if (list.some(b => b.id === id)) {
                setActiveBoardId(id);
                setActiveBoardName(name);
                setReady(true);
                return;
              }
            }
          } catch { /* ignore */ }

          // Default: starred board first, then most recent
          const def = list.find(b => b.starred) ?? list[0];
          if (def) {
            setActiveBoardId(def.id);
            setActiveBoardName(def.title);
            try {
              localStorage.setItem(LS_KEY, JSON.stringify({ id: def.id, name: def.title }));
            } catch { /* ignore */ }
          }
          setReady(true);
        });
    });
  }, []);

  return (
    <Ctx.Provider value={{ activeBoardId, activeBoardName, boards, setActiveBoard, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveBoard() {
  return useContext(Ctx);
}
