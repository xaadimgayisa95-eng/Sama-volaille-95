-- Allow signed-in users (including anonymous test sessions) to create their own draft store.
-- This does not allow users to publish stores or create stores for another user.
DROP POLICY IF EXISTS "owners_insert_own_draft_stores" ON public.stores;
CREATE POLICY "owners_insert_own_draft_stores"
  ON public.stores FOR INSERT TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND status = 'draft'
  );
