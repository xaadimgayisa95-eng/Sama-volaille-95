-- DAAN DOOLE product photo uploads.
-- Creates a public read bucket; writes are restricted to the store owner or platform admins.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-products',
  'store-products',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Public can view DAAN DOOLE product photos" ON storage.objects;
CREATE POLICY "Public can view DAAN DOOLE product photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'store-products');

DROP POLICY IF EXISTS "Store owners and admins can upload product photos" ON storage.objects;
CREATE POLICY "Store owners and admins can upload product photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'store-products'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Store owners and admins can update product photos" ON storage.objects;
CREATE POLICY "Store owners and admins can update product photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'store-products'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'store-products'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Store owners and admins can delete product photos" ON storage.objects;
CREATE POLICY "Store owners and admins can delete product photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'store-products'
  AND (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

NOTIFY pgrst, 'reload schema';
