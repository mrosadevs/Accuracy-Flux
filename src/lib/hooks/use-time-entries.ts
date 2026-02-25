"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";
import { useProfile } from "./use-profile";

export interface TimeEntry {
  id: string;
  work_item_id: string | null;
  task_id: string | null;
  task_name?: string;
  client_id: string | null;
  client_name?: string;
  user_id: string | null;
  user_name?: string;
  description: string | null;
  hours: number;
  date: string;
  billable: boolean;
  rate: number;
  created_at: string;
}

export interface ActiveTimer {
  description: string;
  clientId: string | null;
  clientName: string;
  workItemId: string | null;
  workItemTitle: string;
  taskId: string | null;
  taskName: string;
  startedAt: number;
  billable: boolean;
}

const LS_KEY = "af_active_timer";

function dispatchTimerChange() {
  try { window.dispatchEvent(new CustomEvent("af-timer-change")); } catch { /* ignore */ }
}

export function useTimeEntries() {
  const supabase = useSupabase();
  const { profile } = useProfile();
  const configured = isSupabaseConfigured();

  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? (JSON.parse(stored) as ActiveTimer) : null;
    } catch { return null; }
  });
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // ── Timer tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - activeTimer.startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // ── Safety: never show spinner forever ──────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(t);
  }, []);

  // ── Fetch entries ────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const { data } = await supabase
      .from("time_entries")
      .select("*, profiles(name), clients(name), tasks(title)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      setEntries(
        data
          .filter((e: Record<string, unknown>) => {
            const desc = (e.description as string | null)?.trim();
            return !!(desc && (e.hours as number) > 0);
          })
          .map((e: Record<string, unknown>) => ({
            ...(e as unknown as TimeEntry),
            user_name: (e.profiles as { name?: string } | null)?.name ?? "Me",
            client_name: (e.clients as { name?: string } | null)?.name ?? "",
            task_name: (e.tasks as { title?: string } | null)?.title ?? undefined,
          }))
      );
    }
    setLoading(false);
  }, [supabase, configured]);

  // ── Initial fetch + real-time subscription ───────────────────────────────
  useEffect(() => {
    fetchEntries();
    if (!configured) return;
    const channel = supabase
      .channel("time-entries-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "time_entries" }, fetchEntries)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEntries, supabase, configured]);

  // ── Timer controls ───────────────────────────────────────────────────────
  function startTimer(timer: Omit<ActiveTimer, "startedAt">) {
    const fullTimer: ActiveTimer = { ...timer, startedAt: Date.now() };
    setActiveTimer(fullTimer);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(fullTimer));
      dispatchTimerChange();
    } catch { /* ignore */ }
  }

  async function stopTimer() {
    const current = activeTimer;
    setActiveTimer(null);
    setElapsed(0);
    try {
      localStorage.removeItem(LS_KEY);
      dispatchTimerChange();
    } catch { /* ignore */ }

    if (!current || !profile || !configured) return;
    const finalElapsed = Math.floor((Date.now() - current.startedAt) / 1000);
    const hours = Math.round((finalElapsed / 3600) * 100) / 100;
    if (hours <= 0) return;

    await supabase.from("time_entries").insert({
      work_item_id: current.workItemId,
      task_id: current.taskId,
      client_id: current.clientId,
      user_id: profile.id,
      description: current.description,
      hours,
      date: new Date().toISOString().split("T")[0],
      billable: current.billable,
      rate: 0,
    });

    // Sync time_spent on linked work item
    if (current.workItemId) {
      const { data: wi } = await supabase
        .from("work_items").select("time_spent").eq("id", current.workItemId).single();
      await supabase
        .from("work_items")
        .update({ time_spent: (wi?.time_spent ?? 0) + hours })
        .eq("id", current.workItemId);
    }

    await fetchEntries();
  }

  async function addManualEntry(input: {
    description: string;
    clientId: string | null;
    clientName: string;
    workItemId?: string | null;
    taskId?: string | null;
    hours: number;
    date: string;
    billable: boolean;
  }) {
    if (!configured || !profile) return null;
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        work_item_id: input.workItemId ?? null,
        task_id: input.taskId ?? null,
        client_id: input.clientId,
        user_id: profile.id,
        description: input.description,
        hours: input.hours,
        date: input.date,
        billable: input.billable,
        rate: 0,
      })
      .select().single();
    if (error) throw error;

    // Sync time_spent on linked work item
    if (input.workItemId) {
      const { data: wi } = await supabase
        .from("work_items").select("time_spent").eq("id", input.workItemId).single();
      await supabase
        .from("work_items")
        .update({ time_spent: (wi?.time_spent ?? 0) + input.hours })
        .eq("id", input.workItemId);
    }

    await fetchEntries();
    return data;
  }

  async function deleteEntry(id: string) {
    if (!configured) return;
    // Decrement time_spent on linked work item before deleting
    const entry = entries.find(e => e.id === id);
    if (entry?.work_item_id) {
      const { data: wi } = await supabase
        .from("work_items").select("time_spent").eq("id", entry.work_item_id).single();
      await supabase
        .from("work_items")
        .update({ time_spent: Math.max(0, (wi?.time_spent ?? 0) - entry.hours) })
        .eq("id", entry.work_item_id);
    }
    await supabase.from("time_entries").delete().eq("id", id);
    await fetchEntries();
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const weekEntries  = entries.filter(e => e.date >= weekStartStr);
  const monthEntries = entries.filter(e => e.date >= monthStart);
  const hoursThisWeek       = weekEntries.reduce((s, e) => s + e.hours, 0);
  const billableAmountWeek  = weekEntries.filter(e => e.billable).reduce((s, e) => s + e.hours * e.rate, 0);
  const hoursThisMonth      = monthEntries.reduce((s, e) => s + e.hours, 0);
  const billableAmountMonth = monthEntries.filter(e => e.billable).reduce((s, e) => s + e.hours * e.rate, 0);

  const elapsedFormatted = [
    Math.floor(elapsed / 3600).toString().padStart(2, "0"),
    Math.floor((elapsed % 3600) / 60).toString().padStart(2, "00"),
    (elapsed % 60).toString().padStart(2, "00"),
  ].join(":");

  return {
    entries, loading, activeTimer, elapsed, elapsedFormatted,
    startTimer, stopTimer, addManualEntry, deleteEntry,
    hoursThisWeek, hoursThisMonth,
    billableAmountWeek, billableAmountMonth,
    refetch: fetchEntries,
  };
}
