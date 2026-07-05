/*
# Update listings policies for owner-only modifications

1. Changes:
- Keep existing public read policy
- Update INSERT policy to require authentication (user must be logged in to create listings)
- Keep UPDATE and DELETE restricted to listing owners

2. Notes:
- This ensures users can only modify their own listings
- Anonymous users cannot create listings
*/

-- Drop and recreate INSERT policy to require auth
DROP POLICY IF EXISTS "insert_own_listings" ON listings;
CREATE POLICY "insert_own_listings" ON listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for listing images
-- Note: This creates the bucket configuration, actual bucket created via API
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listings bucket
DROP POLICY IF EXISTS "public_view_images" ON storage.objects;
CREATE POLICY "public_view_images" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "auth_upload_images" ON storage.objects;
CREATE POLICY "auth_upload_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'listings');

DROP POLICY IF EXISTS "auth_update_images" ON storage.objects;
CREATE POLICY "auth_update_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'listings');

DROP POLICY IF EXISTS "auth_delete_images" ON storage.objects;
CREATE POLICY "auth_delete_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'listings');