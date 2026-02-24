"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase, isSupabaseConfigured } from "./use-supabase";
import { useProfile } from "./use-profile";

export interface InternalThread {
  id: string;
  title: string;
  created_by: string | null;
  creator_name: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
}

export interface InternalMessage {
  id: string;
  thread_id: string;
  sender_id: string | null;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface PortalNotification {
  id: string;
  client_id: string;
  client_name: string;
  sender_name: string | null;
  message: string;
  created_at: string;
  read_at: string | null;
}

export function useTriage() {
  const supabase = useSupabase();
  const { profile } = useProfile();
  const [threads, setThreads] = useState<InternalThread[]>([]);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [portalNotifications, setPortalNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const fetchThreads = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const { data } = await supabase
      .from("internal_threads")
      .select("*")
      .order("last_message_at", { ascending: false });
    setThreads(data ?? []);
  }, [supabase, configured]);

  const fetchMessages = useCallback(async (threadId: string) => {
    if (!configured) return;
    const { data } = await supabase
      .from("internal_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at");
    setMessages(data ?? []);
  }, [supabase, configured]);

  const fetchPortalNotifications = useCallback(async () => {
    if (!configured) return;
    const { data } = await supabase
      .from("portal_messages")
      .select("*, clients(name)")
      .eq("is_from_client", true)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) {
      setPortalNotifications(data.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        client_id: m.client_id as string,
        client_name: (m.clients as { name?: string } | null)?.name ?? "Unknown Client",
        sender_name: m.sender_name as string | null,
        message: m.message as string,
        created_at: m.created_at as string,
        read_at: m.read_at as string | null,
      })));
    }
  }, [supabase, configured]);

  useEffect(() => {
    const init = async () => {
      await fetchThreads();
      await fetchPortalNotifications();
      setLoading(false);
    };
    init();
    if (!configured) return;
    const channel = supabase
      .channel("triage-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "internal_threads" }, fetchThreads)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "portal_messages" }, fetchPortalNotifications)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads, fetchPortalNotifications, supabase, configured]);

  useEffect(() => {
    if (!selectedThreadId) { setMessages([]); return; }
    fetchMessages(selectedThreadId);
    if (!configured) return;
    const channel = supabase
      .channel(`thread-msgs-${selectedThreadId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "internal_messages",
        filter: `thread_id=eq.${selectedThreadId}`,
      }, () => fetchMessages(selectedThreadId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedThreadId, fetchMessages, supabase, configured]);

  async function createThread(title: string, firstMessage: string) {
    if (!configured || !profile) return null;
    const { data: thread, error } = await supabase
      .from("internal_threads")
      .insert({
        title,
        created_by: profile.id,
        creator_name: profile.name,
        last_message_preview: firstMessage.slice(0, 120),
        last_message_at: new Date().toISOString(),
      })
      .select().single();
    if (error) throw error;
    await supabase.from("internal_messages").insert({
      thread_id: thread.id,
      sender_id: profile.id,
      sender_name: profile.name,
      content: firstMessage,
    });
    await fetchThreads();
    setSelectedThreadId(thread.id);
    return thread;
  }

  async function sendMessage(threadId: string, content: string) {
    if (!configured || !profile) return;
    await supabase.from("internal_messages").insert({
      thread_id: threadId,
      sender_id: profile.id,
      sender_name: profile.name,
      content,
    });
    await supabase.from("internal_threads").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.slice(0, 120),
    }).eq("id", threadId);
    // Mark as read since we just sent the message (we're actively in the thread)
    try {
      localStorage.setItem(`af_read_thread_${threadId}`, new Date().toISOString());
      window.dispatchEvent(new CustomEvent("af-thread-read", { detail: { threadId } }));
    } catch { /* ignore */ }
    await fetchMessages(threadId);
    await fetchThreads();
  }

  async function deleteThread(threadId: string) {
    // Use server-side API route to bypass RLS restrictions
    const res = await fetch('/api/delete-thread', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? 'Failed to delete thread');
    }
    if (selectedThreadId === threadId) setSelectedThreadId(null);
    await fetchThreads();
  }

  async function renameThread(threadId: string, newTitle: string) {
    if (!newTitle.trim()) return;
    if (!configured) {
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title: newTitle } : t));
      return;
    }
    const { error } = await supabase.from("internal_threads").update({ title: newTitle }).eq("id", threadId);
    if (error) throw error;
    await fetchThreads();
  }

  async function markPortalRead(messageId: string) {
    if (!configured) return;
    await supabase
      .from("portal_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
    await fetchPortalNotifications();
  }

  async function bumpPortalMessage(clientId: string, clientName: string, originalMessage: string) {
    if (!configured || !profile) return;
    await supabase.from("portal_messages").insert({
      client_id: clientId,
      sender_id: profile.id,
      sender_name: `📌 Bumped by ${profile.name}`,
      message: `[Bumped] ${originalMessage.slice(0, 100)}`,
      is_from_client: true,
      read_at: null,
    });
    await fetchPortalNotifications();
  }

  async function bumpThread(threadId: string) {
    if (!configured || !profile) return;
    const bumpMsg = `⚡ Bumped by ${profile.name} — this thread needs attention`;
    await supabase.from("internal_messages").insert({
      thread_id: threadId,
      sender_id: profile.id,
      sender_name: profile.name,
      content: bumpMsg,
    });
    await supabase.from("internal_threads").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: bumpMsg,
    }).eq("id", threadId);
    await fetchMessages(threadId);
    await fetchThreads();
  }

  // Marks a thread as read in localStorage and notifies useNotifications
  function selectThread(threadId: string | null) {
    setSelectedThreadId(threadId);
    if (threadId) {
      try {
        localStorage.setItem(`af_read_thread_${threadId}`, new Date().toISOString());
        window.dispatchEvent(new CustomEvent("af-thread-read", { detail: { threadId } }));
      } catch { /* ignore */ }
    }
  }

  const unreadPortalCount = portalNotifications.filter(n => !n.read_at).length;

  return {
    threads, messages, portalNotifications, loading,
    selectedThreadId, setSelectedThreadId, selectThread,
    createThread, sendMessage, deleteThread, renameThread, markPortalRead, bumpPortalMessage, bumpThread,
    unreadPortalCount,
    refetchThreads: fetchThreads,
  };
}
