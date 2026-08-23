import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, requireStaff } from '@/lib/server/route-auth';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireStaff(request);
    if ('response' in auth) return auth.response;

    const { threadId } = await request.json();
    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Delete all messages in the thread but keep the thread itself
    const { error } = await supabase
      .from('internal_messages')
      .delete()
      .eq('thread_id', threadId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reset the thread's last_message_preview
    await supabase
      .from('internal_threads')
      .update({ last_message_preview: null, last_message_at: new Date().toISOString() })
      .eq('id', threadId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
