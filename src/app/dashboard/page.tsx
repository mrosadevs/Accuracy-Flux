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

  // Count all non-inactive clients (active, onboarding, or any other live status)
  const activeClients = clients.filter(c => c.status !== 'inactive').length;
  // Count all open work items (anything not completed)
  const workInProgress = workItems.filter(w => w.status !== 'completed').length;

  const now = new Date();
  const monthStart     = new Date(now.getFullYear(), now.getMonth(),     1).toISOString().split('T')[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(),     0).toISOString().split('T')[0];

  // Formal invoices: sent, paid, overdue
  const billableStatuses = ['paid', 'sent', 'overdue'];
  const invoiceThisMonth = invoices.filter(i => billableStatuses.includes(i.status) && i.issued_date >= monthStart).reduce((s, i) => s + i.amount, 0);
  const invoiceLastMonth = invoices.filter(i => billableStatuses.includes(i.status) && i.issued_date >= lastMonthStart && i.issued_date <= lastMonthEnd).reduce((s, i) => s + i.amount, 0);

  // Work item budgets: active/started work created this month (proxy for billed work in progress)
  const activeBudgetStatuses = ['in-progress', 'waiting-on-client', 'in-review', 'completed'];
  const workBudgetThisMonth  = workItems.filter(w => w.budget > 0 && activeBudgetStatuses.includes(w.status) && w.created_at >= monthStart).reduce((s, w) => s + w.budget, 0);
  const workBudgetLastMonth  = workItems.filter(w => w.budget > 0 && activeBudgetStatuses.includes(w.status) && w.created_at >= lastMonthStart && w.created_at <= lastMonthEnd).reduce((s, w) => s + w.budget, 0);

  const revenueThisMonth = invoiceThisMonth + workBudgetThisMonth;
  const revenueLastMonth = invoiceLastMonth + workBudgetLastMonth;

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
          <StatCard title="Open Work Items" value={workInProgress} icon={Briefcase} color="purple" delay={0.1} />
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
