import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, requireClientAccess } from '@/lib/server/route-auth';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { clientId } = body as { clientId?: string };

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    const auth = await requireClientAccess(request, clientId);
    if ('response' in auth) return auth.response;

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('portal_messages')
      .delete()
      .eq('client_id', clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
