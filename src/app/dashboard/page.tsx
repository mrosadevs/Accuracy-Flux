'use client';

import AppShell from '@/components/layout/AppShell';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TeamWorkload from '@/components/dashboard/TeamWorkload';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import WorkPipeline from '@/components/dashboard/WorkPipeline';
import { dashboardStats } from '@/lib/mock-data';
import {
  Users, Briefcase, DollarSign, Clock,
  TrendingUp, CheckCircle2, Timer, Mail
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Welcome back! Here's what's happening today.">
      <div className="space-y-6 max-w-[1800px] mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-4 gap-4">
          <StatCard
            title="Active Clients"
            value={dashboardStats.activeClients}
            change={8}
            icon={Users}
            color="blue"
            delay={0}
          />
          <StatCard
            title="Revenue This Month"
            value={dashboardStats.revenue}
            change={dashboardStats.revenueGrowth}
            changeLabel="vs last month"
            icon={DollarSign}
            color="green"
            format="currency"
            delay={0.05}
          />
          <StatCard
            title="Work In Progress"
            value={dashboardStats.workInProgress}
            icon={Briefcase}
            color="purple"
            delay={0.1}
          />
          <StatCard
            title="Utilization Rate"
            value={dashboardStats.utilizationRate}
            change={5}
            icon={TrendingUp}
            color="pink"
            format="percentage"
            delay={0.15}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <TeamWorkload />
        </div>

        {/* Work Pipeline + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WorkPipeline />
          </div>
          <ActivityFeed />
        </div>
      </div>
    </AppShell>
  );
}
