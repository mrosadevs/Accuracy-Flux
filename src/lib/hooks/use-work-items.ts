"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";
import type { WorkItem, Task } from "@/lib/types/database";

export interface WorkItemWithTasks extends WorkItem {
  tasks: Task[];
}

export function useWorkItems() {
  const supabase = useSupabase();
  const [workItems, setWorkItems] = useState<WorkItemWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchWorkItems = useCallback(async () => {
    if (!configured) {
      setWorkItems([]);
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from("work_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!items) { setLoading(false); return; }

    const ids = items.map(i => i.id);
    const { data: tasks } = ids.length
      ? await supabase.from("tasks").select("*").in("work_item_id", ids).order("sort_order")
      : { data: [] };

    const withTasks: WorkItemWithTasks[] = items.map(item => ({
      ...item,
      tasks: (tasks ?? []).filter(t => t.work_item_id === item.id),
    }));

    setWorkItems(withTasks);
    setLoading(false);
  }, [supabase, configured]);

  // Safety: never show spinner forever
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(t);
  }, []);

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchWorkItems();
    if (!configured) return;
    const channel = supabase
      .channel("work-items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "work_items" }, fetchWorkItems)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchWorkItems)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchWorkItems, supabase, configured]);

  async function updateTaskCompletion(taskId: string, workItemId: string, completed: boolean) {
    if (!configured) return;
    await supabase.from("tasks").update({ completed }).eq("id", taskId);
    const workItem = workItems.find(w => w.id === workItemId);
    if (workItem) {
      const allTasks = workItem.tasks.map(t => t.id === taskId ? { ...t, completed } : t);
      const done = allTasks.filter(t => t.completed).length;
      const progress = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
      await supabase.from("work_items").update({ progress }).eq("id", workItemId);
    }
    await fetchWorkItems();
  }

  async function addWorkItem(input: Partial<WorkItem>) {
    if (!configured) return null;
    const { data, error } = await supabase
      .from("work_items")
      .insert({
        title: input.title ?? "",
        client_id: input.client_id ?? null,
        client_name: input.client_name ?? "",
        business_name: input.business_name ?? null,
        type: input.type ?? "tax-return",
        status: input.status ?? "not-started",
        priority: input.priority ?? "medium",
        assignee: input.assignee ?? "",
        due_date: input.due_date ?? null,
        start_date: input.start_date ?? null,
        progress: 0,
        budget: input.budget ?? 0,
        time_spent: 0,
      })
      .select().single();
    if (error) throw error;
    await fetchWorkItems();
    return data;
  }

  async function updateWorkItem(id: string, updates: Partial<WorkItem>) {
    if (!configured) return;
    const { error } = await supabase.from("work_items").update(updates).eq("id", id);
    if (error) throw error;
    await fetchWorkItems();
  }

  async function deleteWorkItem(id: string) {
    if (!configured) return;
    const { error } = await supabase.from("work_items").delete().eq("id", id);
    if (error) throw error;
    await fetchWorkItems();
  }

  async function addTask(workItemId: string, title: string, assignee?: string, assigneeId?: string, dueDate?: string) {
    if (!configured) return null;
    const workItem = workItems.find(w => w.id === workItemId);
    const sortOrder = workItem ? workItem.tasks.length : 0;
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        work_item_id: workItemId,
        title: title.trim(),
        completed: false,
        assignee: assignee ?? null,
        assignee_id: assigneeId ?? null,
        due_date: dueDate ?? null,
        sort_order: sortOrder,
      })
      .select().single();
    if (error) throw error;
    await fetchWorkItems();
    return data;
  }

  async function deleteTask(taskId: string) {
    if (!configured) return;
    await supabase.from("tasks").delete().eq("id", taskId);
    await fetchWorkItems();
  }

  return { workItems, loading, updateTaskCompletion, addWorkItem, updateWorkItem, deleteWorkItem, addTask, deleteTask, refetch: fetchWorkItems };
}
