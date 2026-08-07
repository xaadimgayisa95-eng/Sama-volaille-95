-- Categories had no UPDATE policy at all, so admins couldn't set image_url
-- from the app (AdminCategoriesScreen) even though the column existed.

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));
