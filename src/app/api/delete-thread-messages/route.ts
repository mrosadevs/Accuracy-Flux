import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function DELETE(request: NextRequest) {
  try {
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
