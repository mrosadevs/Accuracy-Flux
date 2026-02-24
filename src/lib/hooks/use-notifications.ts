"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";

export interface AppNotification {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  href: string;
}

interface RawThread {
  id: string;
  title: string;
  last_message_at: string;
  last_message_preview: string | null;
}

function formatAgo(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export function useNotifications() {
  const supabase = useSupabase();
  const [portalItems, setPortalItems] = useState<AppNotification[]>([]);
  const [threads, setThreads] = useState<RawThread[]>([]);
  // Bumped whenever a thread is marked read — forces useMemo to re-evaluate localStorage
  const [threadReadTick, setThreadReadTick] = useState(0);
  const configured = isSupabaseConfigured();

  // ── Portal messages ───────────────────────────────────────────────────────
  const fetchPortal = useCallback(async () => {
    if (!configured) return;
    const { data } = await supabase
      .from("portal_messages")
      .select("*, clients(name)")
      .eq("is_from_client", true)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      setPortalItems(data.map((m: Record<string, unknown>) => {
        const clientName = (m.clients as { name?: string } | null)?.name ?? "Unknown Client";
        return {
          id: m.id as string,
          title: `Message from ${clientName}`,
          subtitle: ((m.message as string) || "").slice(0, 60) + (((m.message as string) || "").length > 60 ? "…" : ""),
          time: formatAgo(m.created_at as string),
          read: !!(m.read_at as string | null),
          href: "/portals",
        };
      }));
    }
  }, [supabase, configured]);

  // ── Internal threads ──────────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    if (!configured) return;
    const { data } = await supabase
      .from("internal_threads")
      .select("id, title, last_message_at, last_message_preview")
      .order("last_message_at", { ascending: false })
      .limit(20);
    setThreads((data ?? []) as RawThread[]);
  }, [supabase, configured]);

  useEffect(() => {
    fetchPortal();
    fetchThreads();
    if (!configured) return;
    const ch = supabase
      .channel("notifications-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_messages" }, fetchPortal)
      .on("postgres_changes", { event: "*", schema: "public", table: "internal_threads" }, fetchThreads)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "internal_messages" }, fetchThreads)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchPortal, fetchThreads, supabase, configured]);

  // Listen for thread-read events dispatched by useTriage's selectThread
  useEffect(() => {
    const handler = () => setThreadReadTick(t => t + 1);
    window.addEventListener("af-thread-read", handler);
    return () => window.removeEventListener("af-thread-read", handler);
  }, []);

  // ── Unread thread notifications ───────────────────────────────────────────
  // Re-evaluates when threads data changes OR when threadReadTick bumps
  const threadNotifs = useMemo((): AppNotification[] => {
    return threads
      .filter(t => {
        if (!t.last_message_preview) return false;
        try {
          const seen = localStorage.getItem(`af_read_thread_${t.id}`);
          if (!seen) return true; // never opened
          return new Date(t.last_message_at) > new Date(seen);
        } catch { return false; }
      })
      .map(t => ({
        id: `thread_${t.id}`,
        title: t.title,
        subtitle: t.last_message_preview ?? "New message",
        time: formatAgo(t.last_message_at),
        read: false,
        href: "/email",
      }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, threadReadTick]);

  // Thread notifications first, then portal messages
  const notifications: AppNotification[] = [...threadNotifs, ...portalItems];
  const unreadCount = notifications.filter(n => !n.read).length;

  async function markAllRead() {
    if (!configured) return;
    await supabase
      .from("portal_messages")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("is_from_client", true);
    const now = new Date().toISOString();
    try { threads.forEach(t => localStorage.setItem(`af_read_thread_${t.id}`, now)); } catch { /* ignore */ }
    setThreadReadTick(t => t + 1);
    await fetchPortal();
  }

  return { notifications, unreadCount, markAllRead, refetch: fetchPortal };
}
