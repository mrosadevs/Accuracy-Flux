import Link from 'next/link';
import { Zap, MailX, ArrowLeft } from 'lucide-react';

export default function InviteExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <MailX className="w-7 h-7 text-warning" />
          </div>

          <h1 className="text-lg font-bold text-text-primary mb-2">
            Invite Link Expired
          </h1>
          <p className="text-sm text-text-muted leading-relaxed mb-6">
            This invite link is no longer valid — it either expired or a newer
            invite was sent to your email address.
          </p>

          <div className="bg-surface-hover rounded-xl p-4 text-left mb-6">
            <p className="text-xs font-semibold text-text-secondary mb-2">What to do:</p>
            <ol className="text-xs text-text-muted space-y-1.5 list-decimal list-inside">
              <li>Check your inbox for a <strong>newer</strong> invite email</li>
              <li>Or ask your admin to send a fresh invite</li>
              <li>Click the link in the <strong>latest</strong> email only</li>
            </ol>
          </div>

          <Link href="/login"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        <p className="text-[10px] text-text-muted mt-6">Accuracy Flux · Practice Management</p>
      </div>
    </div>
  );
}
