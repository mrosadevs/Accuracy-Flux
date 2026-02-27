"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "./use-supabase";

export interface GlobalTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useGlobalTags() {
  const supabase = useSupabase();
  const [tags, setTags] = useState<GlobalTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("global_tags")
      .select("*")
      .order("name");
    setTags((data ?? []) as GlobalTag[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  /** Saves a tag globally if it doesn't already exist (used when adding to a card). */
  async function ensureTag(name: string, defaultColor = "#3b82f6"): Promise<void> {
    if (!supabase) return;
    const exists = tags.some(t => t.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    const { data } = await supabase
      .from("global_tags")
      .upsert({ name, color: defaultColor }, { onConflict: "name" })
      .select()
      .single();
    if (data) setTags(prev => [...prev, data as GlobalTag].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function createTag(name: string, color: string): Promise<GlobalTag | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("global_tags")
      .insert({ name, color })
      .select()
      .single();
    if (error) return null;
    const tag = data as GlobalTag;
    setTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
    return tag;
  }

  async function updateTag(id: string, updates: { name?: string; color?: string }): Promise<void> {
    if (!supabase) return;
    await supabase.from("global_tags").update(updates).eq("id", id);
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  async function deleteTag(id: string): Promise<void> {
    if (!supabase) return;
    await supabase.from("global_tags").delete().eq("id", id);
    setTags(prev => prev.filter(t => t.id !== id));
  }

  return { tags, loading, fetchTags, ensureTag, createTag, updateTag, deleteTag };
}
