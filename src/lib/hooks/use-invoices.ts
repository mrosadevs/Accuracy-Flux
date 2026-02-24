'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import type { Invoice } from '@/lib/types/database';

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1', client_id: '1', invoice_number: 'INV-2026-001',
    amount: 3500, tax_amount: 0, status: 'sent',
    due_date: '2026-03-15', issued_date: '2026-02-15',
    description: '2025 Annual Tax Return preparation',
    line_items: [{ description: 'Tax return preparation', amount: 3500 }],
    created_by: null, created_at: '2026-02-15T00:00:00Z', paid_at: null,
  },
  {
    id: 'inv-2', client_id: '2', invoice_number: 'INV-2026-002',
    amount: 1200, tax_amount: 0, status: 'paid',
    due_date: '2026-03-05', issued_date: '2026-02-05',
    description: 'February bookkeeping services',
    line_items: [{ description: 'Monthly bookkeeping', amount: 1200 }],
    created_by: null, created_at: '2026-02-05T00:00:00Z', paid_at: '2026-02-20T00:00:00Z',
  },
  {
    id: 'inv-3', client_id: '8', invoice_number: 'INV-2026-003',
    amount: 2800, tax_amount: 0, status: 'overdue',
    due_date: '2026-02-20', issued_date: '2026-01-20',
    description: 'Quarterly payroll processing Q1 2026',
    line_items: [{ description: 'Payroll processing', amount: 2800 }],
    created_by: null, created_at: '2026-01-20T00:00:00Z', paid_at: null,
  },
];

let invoiceCounter = mockInvoices.length + 1;

export function useInvoices(clientId?: string) {
  const supabase = useSupabase();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchInvoices = useCallback(async () => {
    if (!configured) {
      const filtered = clientId ? mockInvoices.filter(i => i.client_id === clientId) : mockInvoices;
      setInvoices(filtered);
      setLoading(false);
      return;
    }
    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (clientId) query = query.eq('client_id', clientId);
    const { data } = await query;
    setInvoices(data ?? []);
    setLoading(false);
  }, [supabase, configured, clientId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  async function createInvoice(input: {
    client_id: string;
    amount: number;
    description: string;
    due_date: string;
    line_items?: { description: string; amount: number }[];
    tax_amount?: number;
  }) {
    if (!configured) {
      // Mock: add to local list
      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        client_id: input.client_id,
        invoice_number: `INV-2026-${String(invoiceCounter++).padStart(3, '0')}`,
        amount: input.amount,
        tax_amount: input.tax_amount ?? 0,
        status: 'sent',
        due_date: input.due_date,
        issued_date: new Date().toISOString().split('T')[0],
        description: input.description,
        line_items: input.line_items ?? [],
        created_by: null,
        created_at: new Date().toISOString(),
        paid_at: null,
      };
      mockInvoices.push(newInv);
      await fetchInvoices();
      return newInv;
    }

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
    if (!configured) {
      const inv = mockInvoices.find(i => i.id === id);
      if (inv) {
        inv.status = status;
        if (status === 'paid') inv.paid_at = new Date().toISOString();
      }
      await fetchInvoices();
      return;
    }
    const updates: Partial<Invoice> = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    await supabase.from('invoices').update(updates).eq('id', id);
    await fetchInvoices();
  }

  return { invoices, loading, createInvoice, updateInvoiceStatus, refetch: fetchInvoices };
}
