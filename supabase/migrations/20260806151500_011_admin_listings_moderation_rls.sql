-- Admins (present in user_roles) must be able to update/delete ANY listing,
-- not just their own. The existing update_own_listings / delete_own_listings
-- policies only cover the owner, which silently broke AdminListingsScreen's
-- status-change, delete, and the new "featured" toggle for listings the
-- admin does not personally own. Postgres RLS combines multiple permissive
-- policies with OR, so this adds admin access without touching owner access.

DROP POLICY IF EXISTS "admin_update_listings" ON listings;
CREATE POLICY "admin_update_listings" ON listings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admin_delete_listings" ON listings;
CREATE POLICY "admin_delete_listings" ON listings FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));
