/*
# Update listings table to allow sample data

1. Changes
- Make user_id nullable (drop NOT NULL constraint) to allow sample listings without requiring authentication
- This enables demo functionality with pre-populated listings

2. Security
- RLS policies remain unchanged
- Users can still only modify their own listings when authenticated
*/

ALTER TABLE listings ALTER COLUMN user_id DROP NOT NULL;