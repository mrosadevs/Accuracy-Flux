import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  const { docId, filePath, clientId } = await request.json();
  if (!docId || !filePath || !clientId) {
    return NextResponse.json({ error: 'docId, filePath, and clientId are required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const admin = createClient(url, key, { auth: { persistSession: false } });

  // Security: only allow deleting client-uploaded files (uploaded_by IS NULL) for the given clientId
  const { data: doc } = await admin
    .from('portal_documents')
    .select('uploaded_by, client_id')
    .eq('id', docId)
    .single();

  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (doc.client_id !== clientId) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  if (doc.uploaded_by !== null) return NextResponse.json({ error: 'Cannot delete staff-uploaded files' }, { status: 403 });

  // Delete from storage
  await admin.storage.from('portal-documents').remove([filePath]);

  // Delete from DB
  const { error } = await admin.from('portal_documents').delete().eq('id', docId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
