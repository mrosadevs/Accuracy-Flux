'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import type { PortalDocument, PortalMessage, Client } from '@/lib/types/database';

export interface PortalWorkItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  type: string;
  business_name: string | null;
}

export function usePortal(clientId?: string) {
  const supabase = useSupabase();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchData = useCallback(async () => {
    if (!configured || !clientId) {
      setDocuments([]);
      setMessages([]);
      setLoading(false);
      return;
    }

    const [{ data: docs }, { data: msgs }] = await Promise.all([
      supabase.from('portal_documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('portal_messages').select('*').eq('client_id', clientId).order('created_at'),
    ]);

    setDocuments(docs ?? []);
    setMessages(msgs ?? []);
    setLoading(false);
  }, [supabase, configured, clientId]);

  useEffect(() => {
    fetchData();
    if (!configured || !clientId) return;
    const channel = supabase
      .channel(`portal-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_messages', filter: `client_id=eq.${clientId}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_documents', filter: `client_id=eq.${clientId}` }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase, configured, clientId]);

  async function uploadDocument(file: File, cid: string, uploadedBy?: string | null, category?: string) {
    if (!configured) return null;
    const filePath = `${cid}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('portal-documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data, error } = await supabase
      .from('portal_documents')
      .insert({
        client_id: cid,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        tags: category ? [category] : [],
        uploaded_by: uploadedBy ?? null,
        description: category ?? null,
      })
      .select().single();
    if (error) throw error;
    await fetchData();
    return data;
  }

  async function deleteDocument(docId: string, filePath: string) {
    if (!configured || !clientId) return;
    // Use service-role API route to bypass RLS (same pattern as delete-portal-messages)
    const res = await fetch('/api/delete-portal-document', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId, filePath, clientId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Failed (${res.status})`);
    }
    await fetchData();
  }

  async function clearMessages(cid: string) {
    if (!configured) return;
    // Use service-role API route (same pattern as delete-thread-messages which works)
    const res = await fetch('/api/delete-portal-messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: cid }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Failed (${res.status})`);
    }
    await fetchData();
  }

  async function getDownloadUrl(filePath: string) {
    if (!configured) return '#';
    const { data } = await supabase.storage.from('portal-documents').createSignedUrl(filePath, 3600);
    return data?.signedUrl ?? '#';
  }

  async function sendMessage(cid: string, message: string, senderName: string, isFromClient: boolean) {
    if (!configured) return null;
    const { data, error } = await supabase
      .from('portal_messages')
      .insert({ client_id: cid, message, sender_name: senderName, is_from_client: isFromClient })
      .select().single();
    if (error) throw error;
    await fetchData();
    return data;
  }

  return { documents, messages, loading, uploadDocument, deleteDocument, clearMessages, getDownloadUrl, sendMessage, refetch: fetchData };
}

// Hook to load the current portal user's linked client + their work items
export function usePortalClient() {
  const supabase = useSupabase();
  const configured = isSupabaseConfigured();
  const [client, setClient] = useState<Client | null>(null);
  const [workItems, setWorkItems] = useState<PortalWorkItem[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Safety timeout: never spin forever if auth request hangs (Edge/Chrome issue)
    const safetyTimer = setTimeout(() => setAuthLoading(false), 6000);

    async function load() {
      if (!configured) { clearTimeout(safetyTimer); setAuthLoading(false); return; }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { clearTimeout(safetyTimer); setAuthLoading(false); return; }

        const { data: profileData } = await supabase
          .from('profiles').select('role').eq('id', user.id).single();
        setUserRole(profileData?.role ?? null);

        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('portal_user_id', user.id)
          .single();

        if (clientData) {
          setClient(clientData);
          // Only show work items explicitly marked as visible in the client portal
          const { data: items } = await supabase
            .from('work_items')
            .select('id, title, status, priority, due_date, type, business_name')
            .eq('client_id', clientData.id)
            .eq('show_in_portal', true)
            .order('created_at', { ascending: false });
          setWorkItems(items ?? []);
        }
      } catch { /* ignore auth errors */ }

      clearTimeout(safetyTimer);
      setAuthLoading(false);
    }
    load();
    return () => clearTimeout(safetyTimer);
  }, [supabase, configured]);

  async function toggleTask(workItemId: string, currentStatus: string) {
    if (!client) return;
    const newStatus = currentStatus === 'completed' ? 'not-started' : 'completed';
    const item = workItems.find(w => w.id === workItemId);
    if (!item) return;

    // Optimistic UI update
    setWorkItems(prev => prev.map(w =>
      w.id === workItemId ? { ...w, status: newStatus } : w
    ));

    const res = await fetch('/api/portal-complete-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workItemId,
        clientId: client.id,
        clientName: client.name,
        workItemTitle: item.title,
        newStatus,
      }),
    });

    if (!res.ok) {
      // Revert on error
      setWorkItems(prev => prev.map(w =>
        w.id === workItemId ? { ...w, status: currentStatus } : w
      ));
    }
  }

  return { client, workItems, authLoading, userRole, toggleTask };
}
