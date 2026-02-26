'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Plus, ChevronDown, Calendar, Clock,
  FileText, User, Menu, Sun, Moon, Check
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useActiveTimer } from '@/lib/hooks/use-active-timer';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, subtitle, onMenuClick }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { activeTimer, elapsedFormatted } = useActiveTimer();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const router = useRouter();

  function quickAction(action: string) {
    setShowQuickActions(false);
    if (action === 'work') {
      try { localStorage.setItem('af-auto-open', 'new-work-item'); } catch { /* ignore */ }
      router.push('/work');
    } else if (action === 'client') {
      try { localStorage.setItem('af-auto-open', 'new-client'); } catch { /* ignore */ }
      router.push('/clients');
    } else if (action === 'timer') {
      try { localStorage.setItem('af-auto-open', 'start-timer'); } catch { /* ignore */ }
      router.push('/time-billing');
    } else if (action === 'meeting') {
      router.push('/work');
    }
  }

  const quickActions = [
    { id: 'work', icon: FileText, label: 'New Work Item', color: 'text-primary-600' },
    { id: 'client', icon: User, label: 'Add Client', color: 'text-accent-600' },
    { id: 'meeting', icon: Calendar, label: 'Schedule Meeting', color: 'text-pink-500' },
    { id: 'timer', icon: Clock, label: 'Start Timer', color: 'text-success' },
  ];

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-white flex-shrink-0">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="p-2 hover:bg-surface-hover rounded-xl transition-colors md:hidden">
            <Menu className="w-4 h-4 text-text-muted" />
          </button>
        )}
        <div>
          <h1 className="text-base font-bold text-text-primary leading-none">{title}</h1>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Actions + Button */}
        <div className="relative">
          <motion.button
            onClick={() => setShowQuickActions(!showQuickActions)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3" />
          </motion.button>

          <AnimatePresence>
            {showQuickActions && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowQuickActions(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-30"
                >
                  <div className="p-1.5">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2.5 py-1.5">Quick Actions</p>
                    {quickActions.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => quickAction(action.id)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-hover transition-colors text-left"
                        >
                          <Icon className={clsx('w-4 h-4', action.color)} />
                          <span className="text-sm font-medium text-text-primary">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        {/* Timer Widget */}
        {activeTimer ? (
          <motion.button
            onClick={() => router.push('/time-billing')}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20 hover:bg-success/20 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-mono font-semibold text-success">{elapsedFormatted}</span>
            <span className="text-[10px] text-success/80 hidden sm:block max-w-[100px] truncate">{activeTimer.description || activeTimer.clientName}</span>
          </motion.button>
        ) : (
          <button
            onClick={() => quickAction('timer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:bg-surface-hover border border-border transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Timer</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-surface-hover rounded-xl transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-text-muted" /> : <Moon className="w-4 h-4 text-text-muted" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <motion.button
            onClick={() => {
              const opening = !showNotifications;
              setShowNotifications(opening);
              // Opening the bell = "I saw it" — mark everything as read immediately
              if (opening && unreadCount > 0) markAllRead();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative p-2 hover:bg-surface-hover rounded-xl transition-colors"
          >
            <Bell className="w-4 h-4 text-text-muted" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-xl overflow-hidden z-30"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-medium text-primary-600 hover:text-primary-700 transition-colors">
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <Bell className="w-8 h-8 text-text-muted/30 mb-2" />
                        <p className="text-sm text-text-muted">No notifications</p>
                      </div>
                    ) : (
                      <div className="p-1.5 space-y-0.5">
                        {notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => { setShowNotifications(false); router.push(notif.href); }}
                            className={clsx(
                              'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                              notif.read ? 'hover:bg-surface-hover' : 'bg-primary-50/50 hover:bg-primary-50'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                              <div className={clsx('flex-1 min-w-0', notif.read && 'pl-3.5')}>
                                <p className="text-xs font-semibold text-text-primary truncate">{notif.title}</p>
                                <p className="text-[11px] text-text-muted mt-0.5 truncate">{notif.subtitle}</p>
                                <p className="text-[10px] text-text-muted/70 mt-0.5">{notif.time}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border p-2">
                    <button
                      onClick={() => { setShowNotifications(false); router.push('/email'); }}
                      className="w-full text-center text-xs font-medium text-primary-600 hover:text-primary-700 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      View all in Triage
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

