"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";

export interface AppNotification {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  href: string;
}

export function useNotifications() {
  const supabase = useSupabase();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const configured = isSupabaseConfigured();

  const fetchNotifications = useCallback(async () => {
    if (!configured) return;
    const { data } = await supabase
      .from("portal_messages")
      .select("*, clients(name)")
      .eq("is_from_client", true)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      setNotifications(data.map((m: Record<string, unknown>) => {
        const clientName = (m.clients as { name?: string } | null)?.name ?? "Unknown Client";
        const diff = Date.now() - new Date(m.created_at as string).getTime();
        const mins = Math.floor(diff / 60000);
        const timeStr = mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
        return {
          id: m.id as string,
          title: `Message from ${clientName}`,
          subtitle: ((m.message as string) || "").slice(0, 60) + (((m.message as string) || "").length > 60 ? "..." : ""),
          time: timeStr,
          read: !!(m.read_at as string | null),
          href: "/email",
        };
      }));
    }
  }, [supabase, configured]);

  useEffect(() => {
    fetchNotifications();
    if (!configured) return;
    const channel = supabase
      .channel("notifications-topbar")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_messages" }, fetchNotifications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications, supabase, configured]);

  async function markAllRead() {
    if (!configured) return;
    await supabase
      .from("portal_messages")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("is_from_client", true);
    await fetchNotifications();
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications };
}
