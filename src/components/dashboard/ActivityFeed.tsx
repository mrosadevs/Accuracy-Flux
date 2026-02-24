'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSupabase, isSupabaseConfigured } from '@/lib/hooks/use-supabase';
import { CheckCircle2, FileText, MessageSquare, Briefcase, Clock } from 'lucide-react';
import clsx from 'clsx';

interface Activity {
  id: string;
  user_name: string;
  action: string;
  target: string | null;
  project: string | null;
  type: 'task' | 'work' | 'document' | 'email';
  created_at: string;
  color: string;
}

const typeIcons = {
  task: CheckCircle2,
  document: FileText,
  email: MessageSquare,
  work: Briefcase,
};

const typeColors = {
  task: 'text-success bg-success/10',
  document: 'text-accent-600 bg-accent-400/10',
  email: 'text-primary-600 bg-primary-100',
  work: 'text-pink-500 bg-pink-500/10',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityFeed() {
  const supabase = useSupabase();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setActivities((data ?? []).map((a: Record<string, unknown>) => ({
          id: a.id as string,
          user_name: (a.user_name as string) ?? 'Someone',
          action: a.action as string,
          target: a.target as string | null,
          project: a.project as string | null,
          type: (a.type as 'task' | 'work' | 'document' | 'email') ?? 'work',
          created_at: a.created_at as string,
          color: '#3b82f6',
        })));
        setLoading(false);
      });
  }, [supabase, configured]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
          <p className="text-xs text-text-muted mt-0.5">Latest updates across your practice</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Clock className="w-8 h-8 text-text-muted/40 mb-2" />
          <p className="text-sm text-text-muted">No activity yet</p>
          <p className="text-xs text-text-muted/60 mt-0.5">Activity will appear as your team works</p>
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((activity, i) => {
            const Icon = typeIcons[activity.type] ?? Briefcase;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                className="flex items-start gap-3 py-3 border-b border-border-light last:border-0 group hover:bg-surface-hover/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeColors[activity.type])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-semibold">{activity.user_name}</span>
                    {' '}<span className="text-text-secondary">{activity.action}</span>
                    {activity.target && <> <span className="font-medium">{activity.target}</span></>}
                  </p>
                  {activity.project && <p className="text-xs text-text-muted mt-0.5">{activity.project}</p>}
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">
                  {timeAgo(activity.created_at)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
