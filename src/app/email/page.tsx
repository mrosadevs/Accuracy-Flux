'use client';

import { useState, useRef, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import { useTriage, type InternalThread, type PortalNotification } from '@/lib/hooks/use-triage';
import { useProfile } from '@/lib/hooks/use-profile';
import { isSupabaseConfigured } from '@/lib/hooks/use-supabase';
import {
  MessageSquare, Plus, Send, X, Users, Bell,
  Loader2, AlertCircle, ChevronRight, CheckCheck, MessagesSquare
} from 'lucide-react';
import clsx from 'clsx';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name, color }: { name: string; color?: string | null }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
      style={{ backgroundColor: color ?? '#3b82f6' }}>
      {initials}
    </div>
  );
}

function NewThreadModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, msg: string) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!title.trim() || !message.trim()) { setError('Thread title and first message are required.'); return; }
    setSaving(true);
    try { await onCreate(title.trim(), message.trim()); onClose(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to create thread'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-text-primary">New Thread</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/5 border border-danger/20 rounded-xl text-xs text-danger">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Thread Title</label>
            <input type="text" placeholder="e.g. Johnson Tax Return - Notes" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-text-muted" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-1.5 block">First Message</label>
            <textarea placeholder="Start the conversation..." value={message} onChange={e => setMessage(e.target.value)} rows={4}
              className="w-full px-3 py-2.5 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none placeholder:text-text-muted" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">Cancel</button>
            <motion.button onClick={handleSubmit} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5" />Create Thread</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
function ThreadItem({ thread, active, onClick }: { thread: InternalThread; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={clsx('w-full text-left px-3 py-3 rounded-xl transition-all group', active ? 'bg-primary-50 border border-primary-200' : 'hover:bg-surface-hover border border-transparent')}>
      <div className="flex items-start gap-2.5">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', active ? 'bg-primary-100' : 'bg-surface-hover group-hover:bg-white')}>
          <MessageSquare className={clsx('w-4 h-4', active ? 'text-primary-600' : 'text-text-muted')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={clsx('text-xs font-semibold truncate', active ? 'text-primary-700' : 'text-text-primary')}>{thread.title}</p>
            <span className="text-[10px] text-text-muted flex-shrink-0">{timeAgo(thread.last_message_at)}</span>
          </div>
          {thread.last_message_preview && <p className="text-[11px] text-text-muted mt-0.5 truncate">{thread.last_message_preview}</p>}
        </div>
      </div>
    </button>
  );
}

function NotificationItem({ notif, active, onClick }: { notif: PortalNotification; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={clsx('w-full text-left px-3 py-3 rounded-xl transition-all group', active ? 'bg-amber-50 border border-amber-200' : 'hover:bg-surface-hover border border-transparent')}>
      <div className="flex items-start gap-2.5">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', active ? 'bg-amber-100' : 'bg-amber-50 group-hover:bg-amber-100')}>
          <Bell className={clsx('w-4 h-4', active ? 'text-amber-600' : 'text-amber-500')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">{notif.client_name}</p>
              {!notif.read_at && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
            </div>
            <span className="text-[10px] text-text-muted flex-shrink-0">{timeAgo(notif.created_at)}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">{notif.message}</p>
        </div>
      </div>
    </button>
  );
}
export default function TriagePage() {
  const { profile } = useProfile();
  const { threads, messages, portalNotifications, loading, selectedThreadId, setSelectedThreadId, createThread, sendMessage, markPortalRead, unreadPortalCount } = useTriage();
  const [tab, setTab] = useState<'team' | 'clients'>('team');
  const [showNewThread, setShowNewThread] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<PortalNotification | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectedThread = threads.find(t => t.id === selectedThreadId) ?? null;

  async function handleSendMessage() {
    if (!messageInput.trim() || !selectedThreadId || sending) return;
    setSending(true);
    try { await sendMessage(selectedThreadId, messageInput.trim()); setMessageInput(''); }
    finally { setSending(false); }
  }

  async function handleSelectNotif(notif: PortalNotification) {
    setSelectedNotif(notif); setSelectedThreadId(null);
    if (!notif.read_at) await markPortalRead(notif.id);
  }

  if (!configured) {
    return (
      <AppShell title="Triage" subtitle="Team messages & client replies">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <MessagesSquare className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary">Supabase not configured</p>
          </div>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell title="Triage" subtitle="Team messages & client portal replies">
      <AnimatePresence>
        {showNewThread && (
          <NewThreadModal onClose={() => setShowNewThread(false)} onCreate={async (title, msg) => { await createThread(title, msg); }} />
        )}
      </AnimatePresence>

      <div className="flex h-[calc(100vh-130px)] bg-white rounded-2xl border border-border overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
          <div className="flex border-b border-border">
            <button onClick={() => setTab('team')}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-colors', tab === 'team' ? 'text-primary-700 border-b-2 border-primary-600' : 'text-text-muted hover:text-text-secondary')}>
              <Users className="w-3.5 h-3.5" />Team
            </button>
            <button onClick={() => setTab('clients')}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-colors relative', tab === 'clients' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-text-muted hover:text-text-secondary')}>
              <Bell className="w-3.5 h-3.5" />Client Replies
              {unreadPortalCount > 0 && (
                <span className="absolute top-2 right-3 min-w-[16px] h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center px-1">{unreadPortalCount}</span>
              )}
            </button>
          </div>

          {tab === 'team' && (
            <div className="p-3 border-b border-border">
              <motion.button onClick={() => setShowNewThread(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full h-9 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" />New Thread
              </motion.button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-primary-400 animate-spin" /></div>
            ) : tab === 'team' ? (
              threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <MessageSquare className="w-8 h-8 text-text-muted/30 mb-2" />
                  <p className="text-xs text-text-muted font-medium">No threads yet</p>
                  <p className="text-[11px] text-text-muted/70 mt-1">Create one to start a team conversation</p>
                </div>
              ) : threads.map(thread => (
                <ThreadItem key={thread.id} thread={thread} active={selectedThreadId === thread.id}
                  onClick={() => { setSelectedThreadId(thread.id); setSelectedNotif(null); }} />
              ))
            ) : (
              portalNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Bell className="w-8 h-8 text-text-muted/30 mb-2" />
                  <p className="text-xs text-text-muted font-medium">No client replies</p>
                  <p className="text-[11px] text-text-muted/70 mt-1">Client portal messages appear here</p>
                </div>
              ) : portalNotifications.map(notif => (
                <NotificationItem key={notif.id} notif={notif} active={selectedNotif?.id === notif.id}
                  onClick={() => handleSelectNotif(notif)} />
              ))
            )}
          </div>
        </div>
        {/* Center Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedThread && tab === 'team' ? (
            <>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{selectedThread.title}</p>
                  <p className="text-xs text-text-muted">Started by {selectedThread.creator_name ?? 'Unknown'} · {timeAgo(selectedThread.created_at)}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === profile?.id;
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                      className={clsx('flex gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
                      <Avatar name={msg.sender_name} />
                      <div className={clsx('max-w-[70%] flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                        <p className={clsx('text-[11px] text-text-muted', isMe ? 'text-right' : '')}>{msg.sender_name}</p>
                        <div className={clsx('px-4 py-2.5 rounded-2xl text-sm leading-relaxed', isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-surface-hover text-text-primary rounded-tl-sm')}>
                          {msg.content}
                        </div>
                        <p className="text-[10px] text-text-muted/60">{timeAgo(msg.created_at)}</p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="px-5 py-4 border-t border-border">
                <div className="flex items-end gap-3">
                  <Avatar name={profile?.name ?? 'Me'} color={profile?.color} />
                  <div className="flex-1 flex items-end gap-2 bg-surface-hover rounded-2xl px-4 py-2.5 border border-border focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                    <textarea value={messageInput} onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      placeholder="Write a message... (Enter to send)"
                      rows={1}
                      className="flex-1 bg-transparent text-sm text-text-primary resize-none focus:outline-none placeholder:text-text-muted" />
                    <motion.button onClick={handleSendMessage} disabled={!messageInput.trim() || sending}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                      {sending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </>
          ) : selectedNotif && tab === 'clients' ? (
            <>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{selectedNotif.client_name}</p>
                  <p className="text-xs text-text-muted">
                    Client portal message · {timeAgo(selectedNotif.created_at)}
                    {selectedNotif.read_at && <span className="ml-2 inline-flex items-center gap-0.5 text-success"><CheckCheck className="w-3 h-3" />Read</span>}
                  </p>
                </div>
              </div>              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar name={selectedNotif.sender_name ?? selectedNotif.client_name} />
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{selectedNotif.sender_name ?? selectedNotif.client_name}</p>
                        <p className="text-[10px] text-text-muted">via Client Portal</p>
                      </div>
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed">{selectedNotif.message}</p>
                    <p className="text-[10px] text-text-muted mt-3">{new Date(selectedNotif.created_at).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-surface-hover rounded-xl border border-border flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-secondary">
                      To reply, go to <strong>Clients</strong> and open <strong>{selectedNotif.client_name}&apos;s</strong> portal messages. Replies appear in their client portal.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              {tab === 'team' ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-7 h-7 text-primary-400" />
                  </div>
                  <p className="text-base font-semibold text-text-primary">Select a thread</p>
                  <p className="text-sm text-text-muted mt-1 max-w-xs">Choose a team thread from the left, or start a new one.</p>
                  <motion.button onClick={() => setShowNewThread(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="mt-5 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors">
                    <Plus className="w-4 h-4" />New Thread
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                    <Bell className="w-7 h-7 text-amber-400" />
                  </div>
                  <p className="text-base font-semibold text-text-primary">Select a notification</p>
                  <p className="text-sm text-text-muted mt-1 max-w-xs">Client portal messages appear here when clients message you.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}