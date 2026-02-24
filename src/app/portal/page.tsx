'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Download, CheckCircle2, Clock,
  Shield, Lock, Eye, MessageSquare,
  ChevronRight, Zap, ArrowRight, File, Image,
  FileSpreadsheet, Send
} from 'lucide-react';
import clsx from 'clsx';
import { usePortal } from '@/lib/hooks/use-portal';

// Using a demo client ID for the portal page (in production this comes from auth session)
const PORTAL_CLIENT_ID = 'portal';

const clientTasks = [
  { id: 1, title: 'Upload W-2 forms for 2025', status: 'pending', dueDate: '2026-02-28', priority: 'high' },
  { id: 2, title: 'Review and approve tax return draft', status: 'pending', dueDate: '2026-03-10', priority: 'medium' },
  { id: 3, title: 'Sign engagement letter', status: 'completed', dueDate: '2026-02-15', priority: 'high' },
  { id: 4, title: 'Provide Q4 expense receipts', status: 'in-progress', dueDate: '2026-03-01', priority: 'medium' },
  { id: 5, title: 'Verify business information', status: 'completed', dueDate: '2026-02-10', priority: 'low' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-warning', bg: 'bg-warning/10' },
  'in-progress': { label: 'In Progress', color: 'text-primary-600', bg: 'bg-primary-50' },
  completed: { label: 'Completed', color: 'text-success', bg: 'bg-success/10' },
};


export default function PortalPage() {
  const { documents, messages, uploadDocument, sendMessage } = usePortal(PORTAL_CLIENT_ID);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'tasks' | 'files' | 'messages'>('tasks');
  const [messageText, setMessageText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      setUploadProgress(0);
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 85) { clearInterval(progressInterval); return prev; }
          return prev + 15;
        });
      }, 150);
      try {
        await uploadDocument(file, PORTAL_CLIENT_ID);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
      } catch {
        setUploadProgress(null);
      } finally {
        clearInterval(progressInterval);
      }
    }
  }, [uploadDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  }, [handleFilesUpload]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim()) return;
    await sendMessage(PORTAL_CLIENT_ID, messageText.trim(), 'Robert Johnson', true);
    setMessageText('');
  }, [messageText, sendMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Portal Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <span className="text-sm font-bold text-text-primary">Accuracy Flux</span>
              <span className="text-[10px] text-text-muted block">Client Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-semibold">
              <Shield className="w-3 h-3" />
              Encrypted & Secure
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-hover">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-[9px] font-bold text-white">
                RJ
              </div>
              <span className="text-sm font-medium text-text-primary">Robert Johnson</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-6 text-white mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <h1 className="text-2xl font-bold mb-1">Welcome back, Robert</h1>
            <p className="text-sm opacity-80">You have 2 pending tasks and 3 documents ready for review.</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">3/5 Tasks Complete</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">4 Documents Uploaded</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { id: 'tasks' as const, label: 'My Tasks', icon: CheckCircle2 },
            { id: 'files' as const, label: 'Documents', icon: FileText },
            { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeSection === tab.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'bg-white text-text-secondary border border-border hover:bg-surface-hover'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeSection === 'tasks' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-border p-5"
              >
                <h2 className="text-sm font-semibold text-text-primary mb-4">Your Tasks</h2>
                <div className="space-y-2">
                  {clientTasks.map((task, i) => {
                    const status = statusConfig[task.status];
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer group"
                      >
                        <div className={clsx(
                          'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          task.status === 'completed'
                            ? 'bg-success border-success'
                            : 'border-border group-hover:border-primary-400'
                        )}>
                          {task.status === 'completed' && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={clsx(
                            'text-sm font-medium',
                            task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'
                          )}>
                            {task.title}
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', status.bg, status.color)}>
                          {status.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeSection === 'files' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={clsx(
                    'relative bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-all',
                    isDragging
                      ? 'border-primary-400 bg-primary-50/50 scale-[1.01]'
                      : 'border-border hover:border-primary-300'
                  )}
                >
                  <AnimatePresence>
                    {isDragging && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-primary-500/5 rounded-2xl flex items-center justify-center"
                      >
                        <p className="text-lg font-bold text-primary-600">Drop files here</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {uploadProgress !== null ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-primary-600 animate-pulse" />
                      </div>
                      <p className="text-sm font-medium text-text-primary">
                        {uploadProgress < 100 ? 'Encrypting & Uploading...' : 'Upload Complete!'}
                      </p>
                      <div className="max-w-xs mx-auto">
                        <div className="h-2 bg-background rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className={clsx(
                              'h-full rounded-full transition-all',
                              uploadProgress === 100 ? 'bg-success' : 'bg-gradient-to-r from-primary-400 to-primary-600'
                            )}
                          />
                        </div>
                        <p className="text-xs text-text-muted mt-1">{uploadProgress}% - AES-256 encrypted</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-7 h-7 text-primary-600" />
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={e => e.target.files && handleFilesUpload(e.target.files)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-semibold text-text-primary mb-1 hover:text-primary-600 transition-colors"
                      >
                        Drag & drop files here, or click to browse
                      </button>
                      <p className="text-xs text-text-muted mb-3">
                        PDF, XLSX, JPG, PNG up to 25MB each
                      </p>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted">
                        <Lock className="w-3 h-3" />
                        End-to-end encrypted with AES-256
                        <span className="mx-1">&middot;</span>
                        <Shield className="w-3 h-3" />
                        SOC 2 Type II Certified
                      </div>
                    </>
                  )}
                </div>

                {/* Uploaded Files */}
                <div className="bg-white rounded-2xl border border-border p-5">
                  <h2 className="text-sm font-semibold text-text-primary mb-4">
                    Uploaded Documents ({documents.length})
                  </h2>
                  <div className="space-y-2">
                    {documents.map((doc, i) => {
                      const ext = doc.filename.split('.').pop()?.toLowerCase() ?? '';
                      const FileIcon = ext === 'pdf' ? FileText : ext === 'xlsx' || ext === 'xls' ? FileSpreadsheet : ext === 'jpg' || ext === 'png' ? Image : File;
                      const sizeMB = doc.file_size ? (doc.file_size > 1024 * 1024 ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(doc.file_size / 1024)} KB`) : '—';
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{doc.filename}</p>
                            <p className="text-[10px] text-text-muted">{sizeMB} &middot; Uploaded {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-success font-medium">
                            <Lock className="w-3 h-3" />
                            Encrypted
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white rounded-lg">
                            <Download className="w-4 h-4 text-text-muted" />
                          </button>
                        </motion.div>
                      );
                    })}
                    {documents.length === 0 && (
                      <p className="text-xs text-text-muted text-center py-6">No documents uploaded yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'messages' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-border p-5"
              >
                <h2 className="text-sm font-semibold text-text-primary mb-4">Messages</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={clsx('flex gap-3', msg.is_from_client && 'flex-row-reverse')}
                    >
                      <div className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0',
                        !msg.is_from_client ? 'bg-gradient-to-br from-primary-400 to-primary-600' : 'bg-gradient-to-br from-accent-400 to-pink-500'
                      )}>
                        {(msg.sender_name ?? 'U').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className={clsx(
                        'max-w-[70%] rounded-2xl p-3',
                        !msg.is_from_client ? 'bg-surface-hover rounded-tl-md' : 'bg-primary-50 rounded-tr-md'
                      )}>
                        <p className="text-sm text-text-primary">{msg.message}</p>
                        <p className="text-[10px] text-text-muted mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-xs text-text-muted text-center py-6">No messages yet.</p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 h-10 px-4 text-sm bg-surface-hover rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/20 placeholder:text-text-muted"
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Security Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                Security
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'AES-256 Encryption', desc: 'All files encrypted at rest', icon: Lock },
                  { label: 'TLS 1.3', desc: 'Secure data transmission', icon: Shield },
                  { label: '2FA Enabled', desc: 'Two-factor authentication active', icon: CheckCircle2 },
                  { label: 'SOC 2 Type II', desc: 'Certified compliance', icon: Eye },
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

            {/* Quick Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-border p-5"
            >
              <h3 className="text-sm font-semibold text-text-primary mb-3">Your Accountant</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold text-white">
                  SC
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Sarah Chen</p>
                  <p className="text-xs text-text-muted">Senior Accountant</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Send Message
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
