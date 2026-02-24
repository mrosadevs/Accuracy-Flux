'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import type { PortalDocument, PortalMessage } from '@/lib/types/database';

export function usePortal(clientId?: string) {
  const supabase = useSupabase();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchData = useCallback(async () => {
    if (!configured) {
      setDocuments([]);
      setMessages([]);
      setLoading(false);
      return;
    }

    const id = clientId ?? 'portal';

    const [{ data: docs }, { data: msgs }] = await Promise.all([
      supabase.from('portal_documents').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('portal_messages').select('*').eq('client_id', id).order('created_at'),
    ]);

    setDocuments(docs ?? []);
    setMessages(msgs ?? []);
    setLoading(false);
  }, [supabase, configured, clientId]);

  useEffect(() => {
    fetchData();
    if (!configured) return;
    const id = clientId ?? 'portal';
    const channel = supabase
      .channel(`portal-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_messages', filter: `client_id=eq.${id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_documents', filter: `client_id=eq.${id}` }, fetchData)
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
