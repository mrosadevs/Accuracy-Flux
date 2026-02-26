'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import type { Invoice } from '@/lib/types/database';

export function useInvoices(clientId?: string) {
  const supabase = useSupabase();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchInvoices = useCallback(async () => {
    if (!configured) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    let query = supabase
      .from('invoices')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    if (clientId) query = query.eq('client_id', clientId);
    const { data } = await query;
    setInvoices(data ?? []);
    setLoading(false);
  }, [supabase, configured, clientId]);

  useEffect(() => {
    fetchInvoices();
    if (!configured) return;
    const channel = supabase
      .channel('invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchInvoices)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchInvoices, supabase, configured]);

  async function createInvoice(input: {
    client_id: string;
    amount: number;
    description: string;
    due_date: string;
    line_items?: { description: string; amount: number }[];
    tax_amount?: number;
  }) {
    if (!configured) return null;
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        client_id: input.client_id,
        amount: input.amount,
        tax_amount: input.tax_amount ?? 0,
        description: input.description,
        due_date: input.due_date,
        issued_date: new Date().toISOString().split('T')[0],
        status: 'sent',
        line_items: input.line_items ?? [],
      })
      .select()
      .single();
    if (error) throw error;
    await fetchInvoices();
    return data;
  }

  async function updateInvoiceStatus(id: string, status: Invoice['status']) {
    if (!configured) return;
    const updates: Partial<Invoice> = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    await supabase.from('invoices').update(updates).eq('id', id);
    await fetchInvoices();
  }

  const outstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + i.amount, 0);

  return { invoices, loading, createInvoice, updateInvoiceStatus, outstanding, refetch: fetchInvoices };
}
