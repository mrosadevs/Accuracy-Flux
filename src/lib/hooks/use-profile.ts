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
    if (!configured) {
      setProfile(MOCK_PROFILE);
      setLoading(false);
      return;
    }

    let mounted = true;
    // Safety net — if nothing resolves in 4s, stop spinner
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    async function fetchProfile(userId: string) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (mounted) setProfile(data ?? null);
      } catch {
        if (mounted) setProfile(null);
      }
    }

    // getSession() reads from the client's memory/cookie store.
    // It's synchronous if the token is fresh (< 1ms), or async if a
    // refresh is needed. Either way it's far more reliable than waiting
    // for the INITIAL_SESSION event, which can misfire with the singleton
    // client pattern used here.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      clearTimeout(safetyTimer);
      if (mounted) setLoading(false);
    });

    // Listen for future auth changes (sign in, token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) fetchProfile(session.user.id);
      } else if (event === 'USER_UPDATED' && session?.user) {
        fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        clearTimeout(safetyTimer);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
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
