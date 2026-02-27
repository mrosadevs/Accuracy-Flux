'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTeamMembers } from '@/lib/hooks/use-profile';
import { useTimeEntries } from '@/lib/hooks/use-time-entries';
import { useWorkItems } from '@/lib/hooks/use-work-items';
import { Users, TrendingUp } from 'lucide-react';

export default function TeamWorkload() {
  const { members, loading: membersLoading } = useTeamMembers();
  const { entries, loading: entriesLoading } = useTimeEntries();
  const { workItems, loading: workItemsLoading } = useWorkItems();

  const loading = membersLoading || entriesLoading || workItemsLoading;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthStartTs = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const staffMembers = members.filter(m => m.role !== 'client');

  // Total fees received this month (from kanban cards with payment_status = 'received')
  const totalReceivedThisMonth = useMemo(() =>
    workItems
      .filter(w =>
        w.payment_status === 'received' &&
        w.budget > 0 &&
        w.payment_received_at &&
        w.payment_received_at >= monthStartTs
      )
      .reduce((s, w) => s + w.budget, 0),
    [workItems, monthStartTs]
  );

  // All time entries this month across the whole team
  const monthEntries = useMemo(() =>
    entries.filter(e => e.date >= monthStart),
    [entries, monthStart]
  );

  const totalHoursThisMonth = useMemo(() =>
    monthEntries.reduce((s, e) => s + e.hours, 0),
    [monthEntries]
  );

  // Firm-wide revenue per hour
  const firmRatePerHour = totalHoursThisMonth > 0
    ? totalReceivedThisMonth / totalHoursThisMonth
    : 0;

  // Per-employee stats this month
  const workload = useMemo(() => staffMembers.map(member => {
    const memberEntries = monthEntries.filter(e => e.user_id === member.id);
    const hours = Math.round(memberEntries.reduce((s, e) => s + e.hours, 0) * 10) / 10;
    // Revenue attribution: pro-rata share based on hours logged
    const revenueContribution = totalHoursThisMonth > 0
      ? (hours / totalHoursThisMonth) * totalReceivedThisMonth
      : 0;
    return { ...member, hours, revenueContribution };
  }).filter(m => m.hours > 0), [staffMembers, monthEntries, totalHoursThisMonth, totalReceivedThisMonth]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Team Workload</h3>
          <p className="text-xs text-text-muted mt-0.5">Hours logged this month</p>
        </div>
        {firmRatePerHour > 0 && (
          <div className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200">
            <TrendingUp className="w-3 h-3" />
            ${Math.round(firmRatePerHour)}/hr avg
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : workload.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="w-8 h-8 text-text-muted/40 mb-2" />
          <p className="text-sm text-text-muted">No time tracked this month</p>
          <p className="text-xs text-text-muted/60 mt-0.5">Workload will appear as your team logs hours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workload.map((member, i) => {
            const maxHours = Math.max(...workload.map(m => m.hours), 1);
            const barPct = Math.round((member.hours / maxHours) * 100);

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: member.color || '#94a3b8' }}
                    >
                      {member.initials || member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-text-primary truncate">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-text-muted font-medium">{member.hours}h</span>
                    {member.revenueContribution > 0 && (
                      <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                        ${Math.round(member.revenueContribution).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Totals row */}
          {workload.length > 1 && (
            <div className="pt-2 mt-1 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-text-muted font-medium">Total this month</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted">{Math.round(totalHoursThisMonth * 10) / 10}h</span>
                {totalReceivedThisMonth > 0 && (
                  <span className="text-[10px] font-semibold text-green-700">
                    ${totalReceivedThisMonth.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
