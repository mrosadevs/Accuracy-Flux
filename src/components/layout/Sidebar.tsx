'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, KanbanSquare, Mail,
  Clock, Settings, ChevronLeft, ChevronRight, Search,
  Zap, Upload, X, UserCog, Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import { useProfile } from '@/lib/hooks/use-profile';
import { useNotifications } from '@/lib/hooks/use-notifications';

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',     badge: null },
  { href: '/kanban',       icon: KanbanSquare,    label: 'Board',         badge: null },
  { href: '/work',         icon: Briefcase,       label: 'Work Items',    badge: null },
  { href: '/clients',      icon: Users,           label: 'Clients',       badge: null },
  { href: '/email',        icon: Mail,            label: 'Triage',        badge: null },
  { href: '/time-billing', icon: Clock,           label: 'Time & Billing', badge: null },
];

const roleBadgeColors: Record<string, string> = {
  owner: 'text-purple-600',
  admin: 'text-primary-600',
  staff: 'text-text-muted',
  client: 'text-green-600',
};

const bottomItems = [
  { href: '/portals', icon: Upload, label: 'Client Portals' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { profile, isAdmin } = useProfile();
  const { unreadCount } = useNotifications();

  const displayName = profile?.name ?? 'Loading…';
  const displayInitials = profile?.initials ?? (profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AF');
  const displayRole = profile?.role ? (profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) : 'Staff';
  const roleColor = roleBadgeColors[profile?.role ?? 'staff'];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border relative">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden" onClick={() => setMobileOpen(false)}>
          <motion.div
            className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-sm font-bold text-text-primary tracking-tight">Accuracy Flux</span>
                <span className="text-[10px] text-text-muted font-medium">Practice Management</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Desktop collapse toggle */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-border shadow-sm items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-colors z-10 hidden md:flex"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-text-secondary" /> : <ChevronLeft className="w-3 h-3 text-text-secondary" />}
        </motion.button>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors md:hidden"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search everything..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-surface-hover px-1.5 py-0.5 rounded border border-border font-mono hidden sm:inline">
                /
              </kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-3 mb-2"
            >
              Main Menu
            </motion.p>
          )}
        </AnimatePresence>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <motion.div
                className={clsx(
                  'group relative flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-600"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={clsx('w-[18px] h-[18px] flex-shrink-0', isActive && 'text-primary-600')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {(() => {
                  const badge = item.href === '/email' && unreadCount > 0
                    ? String(unreadCount > 9 ? '9+' : unreadCount)
                    : item.badge;
                  return badge && !collapsed ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-[10px] font-bold text-white bg-primary-600 rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {badge}
                    </motion.span>
                  ) : null;
                })()}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-foreground text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
        {/* Team link — admin/owner only */}
        {isAdmin && (
          <Link href="/team" onClick={() => setMobileOpen(false)}>
            <motion.div
              className={clsx(
                'group relative flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-200 cursor-pointer',
                pathname === '/team'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {pathname === '/team' && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-600"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <UserCog className={clsx('w-[18px] h-[18px] flex-shrink-0', pathname === '/team' && 'text-primary-600')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    Team
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-foreground text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Team
                </div>
              )}
            </motion.div>
          </Link>
        )}
      </nav>

      {/* Bottom Items */}
      <div className="px-3 py-3 border-t border-border space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <motion.div
                className={clsx(
                  'group relative flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}

        {/* User Profile */}
        <div className="pt-2 border-t border-border mt-2">
          <Link href="/settings" onClick={() => setMobileOpen(false)}>
            <motion.div
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors"
              whileHover={{ x: 2 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                style={{ backgroundColor: profile?.color ?? '#3b82f6' }}
              >
                {displayInitials}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                    <p className={clsx('text-[10px] font-semibold', roleColor)}>{displayRole}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-screen bg-surface border-r border-border z-50 flex-col hidden md:flex"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 h-screen w-[260px] bg-surface border-r border-border z-50 flex flex-col md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
