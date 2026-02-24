import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses the service role key so it bypasses RLS — safe because this route is
// only called from authenticated sessions on the server.
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

    // Delete child messages first (avoids FK constraint)
    await supabase.from('internal_messages').delete().eq('thread_id', threadId);

    // Delete the thread
    const { error } = await supabase.from('internal_threads').delete().eq('id', threadId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
