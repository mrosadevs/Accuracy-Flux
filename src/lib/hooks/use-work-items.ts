'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import { workItems as mockWorkItems, type WorkItem as MockWorkItem, type Task as MockTask } from '@/lib/mock-data';
import type { WorkItem, Task } from '@/lib/types/database';

export interface WorkItemWithTasks extends WorkItem {
  tasks: Task[];
}

function adaptMockWorkItem(m: MockWorkItem): WorkItemWithTasks {
  return {
    id: m.id,
    title: m.title,
    client_id: m.clientId,
    client_name: m.client,
    type: m.type,
    status: m.status,
    priority: m.priority,
    assignee_id: null,
    assignee: m.assignee,
    due_date: m.dueDate,
    start_date: m.startDate,
    progress: m.progress,
    budget: m.budget,
    time_spent: m.timeSpent,
    description: m.description ?? null,
    created_at: new Date().toISOString(),
    tasks: m.tasks.map((t: MockTask, i: number) => ({
      id: t.id,
      work_item_id: m.id,
      title: t.title,
      completed: t.completed,
      assignee_id: null,
      assignee: t.assignee ?? null,
      due_date: t.dueDate ?? null,
      sort_order: i,
      created_at: new Date().toISOString(),
    })),
  };
}

export function useWorkItems() {
  const supabase = useSupabase();
  const [workItems, setWorkItems] = useState<WorkItemWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchWorkItems = useCallback(async () => {
    if (!configured) {
      setWorkItems(mockWorkItems.map(adaptMockWorkItem));
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from('work_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!items) { setLoading(false); return; }

    const ids = items.map(i => i.id);
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('work_item_id', ids)
      .order('sort_order');

    const withTasks: WorkItemWithTasks[] = items.map(item => ({
      ...item,
      tasks: (tasks ?? []).filter(t => t.work_item_id === item.id),
    }));

    setWorkItems(withTasks);
    setLoading(false);
  }, [supabase, configured]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  async function updateTaskCompletion(taskId: string, workItemId: string, completed: boolean) {
    if (!configured) {
      setWorkItems(prev => prev.map(wi =>
        wi.id === workItemId
          ? { ...wi, tasks: wi.tasks.map(t => t.id === taskId ? { ...t, completed } : t) }
          : wi
      ));
      return;
    }
    await supabase.from('tasks').update({ completed }).eq('id', taskId);
    // Update progress
    const workItem = workItems.find(w => w.id === workItemId);
    if (workItem) {
      const allTasks = workItem.tasks.map(t => t.id === taskId ? { ...t, completed } : t);
      const done = allTasks.filter(t => t.completed).length;
      const progress = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
      await supabase.from('work_items').update({ progress }).eq('id', workItemId);
    }
    await fetchWorkItems();
  }

  async function addWorkItem(input: Partial<WorkItem>) {
    if (!configured) return null;
    const { data, error } = await supabase
      .from('work_items')
      .insert({
        title: input.title ?? '',
        client_id: input.client_id ?? null,
        client_name: input.client_name ?? '',
        type: input.type ?? 'tax-return',
        status: input.status ?? 'not-started',
        priority: input.priority ?? 'medium',
        assignee: input.assignee ?? '',
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

  return { workItems, loading, updateTaskCompletion, addWorkItem, refetch: fetchWorkItems };
}
