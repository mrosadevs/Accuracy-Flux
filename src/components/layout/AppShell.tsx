'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen gradient-mesh bg-background">
      <AnimatedBackground />
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="transition-all duration-300 md:ml-[260px] relative z-10">
        <TopBar title={title} subtitle={subtitle} onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6 h-[calc(100vh-64px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
