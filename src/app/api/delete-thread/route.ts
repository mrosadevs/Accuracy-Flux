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
