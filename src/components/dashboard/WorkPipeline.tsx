'use client';

import { motion } from 'framer-motion';
import { useWorkItems } from '@/lib/hooks/use-work-items';
import { Clock, AlertTriangle, CheckCircle2, Pause, Play, Briefcase } from 'lucide-react';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; textColor: string }> = {
  'not-started': { label: 'Not Started', color: 'bg-text-muted', icon: Pause, textColor: 'text-text-muted' },
  'in-progress': { label: 'In Progress', color: 'bg-primary-500', icon: Play, textColor: 'text-primary-600' },
  'waiting-on-client': { label: 'Waiting on Client', color: 'bg-warning', icon: Clock, textColor: 'text-warning' },
  'in-review': { label: 'In Review', color: 'bg-accent-500', icon: AlertTriangle, textColor: 'text-accent-600' },
  'completed': { label: 'Completed', color: 'bg-success', icon: CheckCircle2, textColor: 'text-success' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-text-muted/10 text-text-muted' },
  medium: { label: 'Med', color: 'bg-primary-100 text-primary-700' },
  high: { label: 'High', color: 'bg-warning/10 text-warning' },
  urgent: { label: 'Urgent', color: 'bg-danger/10 text-danger' },
};

export default function WorkPipeline() {
  const { workItems, loading } = useWorkItems();
  const visible = workItems.filter(w => w.status !== 'completed').slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="bg-white rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Work Pipeline</h3>
          <p className="text-xs text-text-muted mt-0.5">Active work items across your practice</p>
        </div>
        <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Briefcase className="w-8 h-8 text-text-muted/40 mb-2" />
          <p className="text-sm text-text-muted">No active work items yet</p>
          <p className="text-xs text-text-muted/60 mt-0.5">Create a work item to see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((item, i) => {
            const status = statusConfig[item.status] ?? statusConfig['not-started'];
            const priority = priorityConfig[item.priority] ?? priorityConfig['medium'];
            const completedTasks = item.tasks.filter(t => t.completed).length;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-all cursor-pointer group border border-transparent hover:border-border"
              >
                {/* Progress Ring */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <motion.path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={item.priority === 'urgent' ? '#ef4444' : item.priority === 'high' ? '#f59e0b' : '#3b82f6'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0, 100' }}
                      animate={{ strokeDasharray: `${item.progress}, 100` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-text-primary">
                    {item.progress}%
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                    <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full', priority.color)}>
                      {priority.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-text-muted">{item.client_name}</span>
                    <span className="text-[10px] text-text-muted">
                      {completedTasks}/{item.tasks.length} tasks
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.due_date && (
                    <span className="text-xs text-text-muted hidden lg:block">
                      Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold', status.textColor, 'bg-current/10')}>
                    <div className={clsx('w-1.5 h-1.5 rounded-full', status.color)} />
                    {status.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
