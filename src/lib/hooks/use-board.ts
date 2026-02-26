"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";
import type { WorkItem, Task, KanbanColumn } from "@/lib/types/database";

export interface WorkItemCard extends WorkItem {
  tasks: Task[];
}

export interface BoardColumn extends KanbanColumn {
  cards: WorkItemCard[];
}

// Tags that are auto-managed — not manually added by the user
const AUTO_TAGS = ["Waiting on Client"];

// Column names that count as "complete" for auto-advance
const COMPLETION_COLUMNS = ["filed", "submitted", "complete", "done", "finished"];
// Column names that count as "waiting" for auto-move on waiting tasks
const WAITING_COLUMNS = ["waiting on documents", "waiting on client", "waiting", "on hold"];

export function useBoard(boardId?: string) {
  const supabase = useSupabase();
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBoard = useCallback(async () => {
    if (!configured || !boardId) {
      setColumns([]);
      setLoading(false);
      return;
    }

    // Load columns for this board
    const { data: cols } = await supabase
      .from("kanban_columns")
      .select("*")
      .eq("board_id", boardId)
      .order("sort_order");

    if (!cols || cols.length === 0) {
      setColumns([]);
      setLoading(false);
      return;
    }

    // Load work items for this board
    const { data: items } = await supabase
      .from("work_items")
      .select("*")
      .eq("board_id", boardId)
      .order("sort_order");

    const workItems = items ?? [];
    const workItemIds = workItems.map((i: WorkItem) => i.id);

    // Load all tasks for these work items
    const { data: tasks } = workItemIds.length
      ? await supabase.from("tasks").select("*").in("work_item_id", workItemIds).order("sort_order")
      : { data: [] };

    // Build WorkItemCard objects
    const cards: WorkItemCard[] = workItems.map((item: WorkItem) => ({
      ...item,
      tasks: (tasks ?? []).filter((t: Task) => t.work_item_id === item.id),
    }));

    // Group cards by column
    const boardColumns: BoardColumn[] = cols.map((col: KanbanColumn) => ({
      ...col,
      cards: cards.filter((c: WorkItemCard) => c.column_id === col.id),
    }));

    setColumns(boardColumns);
    setLoading(false);
  }, [supabase, configured, boardId]);

  useEffect(() => {
    fetchBoard();
    if (!configured || !boardId) return;
    const channel = supabase
      .channel(`board-${boardId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "work_items" }, fetchBoard)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchBoard)
      .on("postgres_changes", { event: "*", schema: "public", table: "kanban_columns" }, fetchBoard)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBoard, supabase, configured, boardId]);

  // ─── Move card to column ────────────────────────────────────────────────────
  async function moveCard(workItemId: string, toColumnId: string, toIndex?: number) {
    if (!configured) return;
    await supabase
      .from("work_items")
      .update({ column_id: toColumnId, sort_order: toIndex ?? 0 })
      .eq("id", workItemId);
    await fetchBoard();
  }

  // ─── Add work item to board ─────────────────────────────────────────────────
  async function addCard(columnId: string, input: Partial<WorkItem>) {
    if (!configured || !boardId) return null;
    const targetCol = columns.find(c => c.id === columnId);
    const sortOrder = targetCol ? targetCol.cards.length : 0;
    const { data, error } = await supabase
      .from("work_items")
      .insert({
        title: input.title ?? "New work item",
        client_id: input.client_id ?? null,
        client_name: input.client_name ?? "",
        business_name: input.business_name ?? null,
        type: input.type ?? "tax-return",
        status: input.status ?? "not-started",
        priority: input.priority ?? "medium",
        assignee: input.assignee ?? "",
        assignee_id: input.assignee_id ?? null,
        due_date: input.due_date ?? null,
        start_date: input.start_date ?? null,
        progress: 0,
        budget: input.budget ?? 0,
        time_spent: 0,
        description: input.description ?? null,
        show_in_portal: input.show_in_portal ?? false,
        board_id: boardId,
        column_id: columnId,
        tags: input.tags ?? [],
        sort_order: sortOrder,
      })
      .select()
      .single();
    if (error) throw error;
    await fetchBoard();
    return data;
  }

  // ─── Update work item ───────────────────────────────────────────────────────
  async function updateCard(workItemId: string, updates: Partial<WorkItem>) {
    if (!configured) return;
    const { error } = await supabase.from("work_items").update(updates).eq("id", workItemId);
    if (error) throw error;
    await fetchBoard();
  }

  // ─── Delete work item ───────────────────────────────────────────────────────
  async function deleteCard(workItemId: string) {
    if (!configured) return;
    const { error } = await supabase.from("work_items").delete().eq("id", workItemId);
    if (error) throw error;
    await fetchBoard();
  }

  // ─── Add task ───────────────────────────────────────────────────────────────
  async function addTask(workItemId: string, title: string, assignee?: string, assigneeId?: string, dueDate?: string) {
    if (!configured) return null;
    const card = columns.flatMap(c => c.cards).find(c => c.id === workItemId);
    const sortOrder = card ? card.tasks.length : 0;
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        work_item_id: workItemId,
        title: title.trim(),
        completed: false,
        status: "not-started",
        assignee: assignee ?? null,
        assignee_id: assigneeId ?? null,
        due_date: dueDate ?? null,
        sort_order: sortOrder,
      })
      .select()
      .single();
    if (error) throw error;
    await fetchBoard();
    return data;
  }

  // ─── Delete task ────────────────────────────────────────────────────────────
  async function deleteTask(taskId: string) {
    if (!configured) return;
    await supabase.from("tasks").delete().eq("id", taskId);
    await fetchBoard();
  }

  // ─── Assign task to a team member ───────────────────────────────────────────
  async function assignTask(taskId: string, assignee: string | null, assigneeId: string | null) {
    if (!configured) return;
    await supabase.from("tasks").update({ assignee, assignee_id: assigneeId }).eq("id", taskId);
    await fetchBoard();
  }

  // ─── Complete task (with auto-advance + auto-label logic) ──────────────────
  async function completeTask(taskId: string, workItemId: string, completed: boolean, taskStatus?: string) {
    if (!configured) return;

    const effectiveStatus = completed ? "completed" : (taskStatus === "waiting-on-client" ? "waiting-on-client" : "not-started");
    await supabase.from("tasks").update({ completed: completed && effectiveStatus !== "waiting-on-client", status: effectiveStatus }).eq("id", taskId);

    const card = columns.flatMap(c => c.cards).find(c => c.id === workItemId);
    if (!card) { await fetchBoard(); return; }

    const updatedTasks = card.tasks.map(t => t.id === taskId ? { ...t, completed: completed && effectiveStatus !== "waiting-on-client", status: effectiveStatus } : t);
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
    const allDone = updatedTasks.length > 0 && completedCount === updatedTasks.length;
    const hasWaitingTask = updatedTasks.some(t => t.status === "waiting-on-client");

    // ── Auto-label: "Waiting on Client" ─────────────────────────────────────
    let newTags = [...(card.tags ?? [])];
    if (hasWaitingTask && !newTags.includes("Waiting on Client")) {
      newTags = [...newTags, "Waiting on Client"];
    } else if (!hasWaitingTask) {
      newTags = newTags.filter(t => t !== "Waiting on Client");
    }

    // ── Determine target column ──────────────────────────────────────────────
    let targetColumnId = card.column_id;

    if (hasWaitingTask) {
      // Move to "Waiting on Documents" or nearest waiting column
      const waitingCol = columns.find(c =>
        WAITING_COLUMNS.some(k => c.title.toLowerCase().includes(k))
      );
      if (waitingCol && waitingCol.id !== card.column_id) {
        targetColumnId = waitingCol.id;
      }
    } else if (allDone) {
      // All tasks done → move to completion column
      const currentColIdx = columns.findIndex(c => c.id === card.column_id);
      const completionCol = columns.find((c, i) =>
        i > currentColIdx && COMPLETION_COLUMNS.some(k => c.title.toLowerCase().includes(k))
      );
      if (completionCol) {
        targetColumnId = completionCol.id;
      } else if (currentColIdx < columns.length - 1) {
        // Advance to next column if no completion column found
        targetColumnId = columns[currentColIdx + 1]?.id ?? card.column_id;
      }
    } else if (!hasWaitingTask && card.tags?.includes("Waiting on Client")) {
      // Was waiting, now resolved — move back to In Progress
      const inProgressCol = columns.find(c => c.title.toLowerCase().includes("in progress"));
      if (inProgressCol) targetColumnId = inProgressCol.id;
    }

    // ── Apply updates ────────────────────────────────────────────────────────
    const updates: Partial<WorkItem> = { progress, tags: newTags };
    if (targetColumnId !== card.column_id) updates.column_id = targetColumnId;
    if (allDone) updates.status = "completed";
    else if (hasWaitingTask) updates.status = "waiting-on-client";
    else if (card.status === "completed") updates.status = "in-progress";

    await supabase.from("work_items").update(updates).eq("id", workItemId);
    await fetchBoard();
  }

  // ─── Manage tags ────────────────────────────────────────────────────────────
  async function addTag(workItemId: string, tag: string) {
    if (!configured) return;
    const card = columns.flatMap(c => c.cards).find(c => c.id === workItemId);
    if (!card) return;
    const newTags = [...new Set([...(card.tags ?? []), tag])];
    await supabase.from("work_items").update({ tags: newTags }).eq("id", workItemId);
    await fetchBoard();
  }

  async function removeTag(workItemId: string, tag: string) {
    if (!configured) return;
    if (AUTO_TAGS.includes(tag)) return; // can't manually remove auto-tags
    const card = columns.flatMap(c => c.cards).find(c => c.id === workItemId);
    if (!card) return;
    const newTags = (card.tags ?? []).filter(t => t !== tag);
    await supabase.from("work_items").update({ tags: newTags }).eq("id", workItemId);
    await fetchBoard();
  }

  // ─── Column management ──────────────────────────────────────────────────────
  async function addColumn(title: string, color: string = "#64748b") {
    if (!configured || !boardId) return;
    const maxOrder = columns.reduce((m, c) => Math.max(m, c.sort_order ?? 0), -1);
    const { error } = await supabase.from("kanban_columns").insert({
      title, color,
      sort_order: maxOrder + 1,
      board_id: boardId,
    });
    if (error) throw error;
    await fetchBoard();
  }

  async function editColumn(columnId: string, updates: Partial<KanbanColumn>) {
    if (!configured) return;
    await supabase.from("kanban_columns").update(updates).eq("id", columnId);
    await fetchBoard();
  }

  async function deleteColumn(columnId: string) {
    if (!configured) return;
    await supabase.from("kanban_columns").delete().eq("id", columnId);
    await fetchBoard();
  }

  return {
    columns,
    loading,
    moveCard,
    addCard,
    updateCard,
    deleteCard,
    addTask,
    deleteTask,
    assignTask,
    completeTask,
    addTag,
    removeTag,
    addColumn,
    editColumn,
    deleteColumn,
    refetch: fetchBoard,
  };
}
