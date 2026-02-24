'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import { emails, type EmailItem } from '@/lib/mock-data';
import {
  Search, Star, StarOff, Paperclip, Tag, MoreHorizontal,
  Archive, Trash2, Clock, Reply, Forward, ChevronDown,
  Inbox, Send, AlertCircle, CheckCircle2, Mail, Filter,
  User, ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

const tabs = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 3 },
  { id: 'assigned', label: 'Assigned to Me', icon: User, count: 5 },
  { id: 'sent', label: 'Sent', icon: Send, count: 0 },
  { id: 'archived', label: 'Archived', icon: Archive, count: 0 },
];

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set(['e1', 'e5']));

  const toggleStar = (id: string) => {
    setStarredEmails(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell title="Triage" subtitle="Manage your email workflow">
      <div className="max-w-[1800px] mx-auto h-[calc(100vh-140px)]">
        <div className="flex gap-4 h-full">
          {/* Email List */}
          <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col bg-white rounded-2xl border border-border overflow-hidden flex-shrink-0">
            {/* Tabs */}
            <div className="flex items-center border-b border-border px-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-all',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="text-[9px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-border-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-surface-hover rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/20 placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Email Items */}
            <div className="flex-1 overflow-y-auto">
              {emails.map((email, i) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedEmail(email)}
                  className={clsx(
                    'px-4 py-3 border-b border-border-light cursor-pointer transition-all relative',
                    selectedEmail?.id === email.id
                      ? 'bg-primary-50/50 border-l-2 border-l-primary-500'
                      : 'hover:bg-surface-hover',
                    !email.read && 'bg-blue-50/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Star */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {starredEmails.has(email.id) ? (
                        <Star className="w-4 h-4 text-warning fill-warning" />
                      ) : (
                        <Star className="w-4 h-4 text-text-muted/30 hover:text-warning/50" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={clsx('text-sm truncate', !email.read ? 'font-bold text-text-primary' : 'font-medium text-text-secondary')}>
                          {email.from}
                        </span>
                        <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">{email.timestamp}</span>
                      </div>
                      <p className={clsx('text-xs truncate mb-0.5', !email.read ? 'font-semibold text-text-primary' : 'text-text-secondary')}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-text-muted truncate">{email.preview}</p>

                      <div className="flex items-center gap-2 mt-1.5">
                        {email.hasAttachment && <Paperclip className="w-3 h-3 text-text-muted" />}
                        {email.client && (
                          <span className="text-[9px] font-semibold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-md">
                            {email.client}
                          </span>
                        )}
                        {email.labels.map(label => (
                          <span key={label} className="text-[9px] font-medium bg-surface-hover text-text-muted px-1.5 py-0.5 rounded-md">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {!email.read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Email Detail */}
          <div className="hidden lg:flex flex-1 bg-white rounded-2xl border border-border overflow-hidden flex-col">
            {selectedEmail ? (
              <motion.div
                key={selectedEmail.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                {/* Email Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-text-primary">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                        <Reply className="w-4 h-4 text-text-muted" />
                      </button>
                      <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                        <Forward className="w-4 h-4 text-text-muted" />
                      </button>
                      <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                        <Archive className="w-4 h-4 text-text-muted" />
                      </button>
                      <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
                      {selectedEmail.from.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{selectedEmail.from}</p>
                      <p className="text-xs text-text-muted">{selectedEmail.fromEmail}</p>
                    </div>
                    <span className="text-xs text-text-muted ml-auto">{selectedEmail.timestamp}</span>
                  </div>

                  {selectedEmail.client && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-text-muted">Linked to:</span>
                      <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2 py-1 rounded-lg">
                        {selectedEmail.client}
                      </span>
                    </div>
                  )}
                </div>

                {/* Email Body */}
                <div className="flex-1 p-5 overflow-y-auto">
                  <p className="text-sm text-text-secondary leading-relaxed">{selectedEmail.preview}</p>
                  <p className="text-sm text-text-secondary leading-relaxed mt-4">
                    This is a preview of the full email content. In a production environment, this would display the complete email body with formatting, images, and any inline content.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-t border-border bg-surface-hover/30">
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply
                    </motion.button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-text-secondary bg-white border border-border hover:bg-surface-hover transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Assign to Work
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-text-secondary bg-white border border-border hover:bg-surface-hover transition-colors">
                      <Clock className="w-3.5 h-3.5" />
                      Snooze
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-muted">Select an email to view</p>
                  <p className="text-xs text-text-muted mt-1">Click on any email from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
