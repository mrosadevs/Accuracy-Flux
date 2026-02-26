'use client';

import { useState, useEffect } from 'react';
import { useSupabase, isSupabaseConfigured } from './use-supabase';

export interface Profile {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'staff' | 'client';
  initials: string | null;
  color: string | null;
  avatar_url: string | null;
  created_at: string;
}

// Mock profile for when Supabase isn't connected
const MOCK_PROFILE: Profile = {
  id: 'mock-user-id',
  name: 'Admin User',
  role: 'owner',
  initials: 'AU',
  color: '#3b82f6',
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export function useProfile() {
  const supabase = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    // Safety timeout: never show spinner forever (Edge/Chrome auth hangs)
    const safetyTimer = setTimeout(() => setLoading(false), 6000);

    async function load() {
      if (!configured) {
        clearTimeout(safetyTimer);
        setProfile(MOCK_PROFILE);
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { clearTimeout(safetyTimer); setLoading(false); return; }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(data ?? null);
      } catch { /* ignore auth errors */ }
      clearTimeout(safetyTimer);
      setLoading(false);
    }

    load();

    if (!configured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => { clearTimeout(safetyTimer); subscription.unsubscribe(); };
  }, [supabase, configured]);

  async function updateProfile(updates: Partial<Profile>) {
    if (!configured || !profile) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
    if (error) throw error;
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }

  const isOwner = profile?.role === 'owner';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const isStaff = isAdmin || profile?.role === 'staff';

  return { profile, loading, updateProfile, isOwner, isAdmin, isStaff };
}

export function useTeamMembers() {
  const supabase = useSupabase();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    async function load() {
      if (!configured) {
        setMembers([
          { id: '1', name: 'Sarah Chen', role: 'owner', initials: 'SC', color: '#8b5cf6', avatar_url: null, created_at: '' },
          { id: '2', name: 'Marcus Rivera', role: 'staff', initials: 'MR', color: '#3b82f6', avatar_url: null, created_at: '' },
          { id: '3', name: 'Emily Watson', role: 'staff', initials: 'EW', color: '#ec4899', avatar_url: null, created_at: '' },
        ]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['owner', 'admin', 'staff'])
        .order('name');
      setMembers(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, configured]);

  async function updateMemberRole(memberId: string, role: Profile['role']) {
    if (!configured) return;
    const { error } = await supabase.from('profiles').update({ role }).eq('id', memberId);
    if (error) throw error;
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  }

  async function inviteStaff(email: string, name: string, role: Profile['role']) {
    const res = await fetch('/api/invite-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Failed to send invite');
    }
  }

  return { members, loading, updateMemberRole, inviteStaff };
}
