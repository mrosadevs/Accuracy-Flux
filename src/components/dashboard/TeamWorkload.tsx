'use client';

import { motion } from 'framer-motion';
import { workloadData, teamMembers } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-xs text-text-muted">Hours:</span>
            <span className="text-xs font-semibold">{payload[0]?.value}h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-border" />
            <span className="text-xs text-text-muted">Capacity:</span>
            <span className="text-xs font-semibold">{payload[1]?.value}h</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function TeamWorkload() {
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
          <p className="text-xs text-text-muted mt-0.5">Hours tracked vs capacity</p>
        </div>
      </div>

      <div className="space-y-3">
        {workloadData.map((member, i) => {
          const percentage = Math.round((member.hours / member.capacity) * 100);
          const team = teamMembers.find(t => t.name === member.name);
          const isOverloaded = percentage > 90;

          return (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: team?.color || '#94a3b8' }}
                  >
                    {team?.initials || '??'}
                  </div>
                  <span className="text-xs font-medium text-text-primary">{member.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{member.hours}h / {member.capacity}h</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isOverloaded ? 'bg-danger/10 text-danger' : percentage > 70 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    isOverloaded
                      ? 'bg-gradient-to-r from-danger/80 to-danger'
                      : percentage > 70
                        ? 'bg-gradient-to-r from-warning/80 to-warning'
                        : 'bg-gradient-to-r from-primary-400 to-primary-600'
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
