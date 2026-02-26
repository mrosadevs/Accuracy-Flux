'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import AIAssistant from '@/components/ui/AIAssistant';
import { useProfile } from '@/lib/hooks/use-profile';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (profileLoading) return;
    if (profile?.role === 'client') {
      router.replace('/portal');
    } else if (!profile) {
      // Not logged in — send to login page
      router.replace('/login');
    }
  }, [profile, profileLoading, router]);

  // Show a full-page loader while auth is being determined
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render staff UI for non-staff accounts (prevents flash of content)
  if (!profile || profile.role === 'client') return null;

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
      <AIAssistant />
    </div>
  );
}
