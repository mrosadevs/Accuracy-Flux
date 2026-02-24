import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only: uses the service role key to send invite emails
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, email, clientName } = await request.json();

    if (!clientId || !email) {
      return NextResponse.json({ error: 'clientId and email are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Send the invitation email via Supabase Auth
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') || ''}/auth/callback?redirect=/portal`,
      data: {
        role: 'client',
        client_id: clientId,
        name: clientName ?? email.split('@')[0],
      },
    });

    if (error) {
      console.error('Invite error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Pre-link the auth user to the client record so portal works immediately
    if (data.user) {
      await supabase
        .from('clients')
        .update({ portal_user_id: data.user.id })
        .eq('id', clientId);
    }

    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch (err: unknown) {
    console.error('Invite route error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
