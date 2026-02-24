'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion } from 'framer-motion';
import { workItems, teamMembers, workloadData } from '@/lib/mock-data';
import {
  Play, Pause, Clock, DollarSign, TrendingUp, Calendar,
  Plus, Filter, ChevronDown, FileText, Send, MoreHorizontal,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

const timeEntries = [
  { id: 1, task: 'Tax return preparation', client: 'Johnson & Associates LLC', duration: '2:30', amount: 375.00, date: '2026-02-23', status: 'billable', user: 'Sarah Chen' },
  { id: 2, task: 'Bank reconciliation', client: 'Garcia Restaurants Inc', duration: '1:45', amount: 218.75, date: '2026-02-23', status: 'billable', user: 'Emily Watson' },
  { id: 3, task: 'Payroll processing', client: 'Hassan Medical Group', duration: '3:00', amount: 525.00, date: '2026-02-22', status: 'billable', user: 'David Park' },
  { id: 4, task: 'Client onboarding call', client: 'Wei Technologies', duration: '0:45', amount: 131.25, date: '2026-02-22', status: 'billable', user: 'David Park' },
  { id: 5, task: 'Tax deduction research', client: 'Johnson & Associates LLC', duration: '1:15', amount: 187.50, date: '2026-02-21', status: 'billable', user: 'Marcus Rivera' },
  { id: 6, task: 'Internal team meeting', client: '', duration: '0:30', amount: 0, date: '2026-02-21', status: 'non-billable', user: 'Sarah Chen' },
  { id: 7, task: 'Document review', client: 'Patricia Brown', duration: '1:00', amount: 150.00, date: '2026-02-21', status: 'billable', user: 'Sarah Chen' },
];

const invoices = [
  { id: 'INV-001', client: 'Johnson & Associates LLC', amount: 4500, status: 'paid', date: '2026-02-01', dueDate: '2026-02-15' },
  { id: 'INV-002', client: 'Garcia Restaurants Inc', amount: 1200, status: 'sent', date: '2026-02-05', dueDate: '2026-02-19' },
  { id: 'INV-003', client: 'Hassan Medical Group', amount: 2800, status: 'overdue', date: '2026-01-20', dueDate: '2026-02-03' },
  { id: 'INV-004', client: 'Smith Consulting', amount: 3200, status: 'draft', date: '2026-02-20', dueDate: '2026-03-06' },
  { id: 'INV-005', client: 'Davis Properties', amount: 1800, status: 'paid', date: '2026-01-15', dueDate: '2026-01-29' },
];

const statusColors: Record<string, string> = {
  paid: 'bg-success/10 text-success',
  sent: 'bg-primary-50 text-primary-600',
  overdue: 'bg-danger/10 text-danger',
  draft: 'bg-text-muted/10 text-text-muted',
};

export default function TimeBillingPage() {
  const [activeTab, setActiveTab] = useState<'time' | 'invoices'>('time');
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  return (
    <AppShell title="Time & Billing" subtitle="Track time and manage invoices">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Hours This Week', value: '43.2h', icon: Clock, color: 'text-primary-600 bg-primary-50', change: '+12%' },
            { label: 'Billable Amount', value: '$6,487', icon: DollarSign, color: 'text-success bg-success/10', change: '+8%' },
            { label: 'Utilization', value: '78%', icon: TrendingUp, color: 'text-accent-600 bg-accent-400/10', change: '+5%' },
            { label: 'Outstanding', value: '$29,500', icon: AlertCircle, color: 'text-warning bg-warning/10', change: '-3%' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-border p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', stat.change.startsWith('+') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                  {stat.change}
                </span>
              </div>
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-[10px] text-text-muted font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Active Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </motion.button>
              <div>
                <p className="text-sm opacity-80 font-medium">Currently tracking</p>
                <p className="text-lg font-bold">Tax return preparation - Johnson & Associates LLC</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-mono font-bold tracking-wider">02:34:15</p>
              <p className="text-sm opacity-70 mt-0.5">$375.00 estimated</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-border">
          {[
            { id: 'time' as const, label: 'Time Entries', icon: Clock },
            { id: 'invoices' as const, label: 'Invoices', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'time' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-border overflow-hidden"
          >
            <div className="grid grid-cols-[2fr,1.5fr,0.8fr,0.8fr,0.8fr,0.6fr,auto] gap-4 px-5 py-3 bg-surface-hover/50 border-b border-border">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Task</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Client</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Duration</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Amount</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Date</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Status</span>
              <span className="w-8"></span>
            </div>
            {timeEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr,1.5fr,0.8fr,0.8fr,0.8fr,0.6fr,auto] gap-4 px-5 py-3.5 border-b border-border-light hover:bg-surface-hover/50 transition-colors cursor-pointer items-center"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
                    {entry.user.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{entry.task}</p>
                    <p className="text-[10px] text-text-muted">{entry.user}</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary">{entry.client || '-'}</p>
                <p className="text-sm font-mono font-semibold text-text-primary">{entry.duration}</p>
                <p className="text-sm font-semibold text-text-primary">{entry.amount > 0 ? `$${entry.amount.toFixed(2)}` : '-'}</p>
                <p className="text-xs text-text-muted">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', entry.status === 'billable' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted')}>
                  {entry.status}
                </span>
                <button className="p-1 hover:bg-surface-hover rounded">
                  <MoreHorizontal className="w-4 h-4 text-text-muted" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-border overflow-hidden"
          >
            <div className="grid grid-cols-[0.8fr,2fr,1fr,1fr,1fr,0.8fr,auto] gap-4 px-5 py-3 bg-surface-hover/50 border-b border-border">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Invoice</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Client</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Amount</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Date</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Due Date</span>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Status</span>
              <span className="w-8"></span>
            </div>
            {invoices.map((invoice, i) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[0.8fr,2fr,1fr,1fr,1fr,0.8fr,auto] gap-4 px-5 py-3.5 border-b border-border-light hover:bg-surface-hover/50 transition-colors cursor-pointer items-center"
              >
                <p className="text-sm font-mono font-semibold text-primary-600">{invoice.id}</p>
                <p className="text-sm font-medium text-text-primary">{invoice.client}</p>
                <p className="text-sm font-bold text-text-primary">${invoice.amount.toLocaleString()}</p>
                <p className="text-xs text-text-muted">{new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <p className="text-xs text-text-muted">{new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', statusColors[invoice.status])}>
                  {invoice.status}
                </span>
                <button className="p-1 hover:bg-surface-hover rounded">
                  <MoreHorizontal className="w-4 h-4 text-text-muted" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
