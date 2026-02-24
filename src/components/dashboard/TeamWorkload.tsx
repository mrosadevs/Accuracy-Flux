'use client';

import { motion } from 'framer-motion';
import { useTeamMembers } from '@/lib/hooks/use-profile';
import { useTimeEntries } from '@/lib/hooks/use-time-entries';
import { Users } from 'lucide-react';

export default function TeamWorkload() {
  const { members, loading: membersLoading } = useTeamMembers();
  const { entries, loading: entriesLoading } = useTimeEntries();

  const loading = membersLoading || entriesLoading;

  // Compute hours per member this week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const staffMembers = members.filter(m => m.role !== 'client');

  const workload = staffMembers.map(member => {
    const memberEntries = entries.filter(e => e.user_id === member.id && e.date >= weekStartStr);
    const hours = memberEntries.reduce((s, e) => s + e.hours, 0);
    return { ...member, hours: Math.round(hours * 10) / 10, capacity: 40 };
  }).filter(m => m.hours > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Team Workload</h3>
          <p className="text-xs text-text-muted mt-0.5">Hours tracked this week</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : workload.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="w-8 h-8 text-text-muted/40 mb-2" />
          <p className="text-sm text-text-muted">No time tracked this week</p>
          <p className="text-xs text-text-muted/60 mt-0.5">Workload will appear as your team logs hours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workload.map((member, i) => {
            const percentage = Math.min(Math.round((member.hours / member.capacity) * 100), 100);
            const isOverloaded = percentage > 90;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: member.color || '#94a3b8' }}
                    >
                      {member.initials || member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-text-primary">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{member.hours}h / {member.capacity}h</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isOverloaded ? 'bg-danger/10 text-danger' : percentage > 70 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isOverloaded ? 'bg-gradient-to-r from-danger/80 to-danger' : percentage > 70 ? 'bg-gradient-to-r from-warning/80 to-warning' : 'bg-gradient-to-r from-primary-400 to-primary-600'}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
