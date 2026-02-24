'use client';

import { motion } from 'framer-motion';
import { activityFeed, teamMembers } from '@/lib/mock-data';
import { CheckCircle2, FileText, Mail, Briefcase } from 'lucide-react';
import clsx from 'clsx';

const typeIcons = {
  task: CheckCircle2,
  document: FileText,
  email: Mail,
  work: Briefcase,
};

const typeColors = {
  task: 'text-success bg-success/10',
  document: 'text-accent-600 bg-accent-400/10',
  email: 'text-primary-600 bg-primary-100',
  work: 'text-pink-500 bg-pink-500/10',
};

export default function ActivityFeed() {
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
        <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</button>
      </div>

      <div className="space-y-0">
        {activityFeed.map((activity, i) => {
          const Icon = typeIcons[activity.type];
          const team = teamMembers.find(t => t.name === activity.user);

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
                  <span className="font-semibold">{activity.user}</span>
                  {' '}<span className="text-text-secondary">{activity.action}</span>{' '}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-text-muted mt-0.5">{activity.project}</p>
              </div>
              <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">{activity.time}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
