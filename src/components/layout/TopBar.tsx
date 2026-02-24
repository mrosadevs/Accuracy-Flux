'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Plus, ChevronDown, Calendar, Clock,
  FileText, User, Sparkles, Menu, Sun, Moon
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

const quickActions = [
  { icon: FileText, label: 'New Work Item', color: 'text-primary-600' },
  { icon: User, label: 'Add Client', color: 'text-accent-600' },
  { icon: Calendar, label: 'Schedule Meeting', color: 'text-pink-500' },
  { icon: Clock, label: 'Start Timer', color: 'text-success' },
];

const notifications = [
  { id: 1, title: 'Tax return ready for review', subtitle: 'Patricia Brown - Individual Return', time: '5 min ago', read: false },
  { id: 2, title: 'New document uploaded', subtitle: 'Chen Wei uploaded 3 files', time: '1 hour ago', read: false },
  { id: 3, title: 'Payment received', subtitle: 'Maria Garcia - $1,200.00', time: '2 hours ago', read: true },
  { id: 4, title: 'Due date approaching', subtitle: 'Hassan Medical Payroll - Feb 28', time: '3 hours ago', read: true },
];

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, subtitle, onMenuClick }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-border sticky top-0 z-40 flex items-center justify-between px-4 md:px-6">
      {/* Left: Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-hover transition-colors md:hidden"
        >
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold text-text-primary"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-text-muted">
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* AI Assistant Badge */}
        <motion.button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-500/10 to-pink-500/10 border border-accent-400/20 text-sm font-medium text-accent-600 dark:text-accent-400 hover:from-accent-500/20 hover:to-pink-500/20 transition-all pulse-glow-accent"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Assist</span>
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-border transition-colors relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {theme === 'light' ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon className="w-4 h-4 text-text-secondary" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun className="w-4 h-4 text-warning" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Quick Add */}
        <div className="relative">
          <motion.button
            onClick={() => { setShowQuickActions(!showQuickActions); setShowNotifications(false); }}
            className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors shadow-sm pulse-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
          </motion.button>

          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-border shadow-lg overflow-hidden"
              >
                <div className="p-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 py-1.5">Quick Actions</p>
                  {quickActions.map((action, i) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <action.icon className={`w-4 h-4 ${action.color}`} />
                      <span className="text-sm font-medium text-text-primary">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            onClick={() => { setShowNotifications(!showNotifications); setShowQuickActions(false); }}
            className="relative w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center hover:bg-border transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-4 h-4 text-text-secondary" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl border border-border shadow-lg overflow-hidden"
              >
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                  <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`px-3 py-3 border-b border-border-light hover:bg-surface-hover transition-colors cursor-pointer ${!notif.read ? 'bg-primary-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.read ? 'bg-primary-600' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                          <p className="text-xs text-text-muted mt-0.5">{notif.subtitle}</p>
                          <p className="text-[10px] text-text-muted mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="p-2 border-t border-border">
                  <button className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-1.5">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Current Timer */}
        <motion.div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20 cursor-pointer"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-mono font-semibold text-success">02:34:15</span>
        </motion.div>
      </div>
    </header>
  );
}
