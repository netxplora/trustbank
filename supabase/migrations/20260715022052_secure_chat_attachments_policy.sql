INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat files securely" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat files securely"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_attachments'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (
    right(name, 4) IN ('.png', '.jpg', '.pdf') OR 
    right(name, 5) IN ('.jpeg', '.webp')
  )
);

CREATE POLICY "Authenticated users can view chat files securely"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_attachments'
  AND auth.role() = 'authenticated'
);
