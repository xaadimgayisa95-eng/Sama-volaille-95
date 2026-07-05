-- Drop the FK from listings.user_id to auth.users and re-add pointing to profiles
-- This allows Supabase to automatically resolve profile:profiles(*) joins

-- First add a proper FK from listings.user_id to profiles(id)
-- profiles.id is the same as auth.users.id so data integrity is preserved
ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_user_id_fkey;

ALTER TABLE listings
  ADD CONSTRAINT listings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;