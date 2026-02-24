import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();
    if (!email || !name) {
      return NextResponse.json({ error: 'email and name are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Redirect to the app's auth callback so staff can set their own password
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback`,
      data: { role: role ?? 'staff', name },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Pre-create a profile record for the invited staff member
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        role: role ?? 'staff',
        initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        color: '#3b82f6',
      }, { onConflict: 'id' });
    }

    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
