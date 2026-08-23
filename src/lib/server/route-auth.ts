import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, type User } from '@supabase/supabase-js';

/**
 * Authorization guards for API routes that use the service-role key.
 *
 * The middleware only redirects unauthenticated *page* traffic — it does not
 * distinguish staff from portal clients.  Every service-role route must
 * therefore verify the caller itself before bypassing RLS.
 */

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Resolve the calling user from the request's Supabase auth cookies. */
export async function getRouteUser(request: NextRequest): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        /* read-only in route handlers */
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function isPortalClient(user: User): boolean {
  return user.user_metadata?.role === 'client';
}

/**
 * Require a staff member (any authenticated non-portal user).
 * Returns the user, or a NextResponse error to return directly.
 */
export async function requireStaff(
  request: NextRequest
): Promise<{ user: User } | { response: NextResponse }> {
  const user = await getRouteUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }
  if (isPortalClient(user)) {
    return { response: NextResponse.json({ error: 'Staff access required' }, { status: 403 }) };
  }
  return { user };
}

/**
 * Require either a staff member or the portal client that owns `clientId`
 * (verified against clients.portal_user_id — never trusted from the payload).
 */
export async function requireClientAccess(
  request: NextRequest,
  clientId: string
): Promise<{ user: User } | { response: NextResponse }> {
  const user = await getRouteUser(request);
  if (!user) {
    return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }
  if (!isPortalClient(user)) {
    return { user }; // staff
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('portal_user_id', user.id)
    .maybeSingle();

  if (!client) {
    return { response: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }
  return { user };
}
