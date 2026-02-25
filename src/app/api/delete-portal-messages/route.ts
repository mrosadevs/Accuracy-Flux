import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  const { clientId } = await request.json();
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });

  const { error } = await supabaseAdmin
    .from('portal_messages')
    .delete()
    .eq('client_id', clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
