"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";
import { useProfile } from "./use-profile";

export interface TimeEntry {
  id: string;
  work_item_id: string | null;
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
  startedAt: number;
  billable: boolean;
  rate: number;
}

const LS_KEY = "af_active_timer";

function dispatchTimerChange() {
  try { window.dispatchEvent(new CustomEvent("af-timer-change")); } catch { /* ignore */ }
}

export function useTimeEntries() {
  const supabase = useSupabase();
  const { profile } = useProfile();
  const configured = isSupabaseConfigured();

  // Initialize activeTimer from localStorage so it survives page navigation
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

  // Timer tick every second
  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - activeTimer.startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const fetchEntries = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const { data } = await supabase
      .from("time_entries")
      .select("*, profiles(name), clients(name)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) {
      setEntries(data.map((e: Record<string, unknown>) => ({
        ...(e as unknown as TimeEntry),
        user_name: (e.profiles as { name?: string } | null)?.name ?? "Unknown",
        client_name: (e.clients as { name?: string } | null)?.name ?? "",
      })));
    }
    setLoading(false);
  }, [supabase, configured]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
    // Clear state immediately
    setActiveTimer(null);
    setElapsed(0);
    try {
      localStorage.removeItem(LS_KEY);
      dispatchTimerChange();
    } catch { /* ignore */ }

    if (!current || !profile || !configured) return;
    const finalElapsed = Math.floor((Date.now() - current.startedAt) / 1000);
    const hours = Math.round((finalElapsed / 3600) * 100) / 100;
    if (hours < 0.01) return;
    await supabase.from("time_entries").insert({
      work_item_id: current.workItemId,
      client_id: current.clientId,
      user_id: profile.id,
      description: current.description,
      hours,
      date: new Date().toISOString().split("T")[0],
      billable: current.billable,
      rate: current.rate,
    });
    await fetchEntries();
  }

  async function addManualEntry(input: {
    description: string;
    clientId: string | null;
    clientName: string;
    hours: number;
    date: string;
    billable: boolean;
    rate: number;
  }) {
    if (!configured || !profile) return null;
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        client_id: input.clientId,
        user_id: profile.id,
        description: input.description,
        hours: input.hours,
        date: input.date,
        billable: input.billable,
        rate: input.rate,
      })
      .select().single();
    if (error) throw error;
    await fetchEntries();
    return data;
  }

  async function deleteEntry(id: string) {
    if (!configured) return;
    await supabase.from("time_entries").delete().eq("id", id);
    await fetchEntries();
  }

  // Compute stats
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const weekEntries = entries.filter(e => e.date >= weekStartStr);
  const monthEntries = entries.filter(e => e.date >= monthStart);
  const hoursThisWeek = weekEntries.reduce((s, e) => s + e.hours, 0);
  const billableAmountWeek = weekEntries.filter(e => e.billable).reduce((s, e) => s + e.hours * e.rate, 0);
  const hoursThisMonth = monthEntries.reduce((s, e) => s + e.hours, 0);
  const billableAmountMonth = monthEntries.filter(e => e.billable).reduce((s, e) => s + e.hours * e.rate, 0);

  // Format elapsed to HH:MM:SS
  const elapsedFormatted = [
    Math.floor(elapsed / 3600).toString().padStart(2, "00"),
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
