"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";
import type { KanbanBoard } from "@/lib/types/database";

const MOCK_BOARDS: KanbanBoard[] = [
  { id: 'mock-board-2026', title: '2026 Tax Season', year: 2026, starred: true, created_by: null, created_at: new Date().toISOString() },
  { id: 'mock-board-2025', title: '2025 Tax Season', year: 2025, starred: false, created_by: null, created_at: new Date().toISOString() },
  { id: 'mock-board-onboarding', title: 'Client Onboarding', year: null, starred: true, created_by: null, created_at: new Date().toISOString() },
  { id: 'mock-board-advisory', title: 'Advisory Projects', year: null, starred: false, created_by: null, created_at: new Date().toISOString() },
];

export function useKanbanBoards() {
  const supabase = useSupabase();
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchBoards = useCallback(async () => {
    if (!configured) {
      setBoards(MOCK_BOARDS);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("kanban_boards")
      .select("*")
      .order("starred", { ascending: false })
      .order("created_at", { ascending: true });
    setBoards(data ?? []);
    setLoading(false);
  }, [supabase, configured]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  async function createBoard(title: string, year: number | null) {
    if (!configured) {
      const newBoard: KanbanBoard = {
        id: `mock-board-${Date.now()}`,
        title,
        year,
        starred: false,
        created_by: null,
        created_at: new Date().toISOString(),
      };
      setBoards(prev => [...prev, newBoard]);
      return newBoard;
    }
    const { data, error } = await supabase
      .from("kanban_boards")
      .insert({ title, year, starred: false })
      .select().single();
    if (error) throw error;
    await fetchBoards();
    return data;
  }

  async function deleteBoard(boardId: string) {
    if (!configured) {
      setBoards(prev => prev.filter(b => b.id !== boardId));
      return;
    }
    const { error } = await supabase.from("kanban_boards").delete().eq("id", boardId);
    if (error) throw error;
    await fetchBoards();
  }

  async function toggleStarred(boardId: string) {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    if (!configured) {
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, starred: !b.starred } : b));
      return;
    }
    const { error } = await supabase.from("kanban_boards").update({ starred: !board.starred }).eq("id", boardId);
    if (error) throw error;
    await fetchBoards();
  }

  return { boards, loading, createBoard, deleteBoard, toggleStarred, refetch: fetchBoards };
}
