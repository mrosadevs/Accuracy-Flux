'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Download, CheckCircle2,
  Shield, Lock, Eye, MessageSquare,
  ChevronRight, Zap, File, Image,
  FileSpreadsheet, Send, LogOut, Loader2, AlertCircle, Trash2, Tag,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';
import { usePortal, usePortalClient } from '@/lib/hooks/use-portal';
import { useSupabase } from '@/lib/hooks/use-supabase';
import { useRouter } from 'next/navigation';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  'not-started':       { label: 'Pending',      color: 'text-warning',     bg: 'bg-warning/10'   },
  'in-progress':       { label: 'In Progress',  color: 'text-primary-600', bg: 'bg-primary-50'   },
  'waiting-on-client': { label: 'Awaiting You', color: 'text-amber-600',   bg: 'bg-amber-50'     },
  'in-review':         { label: 'In Review',    color: 'text-purple-600',  bg: 'bg-purple-50'    },
  completed:           { label: 'Completed',    color: 'text-success',     bg: 'bg-success/10'   },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PortalPage() {
  const supabase = useSupabase();
  const router   = useRouter();
  const { client, workItems, authLoading, userRole } = usePortalClient();

  useEffect(() => {
    if (!authLoading && !client && userRole && userRole !== 'client') {
      router.replace('/dashboard');
    }
  }, [authLoading, client, userRole, router]);

  const { documents, messages, loading, uploadDocument, deleteDocument, getDownloadUrl, sendMessage } = usePortal(client?.id);

  const [isDragging,      setIsDragging]      = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState<number | null>(null);
  const [uploadCategory,  setUploadCategory]  = useState('');
  const [activeSection,   setActiveSection]   = useState<'tasks' | 'files' | 'messages'>('tasks');
  const [messageText,     setMessageText]     = useState('');
  const [sending,         setSending]         = useState(false);
  const [signingOut,      setSigningOut]      = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const FILE_CATEGORIES = ['Bank Statement', 'Tax Document', 'Invoice', 'Receipt', 'Payroll', 'Other'];

  const pendingCount   = workItems.filter(t => t.status !== 'completed').length;
  const completedCount = workItems.filter(t => t.status === 'completed').length;
  const unreadMessages = messages.filter(m => !m.is_from_client).length;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
    } catch { /* ignore */ }
    window.location.href = '/login';
  };

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    if (!client?.id) return;
    for (const file of Array.from(files)) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 85) { clearInterval(interval); return prev; }
          return prev + 15;
        });
      }, 150);
      try {
        await uploadDocument(file, client.id, null, uploadCategory || undefined);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
      } catch {
        setUploadProgress(null);
      } finally {
        clearInterval(interval);
      }
    }
  }, [uploadDocument, client?.id, uploadCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFilesUpload(e.dataTransfer.files);
  }, [handleFilesUpload]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !client || sending) return;
    setSending(true);
    try {
      await sendMessage(client.id, messageText.trim(), client.name, true);
      setMessageText('');
    } finally {
      setSending(false);
    }
  }, [messageText, sendMessage, client, sending]);

  const handleDownload = useCallback(async (filePath: string, filename: string) => {
    const url = await getDownloadUrl(filePath);
    if (url && url !== '#') {
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.target = '_blank';
      a.click();
    }
  }, [getDownloadUrl]);

  /* ─── Loading ─── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading your portal…</p>
        </div>
      </div>
    );
  }

  /* ─── No client record found ─── */
  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
          <h2 className="text-base font-bold text-text-primary mb-2">Portal access not found</h2>
          <p className="text-sm text-text-muted mb-4">
            Your account isn&apos;t linked to a client record yet. Please contact your accountant.
          </p>
          <button onClick={handleSignOut} className="text-sm text-primary-600 hover:underline">
            Sign out and try again
          </button>
        </div>
      </div>
    );
  }

  const clientInitials     = getInitials(client.name);
  const accountantName     = client.assigned_to?.trim() || 'Accuracy Flux';
  const accountantInitials = accountantName !== 'Accuracy Flux' ? getInitials(accountantName) : 'AF';

  const tabs = [
    { id: 'tasks'    as const, label: 'My Tasks',  shortLabel: 'Tasks', icon: CheckCircle2  },
    { id: 'files'    as const, label: 'Documents', shortLabel: 'Docs',  icon: FileText      },
    { id: 'messages' as const, label: 'Messages',  shortLabel: 'Chat',  icon: MessageSquare },
  ];

  return (
    /* h-screen + overflow-y-auto fixes body { overflow: hidden } from globals.css */
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">

      {/* ── Header ── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <motion.div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gradient-accent flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.div>
            <div className="leading-tight">
              <span className="text-sm font-bold text-text-primary block">Accuracy Flux</span>
              <span className="text-[10px] text-text-muted">Client Portal</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Security badge — desktop only */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-semibold">
              <Shield className="w-3 h-3" />Encrypted &amp; Secure
            </div>

            {/* User chip */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-surface-hover">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                {clientInitials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-text-primary">{client.name}</span>
            </div>

            {/* Sign out — icon-only on mobile */}
            <motion.button
              onClick={handleSignOut}
              disabled={signingOut}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-border text-text-secondary hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-colors disabled:opacity-50"
            >
              {signingOut
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogOut className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs font-medium">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

        {/* ── Welcome Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-5 sm:p-6 text-white mb-5 sm:mb-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              Welcome back, {client.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm opacity-80 max-w-xl">
              {pendingCount > 0
                ? `${pendingCount} active item${pendingCount !== 1 ? 's' : ''} in progress${documents.length > 0 ? ` · ${documents.length} document${documents.length !== 1 ? 's' : ''} on file` : ''}.`
                : documents.length > 0
                  ? `All caught up! ${documents.length} document${documents.length !== 1 ? 's' : ''} on file.`
                  : 'Your portal is all set. Upload documents or send a message to get started.'}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">{completedCount}/{workItems.length} Tasks</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">{documents.length} Doc{documents.length !== 1 ? 's' : ''}</span>
              </div>
              {unreadMessages > 0 && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium">{unreadMessages} New</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Mobile: Accountant quick-contact card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:hidden mb-4"
        >
          <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {accountantInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{accountantName}</p>
              <p className="text-[10px] text-text-muted">Your Accountant</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveSection('messages')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors flex-shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex items-stretch gap-1.5 sm:gap-2 mb-5 sm:mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={clsx(
                'flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-all text-xs sm:text-sm relative',
                activeSection === tab.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'bg-white text-text-secondary border border-border hover:bg-surface-hover'
              )}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {/* Badge for messages */}
              {tab.id === 'messages' && unreadMessages > 0 && activeSection !== 'messages' && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">

            {/* ── Tasks ── */}
            <AnimatePresence mode="wait">
              {activeSection === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-border p-4 sm:p-5"
                >
                  <h2 className="text-sm font-semibold text-text-primary mb-4">My Tasks</h2>
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                    </div>
                  ) : workItems.length === 0 ? (
                    <div className="text-center py-10">
                      <CheckCircle2 className="w-10 h-10 text-success/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-text-primary">No tasks assigned yet</p>
                      <p className="text-xs text-text-muted mt-1">Your accountant will assign tasks here when needed.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {workItems.map((item, i) => {
                        const status = statusConfig[item.status] ?? statusConfig['not-started'];
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-hover active:bg-surface-hover transition-colors"
                          >
                            <div className={clsx(
                              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                              item.status === 'completed'
                                ? 'bg-success border-success'
                                : 'border-border'
                            )}>
                              {item.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={clsx(
                                'text-sm font-medium leading-snug',
                                item.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'
                              )}>
                                {item.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', status.bg, status.color)}>
                                  {status.label}
                                </span>
                                {item.due_date && (
                                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                    <Clock className="w-3 h-3" />
                                    Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Documents ── */}
              {activeSection === 'files' && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Upload zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => uploadProgress === null && fileInputRef.current?.click()}
                    className={clsx(
                      'relative bg-white rounded-2xl border-2 border-dashed p-5 sm:p-8 text-center transition-all cursor-pointer',
                      isDragging
                        ? 'border-primary-400 bg-primary-50/50 scale-[1.01]'
                        : 'border-border hover:border-primary-300 hover:bg-primary-50/30 active:bg-primary-50/50'
                    )}
                  >
                    <AnimatePresence>
                      {isDragging && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-primary-500/5 rounded-2xl flex items-center justify-center"
                        >
                          <p className="text-lg font-bold text-primary-600">Drop files here</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Category selector */}
                    {uploadProgress === null && (
                      <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Category</span>
                        </div>
                        <select
                          value={uploadCategory}
                          onChange={e => setUploadCategory(e.target.value)}
                          className="w-full sm:w-auto h-9 px-3 text-xs bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-text-primary"
                        >
                          <option value="">General / No category</option>
                          {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}

                    {uploadProgress !== null ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6 text-primary-600 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-text-primary">
                          {uploadProgress < 100 ? 'Encrypting & Uploading…' : '✓ Upload Complete!'}
                        </p>
                        <div className="max-w-xs mx-auto">
                          <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className={clsx('h-full rounded-full', uploadProgress === 100 ? 'bg-success' : 'bg-gradient-to-r from-primary-400 to-primary-600')}
                            />
                          </div>
                          <p className="text-xs text-text-muted mt-1">{uploadProgress}% — AES-256 encrypted</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" />
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          multiple
                          onChange={e => e.target.files && handleFilesUpload(e.target.files)}
                        />
                        <p className="text-sm font-semibold text-text-primary mb-1">
                          <span className="hidden sm:inline">Drag &amp; drop files here, or </span>
                          <span className="text-primary-600 underline underline-offset-2">tap to browse</span>
                        </p>
                        <p className="text-xs text-text-muted mb-3">PDF, XLSX, JPG, PNG up to 25 MB</p>
                        <div className="flex items-center justify-center gap-3 text-[10px] text-text-muted">
                          <span className="flex items-center gap-1"><Lock className="w-3 h-3" />AES-256</span>
                          <span className="opacity-40">·</span>
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />SOC 2</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* File list */}
                  <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
                    <h2 className="text-sm font-semibold text-text-primary mb-4">
                      Uploaded Documents
                      {documents.length > 0 && (
                        <span className="ml-2 text-[11px] font-normal text-text-muted">({documents.length})</span>
                      )}
                    </h2>
                    {loading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                        <p className="text-xs text-text-muted">No documents uploaded yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {documents.map((doc, i) => {
                          const ext = doc.filename.split('.').pop()?.toLowerCase() ?? '';
                          const FileIcon =
                            ext === 'pdf' ? FileText
                            : ext === 'xlsx' || ext === 'xls' ? FileSpreadsheet
                            : ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? Image
                            : File;
                          const sizeFmt = doc.file_size
                            ? doc.file_size > 1024 * 1024
                              ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
                              : `${Math.round(doc.file_size / 1024)} KB`
                            : '';
                          return (
                            <motion.div
                              key={doc.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover active:bg-surface-hover transition-colors group"
                            >
                              {/* Icon */}
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                                <FileIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                              </div>

                              {/* Name & meta */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">{doc.filename}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {sizeFmt && <span className="text-[10px] text-text-muted">{sizeFmt}</span>}
                                  <span className="text-[10px] text-text-muted">
                                    {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  {doc.description && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                                      <Tag className="w-2.5 h-2.5" />{doc.description}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions — always visible on mobile, hover on desktop */}
                              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDownload(doc.file_path, doc.filename)}
                                  className="p-2 rounded-lg hover:bg-primary-50 active:bg-primary-100 transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4 text-text-muted" />
                                </button>
                                {doc.uploaded_by === null && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Delete this file?')) return;
                                      await deleteDocument(doc.id, doc.file_path);
                                    }}
                                    className="p-2 rounded-lg hover:bg-danger/10 active:bg-danger/20 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-danger" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── Messages ── */}
              {activeSection === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-border overflow-hidden"
                >
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border-light">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {accountantInitials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{accountantName}</p>
                      <p className="text-[10px] text-success flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                        Available
                      </p>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="space-y-3 h-[50vh] sm:h-[400px] overflow-y-auto px-4 sm:px-5 py-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <MessageSquare className="w-10 h-10 text-text-muted/25" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">No messages yet</p>
                          <p className="text-xs text-text-muted mt-1">Say hi to your accountant below 👇</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, i) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={clsx('flex gap-2.5', msg.is_from_client && 'flex-row-reverse')}
                        >
                          <div className={clsx(
                            'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0',
                            !msg.is_from_client
                              ? 'bg-gradient-to-br from-primary-400 to-primary-600'
                              : 'bg-gradient-to-br from-accent-400 to-pink-500'
                          )}>
                            {(msg.sender_name ?? 'U').split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className={clsx(
                            'max-w-[78%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5',
                            !msg.is_from_client
                              ? 'bg-surface-hover rounded-tl-md'
                              : 'bg-primary-600 text-white rounded-tr-md'
                          )}>
                            <p className={clsx('text-sm leading-relaxed', msg.is_from_client ? 'text-white' : 'text-text-primary')}>
                              {msg.message}
                            </p>
                            <p className={clsx('text-[10px] mt-1', msg.is_from_client ? 'text-white/60' : 'text-text-muted')}>
                              {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 sm:px-5 py-3 border-t border-border-light bg-surface-hover/30">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type a message…"
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !sending && handleSendMessage()}
                        className="flex-1 h-10 px-4 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 placeholder:text-text-muted"
                      />
                      <motion.button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sending}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 flex-shrink-0"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Sidebar (desktop only) ── */}
          <div className="hidden lg:block space-y-4">
            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />Security
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'AES-256 Encryption',    desc: 'All files encrypted at rest',         icon: Lock         },
                  { label: 'TLS 1.3',               desc: 'Secure data transmission',            icon: Shield       },
                  { label: 'Secure Authentication', desc: 'Protected login via invite links',    icon: CheckCircle2 },
                  { label: 'Private & Confidential',desc: 'Visible only to you & your team',     icon: Eye          },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{item.label}</p>
                      <p className="text-[10px] text-text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Accountant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text-primary mb-3">Your Accountant</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold text-white">
                  {accountantInitials}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{accountantName}</p>
                  <p className="text-xs text-text-muted">Accuracy Flux</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection('messages')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />Send Message
              </motion.button>
            </motion.div>
          </div>

        </div>

        {/* ── Mobile Security footer ── */}
        <div className="lg:hidden mt-6 pb-4">
          <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-success" />AES-256 Encrypted</span>
            <span className="opacity-30">·</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-success" />SOC 2 Type II</span>
            <span className="opacity-30">·</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-success" />Private</span>
          </div>
        </div>

      </div>
    </div>
  );
}
