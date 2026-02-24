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

  async function uploadDocument(file: File, cid: string) {
    if (!configured) return null;
    const filePath = `${cid}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('portal-documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data, error } = await supabase
      .from('portal_documents')
      .insert({ client_id: cid, filename: file.name, file_path: filePath, file_size: file.size, mime_type: file.type, tags: [] })
      .select().single();
    if (error) throw error;
    await fetchData();
    return data;
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

  return { documents, messages, loading, uploadDocument, getDownloadUrl, sendMessage, refetch: fetchData };
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
    async function load() {
      if (!configured) { setAuthLoading(false); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthLoading(false); return; }

      // Get profile role for auth guard
      const { data: profileData } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      setUserRole(profileData?.role ?? null);

      // Find the client record linked to this portal user
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('portal_user_id', user.id)
        .single();

      if (clientData) {
        setClient(clientData);
        // Load work items assigned to this client
        const { data: items } = await supabase
          .from('work_items')
          .select('id, title, status, priority, due_date, type')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false });
        setWorkItems(items ?? []);
      }

      setAuthLoading(false);
    }
    load();
  }, [supabase, configured]);

  return { client, workItems, authLoading, userRole };
}
