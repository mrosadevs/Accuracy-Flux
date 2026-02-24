'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';
import { clients as mockClients } from '@/lib/mock-data';
import type { Client } from '@/lib/types/database';

// Adapter: convert mock data shape to DB shape
function adaptMockClient(m: (typeof mockClients)[0]): Client {
  return {
    id: m.id,
    name: m.name,
    company: m.company,
    email: m.email,
    phone: m.phone,
    status: m.status,
    type: m.type,
    assigned_to_id: null,
    assigned_to: m.assignedTo,
    tags: m.tags,
    total_billed: m.totalBilled,
    outstanding_balance: m.outstandingBalance,
    last_activity: m.lastActivity,
    portal_user_id: null,
    created_at: new Date().toISOString(),
  };
}

export function useClients() {
  const supabase = useSupabase();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  const fetchClients = useCallback(async () => {
    if (!configured) {
      setClients(mockClients.map(adaptMockClient));
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('clients').select('*').order('name');
    setClients(data ?? []);
    setLoading(false);
  }, [supabase, configured]);

  useEffect(() => {
    fetchClients();

    if (!configured) return;

    const channel = supabase
      .channel('clients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, fetchClients)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchClients, supabase, configured]);

  async function addClient(input: Partial<Client>) {
    if (!configured) return null;
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: input.name ?? '',
        company: input.company ?? '',
        email: input.email ?? '',
        phone: input.phone ?? '',
        status: input.status ?? 'active',
        type: input.type ?? 'individual',
        assigned_to: input.assigned_to ?? '',
        tags: input.tags ?? [],
        total_billed: 0,
        outstanding_balance: 0,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    await fetchClients();
    return data;
  }

  async function updateClient(id: string, updates: Partial<Client>) {
    if (!configured) return;
    const { error } = await supabase.from('clients').update(updates).eq('id', id);
    if (error) throw error;
    await fetchClients();
  }

  async function deleteClient(id: string) {
    if (!configured) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    await fetchClients();
  }

  return { clients, loading, addClient, updateClient, deleteClient, refetch: fetchClients };
}
