'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import type { PortalDocument, PortalMessage } from '@/lib/types/database';

const mockDocs: PortalDocument[] = [
  { id: 'd1', client_id: 'portal', filename: 'W-2 Form 2025.pdf', file_path: '', file_size: 245000, mime_type: 'application/pdf', uploaded_by: null, description: null, tags: ['W-2', 'Tax'], created_at: '2026-02-10T00:00:00Z' },
  { id: 'd2', client_id: 'portal', filename: 'Bank Statement Q4.pdf', file_path: '', file_size: 512000, mime_type: 'application/pdf', uploaded_by: null, description: null, tags: ['Banking'], created_at: '2026-02-08T00:00:00Z' },
];

const mockMessages: PortalMessage[] = [
  { id: 'm1', client_id: 'portal', sender_id: null, sender_name: 'Sarah Chen', message: 'Hi! Welcome to your client portal. Please upload your W-2 forms when you get a chance. Let me know if you need any help!', is_from_client: false, read_at: null, created_at: '2026-02-20T10:00:00Z' },
  { id: 'm2', client_id: 'portal', sender_id: null, sender_name: 'You', message: "Thanks! I've uploaded the W-2 and the bank statement. Let me know if you need anything else.", is_from_client: true, read_at: '2026-02-20T11:00:00Z', created_at: '2026-02-20T10:30:00Z' },
];

export function usePortal(clientId?: string) {
  const supabase = useSupabase();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchData = useCallback(async () => {
    if (!configured) {
      setDocuments(mockDocs);
      setMessages(mockMessages);
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

  async function uploadDocument(file: File, clientId: string) {
    if (!configured) {
      // Mock upload
      const newDoc: PortalDocument = {
        id: `doc-${Date.now()}`,
        client_id: clientId,
        filename: file.name,
        file_path: '',
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: null,
        description: null,
        tags: [],
        created_at: new Date().toISOString(),
      };
      mockDocs.unshift(newDoc);
      await fetchData();
      return newDoc;
    }

    const filePath = `${clientId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('portal-documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('portal_documents')
      .insert({
        client_id: clientId,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        tags: [],
      })
      .select().single();

    if (error) throw error;
    await fetchData();
    return data;
  }

  async function getDownloadUrl(filePath: string) {
    if (!configured) return '#';
    const { data } = await supabase.storage
      .from('portal-documents')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl ?? '#';
  }

  async function sendMessage(clientId: string, message: string, senderName: string, isFromClient: boolean) {
    if (!configured) {
      const newMsg: PortalMessage = {
        id: `msg-${Date.now()}`,
        client_id: clientId,
        sender_id: null,
        sender_name: senderName,
        message,
        is_from_client: isFromClient,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      mockMessages.push(newMsg);
      await fetchData();
      return newMsg;
    }

    const { data, error } = await supabase
      .from('portal_messages')
      .insert({ client_id: clientId, message, sender_name: senderName, is_from_client: isFromClient })
      .select().single();
    if (error) throw error;
    await fetchData();
    return data;
  }

  return { documents, messages, loading, uploadDocument, getDownloadUrl, sendMessage, refetch: fetchData };
}
