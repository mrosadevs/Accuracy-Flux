import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, requireClientAccess } from '@/lib/server/route-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { workItemId, clientId, clientName, workItemTitle, newStatus } = body as {
      workItemId?: string;
      clientId?: string;
      clientName?: string;
      workItemTitle?: string;
      newStatus?: string;
    };

    if (!workItemId || !clientId || !clientName || !workItemTitle || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Portal users may only toggle between done / not done — never arbitrary statuses
    if (newStatus !== 'completed' && newStatus !== 'not-started') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const auth = await requireClientAccess(request, clientId);
    if ('response' in auth) return auth.response;

    const admin = createAdminClient();

    // Security: make sure the work item actually belongs to this client and is portal-visible
    const { data: workItem } = await admin
      .from('work_items')
      .select('client_id, show_in_portal')
      .eq('id', workItemId)
      .single();

    if (!workItem) return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    if (workItem.client_id !== clientId) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    if (!workItem.show_in_portal) return NextResponse.json({ error: 'Not portal-visible' }, { status: 403 });

    // Update the work item status
    const { error: updateError } = await admin
      .from('work_items')
      .update({ status: newStatus })
      .eq('id', workItemId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Create a staff notification via portal_messages
    const emoji = newStatus === 'completed' ? '✅' : '↩️';
    const label = newStatus === 'completed' ? 'marked as complete' : 'marked as incomplete';
    await admin.from('portal_messages').insert({
      client_id: clientId,
      sender_name: clientName,
      message: `${emoji} ${clientName} ${label}: "${workItemTitle}"`,
      is_from_client: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
