'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FileText, CheckCircle2, Upload, Download, Trash2,
  Plus, Send, Search, Loader2, X, File, FileSpreadsheet, Image,
  Shield, Globe, ChevronRight, Clock, Eraser, Tag, Sparkles, Check,
} from 'lucide-react';
import clsx from 'clsx';
import { useClients } from '@/lib/hooks/use-clients';
import { usePortal } from '@/lib/hooks/use-portal';
import { useWorkItems } from '@/lib/hooks/use-work-items';
import { useSupabase } from '@/lib/hooks/use-supabase';
import { useProfile } from '@/lib/hooks/use-profile';
import type { Client, BusinessEntity, EntityType } from '@/lib/types/database';
import { getClientTemplate, ALL_CLIENT_TEMPLATES } from '@/lib/templates/client-templates';
import { ENTITY_TYPE_SHORT } from '@/lib/utils/tax-deadlines';

/* ─── Status config ────────────────────────────────────────────────────── */
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'not-started':       { label: 'Not Started', color: 'text-text-muted',   bg: 'bg-text-muted/10' },
  'in-progress':       { label: 'In Progress', color: 'text-primary-600',  bg: 'bg-primary-50'    },
  'waiting-on-client': { label: 'Awaiting',    color: 'text-amber-600',    bg: 'bg-amber-50'      },
  'in-review':         { label: 'In Review',   color: 'text-purple-600',   bg: 'bg-purple-50'     },
  'completed':         { label: 'Completed',   color: 'text-success',      bg: 'bg-success/10'    },
};

/* ─── Apply Client Template Modal ───────────────────────────────────────── */
function ApplyClientTemplateModal({
  client,
  onClose,
  onApply,
}: {
  client: Client;
  onClose: () => void;
  onApply: (items: { title: string; show_in_portal: boolean }[]) => Promise<void>;
}) {
  const clientBizEntities: BusinessEntity[] = (client.business_entities as BusinessEntity[] | null) ?? [];

  // Pick initial entity type
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | null>(
    clientBizEntities.length > 0 ? clientBizEntities[0].entity_type : null,
  );

  const template = getClientTemplate(selectedEntityType);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    () => new Set(template?.items.filter(i => i.required).map(i => i.title) ?? []),
  );
  const [applying, setApplying] = useState(false);

  function handleEntityTypeChange(et: EntityType | null) {
    setSelectedEntityType(et);
    const tmpl = getClientTemplate(et);
    setSelectedItems(new Set(tmpl?.items.filter(i => i.required).map(i => i.title) ?? []));
  }

  function toggleItem(title: string) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }

  async function handleApply() {
    if (!template || selectedItems.size === 0) return;
    setApplying(true);
    try {
      const items = template.items
        .filter(i => selectedItems.has(i.title))
        .map(i => ({ title: i.title, show_in_portal: true }));
      await onApply(items);
      onClose();
    } finally { setApplying(false); }
  }

  const categories = template ? [...new Set(template.items.map(i => i.category))] : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Apply Document Checklist</h2>
              <p className="text-[10px] text-text-muted mt-0.5">{client.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Entity type picker */}
        <div className="px-6 pt-4 pb-3 border-b border-border flex-shrink-0 space-y-3">
          {clientBizEntities.length > 0 ? (
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Business Entity</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleEntityTypeChange(null)}
                  className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    selectedEntityType === null ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-text-secondary border-border hover:border-border-dark')}>
                  All / General
                </button>
                {clientBizEntities.map(biz => (
                  <button key={biz.name} onClick={() => handleEntityTypeChange(biz.entity_type)}
                    className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                      selectedEntityType === biz.entity_type ? 'bg-accent-600 text-white border-accent-600' : 'bg-white text-text-secondary border-border hover:border-border-dark')}>
                    {biz.name} <span className="opacity-70">({ENTITY_TYPE_SHORT[biz.entity_type]})</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Template Type</label>
              <select value={selectedEntityType ?? ''} onChange={e => handleEntityTypeChange((e.target.value as EntityType) || null)}
                className="w-full h-10 px-3 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="">Individual / General</option>
                {ALL_CLIENT_TEMPLATES.map(t => t.entity_types.map(et => (
                  <option key={et} value={et}>{ENTITY_TYPE_SHORT[et]}</option>
                )))}
              </select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-muted">{selectedItems.size} of {template?.items.length ?? 0} items selected</p>
            <div className="flex gap-2">
              <button onClick={() => setSelectedItems(new Set(template?.items.map(i => i.title) ?? []))}
                className="text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors">Select all</button>
              <span className="text-text-muted/40">·</span>
              <button onClick={() => setSelectedItems(new Set(template?.items.filter(i => i.required).map(i => i.title) ?? []))}
                className="text-[11px] font-medium text-text-muted hover:text-text-secondary transition-colors">Required only</button>
            </div>
          </div>
        </div>

        {/* Checklist grouped by category */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {categories.map(category => {
            const catItems = template!.items.filter(i => i.category === category);
            return (
              <div key={category}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{category}</p>
                <div className="space-y-1">
                  {catItems.map(item => (
                    <button key={item.title} onClick={() => toggleItem(item.title)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                        selectedItems.has(item.title)
                          ? 'bg-accent-50 border-accent-200 text-text-primary'
                          : 'bg-white border-border text-text-muted hover:border-border-dark hover:text-text-secondary',
                      )}>
                      <div className={clsx(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        selectedItems.has(item.title) ? 'bg-accent-600 border-accent-600' : 'border-border',
                      )}>
                        {selectedItems.has(item.title) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm flex-1">{item.title}</span>
                      {item.required && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-danger/10 text-danger rounded-full flex-shrink-0">Required</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">
            Cancel
          </button>
          <motion.button onClick={handleApply} disabled={applying || selectedItems.size === 0}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-accent-600 to-pink-600 hover:from-accent-700 hover:to-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {applying
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Sparkles className="w-3.5 h-3.5" />Send {selectedItems.size} Tasks to Client</>
            }
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Client Panel (right side) ─────────────────────────────────────────── */
function ClientPanel({ client }: { client: Client }) {
  const supabase    = useSupabase();
  const { profile } = useProfile();
  const { documents, messages, loading, uploadDocument, clearMessages, getDownloadUrl, sendMessage, refetch } = usePortal(client.id);
  const { workItems, addWorkItem, deleteWorkItem } = useWorkItems();

  const clientWorkItems = workItems.filter(w => w.client_id === client.id);

  const [tab,           setTab]           = useState<'messages' | 'files' | 'tasks'>('messages');
  const [messageText,   setMessageText]   = useState('');
  const [sending,       setSending]       = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [newTaskTitle,  setNewTaskTitle]  = useState('');
  const [newTaskDue,    setNewTaskDue]    = useState('');
  const [addingTask,    setAddingTask]    = useState(false);
  const [showTaskForm,    setShowTaskForm]    = useState(false);
  const [showTemplate,    setShowTemplate]    = useState(false);
  const [clearingChat,    setClearingChat]    = useState(false);
  const [clearConfirm,    setClearConfirm]    = useState(false);
  const [clearError,      setClearError]      = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Documents for You');
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark client messages as read when messages tab is active
  useEffect(() => {
    if (tab !== 'messages' || !client.id) return;
    supabase
      .from('portal_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('client_id', client.id)
      .eq('is_from_client', true)
      .is('read_at', null)
      .then(() => { /* fire and forget */ });
  }, [tab, client.id, supabase, messages]);

  const unreadCount = messages.filter(m => m.is_from_client && !m.read_at).length;

  /* ── Send reply ── */
  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    setSending(true);
    try {
      const senderName = profile?.name ?? 'Accuracy Flux';
      await sendMessage(client.id, messageText.trim(), senderName, false);
      setMessageText('');
    } finally { setSending(false); }
  };

  /* ── Upload ── */
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file, client.id, profile?.id ?? 'staff', uploadCategory || 'Documents for You');
      }
    } finally { setUploading(false); }
  }, [uploadDocument, client.id, profile, uploadCategory]);

  /* ── Download ── */
  const handleDownload = async (filePath: string, filename: string) => {
    const url = await getDownloadUrl(filePath);
    if (url && url !== '#') {
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.target = '_blank';
      a.click();
    }
  };

  /* ── Delete file (staff) ── */
  const handleDeleteFile = async (id: string, filePath: string) => {
    // Try API route first (works for client-uploaded files); fall back to direct staff delete
    const res = await fetch('/api/delete-portal-document', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId: id, filePath, clientId: client.id }),
    });
    if (!res.ok) {
      // Staff has ALL policy via RLS, so direct delete works for staff-uploaded files
      await supabase.storage.from('portal-documents').remove([filePath]);
      await supabase.from('portal_documents').delete().eq('id', id);
    }
    refetch();
  };

  /* ── Add task ── */
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || addingTask) return;
    setAddingTask(true);
    try {
      await addWorkItem({
        title:       newTaskTitle.trim(),
        client_id:   client.id,
        client_name: client.name,
        type:        'advisory',
        status:      'not-started',
        priority:    'medium',
        assignee:    profile?.name ?? '',
        due_date:    newTaskDue || null,
      });
      setNewTaskTitle(''); setNewTaskDue(''); setShowTaskForm(false);
    } finally { setAddingTask(false); }
  };

  /* ── Apply client template ── */
  const handleApplyClientTemplate = async (items: { title: string; show_in_portal: boolean }[]) => {
    for (const item of items) {
      await addWorkItem({
        title:          item.title,
        client_id:      client.id,
        client_name:    client.name,
        type:           'advisory',
        status:         'not-started',
        priority:       'medium',
        assignee:       profile?.name ?? '',
        show_in_portal: item.show_in_portal,
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence>
        {showTemplate && (
          <ApplyClientTemplateModal
            client={client}
            onClose={() => setShowTemplate(false)}
            onApply={handleApplyClientTemplate}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
            {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">{client.name}</p>
            <p className="text-xs text-text-muted">{client.company || client.email}</p>
          </div>
        </div>
        {client.portal_user_id ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-semibold">
            <Shield className="w-3 h-3" />Portal Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-text-muted/10 text-text-muted text-[10px] font-semibold">
            <Globe className="w-3 h-3" />No Portal Access
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border bg-white px-4 flex-shrink-0">
        {([
          { id: 'messages' as const, label: 'Messages', icon: MessageSquare, badge: unreadCount,          danger: unreadCount > 0 },
          { id: 'files'    as const, label: 'Files',    icon: FileText,      badge: documents.length,     danger: false           },
          { id: 'tasks'    as const, label: 'Tasks',    icon: CheckCircle2,  badge: clientWorkItems.length, danger: false          },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all',
              tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-text-muted hover:text-text-secondary')}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
            {t.badge > 0 && (
              <span className={clsx('ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                t.danger ? 'bg-danger text-white' : 'bg-primary-50 text-primary-600')}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ──── MESSAGES ──── */}
        {tab === 'messages' && (
          <div className="flex flex-col h-full" style={{ minHeight: 400 }}>
            {/* Clear chat button */}
            {messages.length > 0 && (
              <div className="flex flex-col items-end gap-1 mb-2">
                {clearError && (
                  <p className="text-[10px] text-danger font-medium px-1">{clearError}</p>
                )}
                {clearConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-muted">Clear all messages?</span>
                    <button
                      onClick={async () => {
                        setClearConfirm(false);
                        setClearError(null);
                        setClearingChat(true);
                        try {
                          await clearMessages(client.id);
                        } catch (err) {
                          setClearError(err instanceof Error ? err.message : 'Failed to clear');
                        } finally {
                          setClearingChat(false);
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-danger text-white hover:bg-danger/90 transition-colors"
                    >
                      Yes, clear
                    </button>
                    <button
                      onClick={() => { setClearConfirm(false); setClearError(null); }}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-border text-text-muted hover:bg-surface-hover transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setClearConfirm(true); setClearError(null); }}
                    disabled={clearingChat}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-text-muted hover:text-danger hover:bg-danger/5 transition-colors disabled:opacity-40"
                  >
                    {clearingChat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eraser className="w-3 h-3" />}
                    Clear conversation
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-primary-400 animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-10 h-10 text-text-muted/20 mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No messages yet</p>
                  <p className="text-xs text-text-muted/60 mt-1">Send a message to {client.name.split(' ')[0]} below</p>
                </div>
              ) : messages.map((msg, i) => (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className={clsx('flex gap-2.5', !msg.is_from_client && 'flex-row-reverse')}>
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0',
                    msg.is_from_client
                      ? 'bg-gradient-to-br from-accent-400 to-pink-500'
                      : 'bg-gradient-to-br from-primary-500 to-primary-700'
                  )}>
                    {(msg.sender_name ?? 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className={clsx('max-w-[72%] space-y-0.5', !msg.is_from_client && 'items-end flex flex-col')}>
                    <p className="text-[10px] text-text-muted px-1">
                      {msg.sender_name ?? 'Unknown'} · {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <div className={clsx(
                      'rounded-2xl px-3 py-2',
                      msg.is_from_client
                        ? 'bg-white border border-border rounded-tl-sm'
                        : 'bg-primary-600 rounded-tr-sm'
                    )}>
                      <p className={clsx('text-sm', msg.is_from_client ? 'text-text-primary' : 'text-white')}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Reply box */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-border p-2 flex-shrink-0">
              <input
                type="text"
                placeholder={`Reply to ${client.name.split(' ')[0]}…`}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !sending && handleSend()}
                className="flex-1 px-2 text-sm bg-transparent focus:outline-none placeholder:text-text-muted"
              />
              <motion.button onClick={handleSend} disabled={!messageText.trim() || sending}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </motion.button>
            </div>
          </div>
        )}

        {/* ──── FILES ──── */}
        {tab === 'files' && (
          <div className="space-y-4">
            {/* Category picker */}
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
              <span className="text-xs font-semibold text-text-secondary whitespace-nowrap">Upload as:</span>
              <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                className="flex-1 h-8 px-2 text-xs bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                <option value="Documents for You">Documents for You</option>
                <option value="Tax Document">Tax Document</option>
                <option value="Bank Statement">Bank Statement</option>
                <option value="Invoice">Invoice</option>
                <option value="Receipt">Receipt</option>
                <option value="Payroll">Payroll</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {/* Upload zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary-300 transition-colors bg-white cursor-pointer"
              onClick={() => !uploading && fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" className="hidden" multiple
                onChange={e => e.target.files && handleUpload(e.target.files)} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  <p className="text-xs text-text-muted">Uploading…</p>
                </div>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-text-muted/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-text-secondary hover:text-primary-600 transition-colors">
                    Upload files for {client.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-text-muted mt-1">or drag & drop · PDF, XLSX, JPG, PNG up to 25 MB</p>
                </>
              )}
            </div>

            {/* File list — grouped by category · bank */}
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-primary-400 animate-spin" /></div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-text-muted/20 mx-auto mb-2" />
                <p className="text-sm text-text-muted">No files yet</p>
              </div>
            ) : (() => {
              // Build groups: key = description (e.g. "Bank Statement · Chase") or "__none__"
              const groups: Record<string, typeof documents> = {};
              documents.forEach(doc => {
                const key = doc.description ?? '__none__';
                groups[key] = [...(groups[key] ?? []), doc];
              });
              const keys = Object.keys(groups).sort((a, b) => {
                if (a === '__none__') return 1;
                if (b === '__none__') return -1;
                return a.localeCompare(b);
              });
              return (
                <div className="space-y-4">
                  {keys.map(groupKey => {
                    const group = groups[groupKey];
                    const parts = groupKey === '__none__' ? [] : groupKey.split(' · ');
                    const category = parts[0] ?? null;
                    const bankName = parts[1] ?? null;
                    return (
                      <div key={groupKey} className="bg-card rounded-xl border border-border overflow-hidden">
                        {/* Group header */}
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-hover/50">
                          <Tag className="w-3 h-3 text-text-muted flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-text-primary">
                            {category ?? 'No Category'}
                          </span>
                          {bankName && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                              {bankName}
                            </span>
                          )}
                          <span className="ml-auto text-[10px] text-text-muted">
                            {group.length} file{group.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {/* Files in group */}
                        {group.map((doc, i) => {
                          const ext = doc.filename.split('.').pop()?.toLowerCase() ?? '';
                          const FileIcon = ext === 'pdf' ? FileText
                            : ext === 'xlsx' || ext === 'xls' ? FileSpreadsheet
                            : ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? Image
                            : File;
                          const sizeFmt = doc.file_size
                            ? doc.file_size > 1024 * 1024 ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(doc.file_size / 1024)} KB`
                            : '—';
                          const isClientUpload = doc.uploaded_by === null;
                          return (
                            <motion.div key={doc.id}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                              className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors items-center group">
                              <div className="w-8 h-8 rounded-lg bg-primary-50/70 flex items-center justify-center">
                                <FileIcon className="w-4 h-4 text-primary-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-text-primary truncate">{doc.filename}</p>
                                  {isClientUpload && (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-accent-500/10 text-accent-600 rounded-full flex-shrink-0">
                                      Client
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-text-muted">
                                  {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <p className="text-xs text-text-muted whitespace-nowrap">{sizeFmt}</p>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.button onClick={() => handleDownload(doc.file_path, doc.filename)}
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  className="p-1.5 rounded-lg hover:bg-primary-50 text-text-muted hover:text-primary-600 transition-colors" title="Download">
                                  <Download className="w-3.5 h-3.5" />
                                </motion.button>
                                <motion.button onClick={() => handleDeleteFile(doc.id, doc.file_path)}
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ──── TASKS ──── */}
        {tab === 'tasks' && (
          <div className="space-y-3">
            {/* Add task form */}
            <AnimatePresence>
              {showTaskForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="bg-white rounded-xl border border-border p-4 space-y-3">
                  <input
                    type="text" placeholder="Task title…" value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    autoFocus
                    className="w-full h-9 px-3 text-sm bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 placeholder:text-text-muted" />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)}
                        className="flex-1 h-9 px-3 text-sm bg-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
                    </div>
                    <button onClick={() => { setShowTaskForm(false); setNewTaskTitle(''); setNewTaskDue(''); }}
                      className="h-9 px-3 rounded-lg border border-border text-sm text-text-muted hover:bg-surface-hover transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <motion.button onClick={handleAddTask} disabled={!newTaskTitle.trim() || addingTask}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors">
                      {addingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add Task
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showTaskForm && (
              <div className="flex gap-2">
                <motion.button onClick={() => setShowTaskForm(true)}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-text-muted hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all">
                  <Plus className="w-4 h-4" />Assign task
                </motion.button>
                <motion.button onClick={() => setShowTemplate(true)}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-dashed border-accent-200 text-sm text-accent-600 hover:border-accent-400 hover:bg-accent-50/50 transition-all font-medium">
                  <Sparkles className="w-4 h-4" />Apply Template
                </motion.button>
              </div>
            )}

            {/* Task list */}
            {clientWorkItems.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-10 h-10 text-text-muted/20 mx-auto mb-2" />
                <p className="text-sm text-text-muted">No tasks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientWorkItems.map((item, i) => {
                  const status = statusConfig[item.status] ?? statusConfig['not-started'];
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 bg-white rounded-xl border border-border p-3 hover:bg-surface-hover/50 transition-colors group">
                      <div className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                        item.status === 'completed' ? 'bg-success' : item.status === 'in-progress' ? 'bg-primary-500' : 'bg-text-muted/40')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{item.title}</p>
                        {item.due_date && (
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', status.bg, status.color)}>
                        {status.label}
                      </span>
                      <motion.button onClick={() => deleteWorkItem(item.id)}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all text-text-muted hover:text-danger">
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function PortalsPage() {
  const { clients, loading: clientsLoading } = useClients();
  const supabase = useSupabase();

  const [search,          setSearch]         = useState('');
  const [selectedClient,  setSelectedClient] = useState<Client | null>(null);

  // Unread counts per client (from portal_messages)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const fetchUnread = useCallback(async () => {
    const { data } = await supabase
      .from('portal_messages')
      .select('client_id')
      .eq('is_from_client', true)
      .is('read_at', null);
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((r: { client_id: string }) => { map[r.client_id] = (map[r.client_id] ?? 0) + 1; });
      setUnreadMap(map);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUnread();
    const ch = supabase.channel('portals-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_messages' }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchUnread, supabase]);

  // When selecting a client, clear their unread badge
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setUnreadMap(prev => ({ ...prev, [client.id]: 0 }));
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0);

  return (
    <AppShell
      title="Client Portals"
      subtitle={totalUnread > 0 ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}` : 'Manage your client portals'}>
      <div className="flex gap-0 h-[calc(100vh-128px)] bg-white rounded-2xl border border-border overflow-hidden shadow-sm">

        {/* ── Left: Client List ── */}
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-border">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text" placeholder="Search clients…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 placeholder:text-text-muted" />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {clientsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-text-muted">No clients found</p>
              </div>
            ) : filtered.map(client => {
              const unread = unreadMap[client.id] ?? 0;
              const isSelected = selectedClient?.id === client.id;
              return (
                <motion.button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  whileHover={{ backgroundColor: isSelected ? undefined : 'rgba(0,0,0,0.02)' }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 text-left transition-colors',
                    isSelected ? 'bg-primary-50' : 'hover:bg-surface-hover'
                  )}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-accent-400 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-medium truncate', isSelected ? 'text-primary-700' : 'text-text-primary')}>
                      {client.name}
                    </p>
                    <p className="text-[10px] text-text-muted truncate">{client.company || client.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {client.portal_user_id ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-success" title="Portal active" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted/30" title="No portal" />
                    )}
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-danger text-white text-[9px] font-bold leading-none">
                        {unread}
                      </span>
                    )}
                    {isSelected && <ChevronRight className="w-3 h-3 text-primary-500" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border bg-surface-hover/30">
            <p className="text-[10px] text-text-muted text-center">
              {clients.filter(c => c.portal_user_id).length} of {clients.length} clients have portal access
            </p>
          </div>
        </div>

        {/* ── Right: Selected Client Panel ── */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedClient ? (
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full">
                <ClientPanel client={selectedClient} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-primary-300" />
                </div>
                <p className="text-base font-semibold text-text-primary mb-1">Select a client</p>
                <p className="text-sm text-text-muted max-w-xs">
                  Choose a client from the list to manage their portal — messages, files, and tasks.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
