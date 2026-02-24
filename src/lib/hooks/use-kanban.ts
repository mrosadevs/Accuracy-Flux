'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import type { KanbanColumn, KanbanCard } from '@/lib/types/database';

export interface ColumnWithCards extends KanbanColumn {
  items: KanbanCard[];
}

export function useKanban(boardId?: string) {
  const supabase = useSupabase();
  const [columns, setColumns] = useState<ColumnWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchColumns = useCallback(async () => {
    if (!configured) {
      setColumns([]);
      setLoading(false);
      return;
    }

    const colQuery = boardId
      ? supabase.from('kanban_columns').select('*').eq('board_id', boardId).order('sort_order')
      : supabase.from('kanban_columns').select('*').order('sort_order');

    const { data: cols } = await colQuery;
    if (!cols) { setLoading(false); return; }

    const colIds = cols.map(c => c.id);
    const { data: cards } = colIds.length
      ? await supabase.from('kanban_cards').select('*').in('column_id', colIds).order('sort_order')
      : { data: [] };

    const columnsWithCards: ColumnWithCards[] = cols.map(col => ({
      ...col,
      items: (cards ?? []).filter(card => card.column_id === col.id),
    }));

    setColumns(columnsWithCards);
    setLoading(false);
  }, [supabase, configured, boardId]);

  useEffect(() => {
    fetchColumns();
    if (!configured) return;
    const channel = supabase
      .channel('kanban-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_cards' }, fetchColumns)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_columns' }, fetchColumns)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchColumns, supabase, configured]);

  async function moveCard(cardId: string, toColumnId: string, toIndex: number) {
    if (!configured) {
      setColumns(prev => {
        const next = prev.map(col => ({ ...col, items: [...col.items] }));
        let movedCard: KanbanCard | undefined;
        for (const col of next) {
          const idx = col.items.findIndex(c => c.id === cardId);
          if (idx !== -1) { [movedCard] = col.items.splice(idx, 1); break; }
        }
        if (movedCard) {
          const targetCol = next.find(c => c.id === toColumnId);
          if (targetCol) { movedCard.column_id = toColumnId; targetCol.items.splice(toIndex, 0, movedCard); }
        }
        return next;
      });
      return;
    }
    await supabase.from('kanban_cards').update({ column_id: toColumnId, sort_order: toIndex }).eq('id', cardId);
    await fetchColumns();
  }

  async function addCard(columnId: string, input: Partial<KanbanCard>) {
    if (!configured) {
      const newCard: KanbanCard = {
        id: `card-${Date.now()}`, column_id: columnId,
        title: input.title ?? 'New card', description: input.description ?? null,
        client_id: null, client_name: input.client_name ?? null,
        assignee_id: null, assignee: input.assignee ?? null,
        priority: input.priority ?? 'medium', due_date: input.due_date ?? null,
        tags: input.tags ?? [], progress: 0, sort_order: 0,
        comments_count: 0, attachments_count: 0,
        subtasks_total: 0, subtasks_completed: 0,
        created_at: new Date().toISOString(),
      };
      setColumns(prev => prev.map(col =>
        col.id === columnId ? { ...col, items: [...col.items, newCard] } : col
      ));
      return newCard;
    }
    const { data, error } = await supabase
      .from('kanban_cards')
      .insert({
        column_id: columnId,
        title: input.title ?? 'New card',
        priority: input.priority ?? 'medium',
        due_date: input.due_date ?? null,
        client_name: input.client_name ?? null,
        assignee: input.assignee ?? null,
        tags: input.tags ?? [],
        progress: 0, sort_order: 0,
        comments_count: 0, attachments_count: 0,
        subtasks_total: 0, subtasks_completed: 0,
      })
      .select().single();
    if (error) throw error;
    await fetchColumns();
    return data;
  }

  return { columns, loading, moveCard, addCard, refetch: fetchColumns };
}
