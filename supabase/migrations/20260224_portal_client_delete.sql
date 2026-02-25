-- Allow clients to delete their own uploaded documents
-- (uploaded_by IS NULL identifies client-uploaded files)
CREATE POLICY "Clients can delete own portal docs"
  ON public.portal_documents FOR DELETE
  USING (
    uploaded_by IS NULL
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = portal_documents.client_id
        AND c.portal_user_id = auth.uid()
    )
  );

-- Allow clients to delete their own files from storage
-- (files are stored under clientId/ prefix)
CREATE POLICY "Clients can delete own portal storage files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portal-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::text FROM public.clients c
      WHERE c.portal_user_id = auth.uid()
    )
  );
