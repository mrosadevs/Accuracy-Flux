'use client';

import AppShell from '@/components/layout/AppShell';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TeamWorkload from '@/components/dashboard/TeamWorkload';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import WorkPipeline from '@/components/dashboard/WorkPipeline';
import { useClients } from '@/lib/hooks/use-clients';
import { useWorkItems } from '@/lib/hooks/use-work-items';
import { useInvoices } from '@/lib/hooks/use-invoices';
import { useTimeEntries } from '@/lib/hooks/use-time-entries';
import { Users, Briefcase, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { clients } = useClients();
  const { workItems } = useWorkItems();
  const { invoices } = useInvoices();
  const { hoursThisWeek } = useTimeEntries();

  const activeClients = clients.filter(c => c.status === 'active').length;
  const workInProgress = workItems.filter(w => w.status === 'in-progress').length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const revenueThisMonth = invoices
    .filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= monthStart)
    .reduce((s, i) => s + i.amount, 0);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  const revenueLastMonth = invoices
    .filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= lastMonthStart && i.paid_at <= lastMonthEnd)
    .reduce((s, i) => s + i.amount, 0);

  const revenueGrowth = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : 0;

  return (
    <AppShell title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
      <div className="space-y-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Active Clients" value={activeClients} icon={Users} color="blue" delay={0} />
          <StatCard
            title="Revenue This Month"
            value={revenueThisMonth}
            change={revenueGrowth}
            changeLabel="vs last month"
            icon={DollarSign}
            color="green"
            format="currency"
            delay={0.05}
          />
          <StatCard title="Work In Progress" value={workInProgress} icon={Briefcase} color="purple" delay={0.1} />
          <StatCard title="Hours This Week" value={Math.round(hoursThisWeek * 10) / 10} icon={Clock} color="pink" delay={0.15} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><RevenueChart /></div>
          <TeamWorkload />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><WorkPipeline /></div>
          <ActivityFeed />
        </div>
      </div>
    </AppShell>
  );
}
