-- Drop the FK from reports.reporter_id to auth.users and re-add pointing to profiles
-- Mirrors migration 006 (listings.user_id -> profiles), required so that
-- AdminReportsScreen.tsx can embed `reporter:profiles!reports_reporter_id_fkey(*)`
-- via PostgREST. profiles.id is the same as auth.users.id so data integrity
-- is preserved.

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;

ALTER TABLE reports
  ADD CONSTRAINT reports_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Also re-point reviewed_by for consistency (not currently embedded by the
-- frontend, but keeps both admin-facing FKs on reports pointing at profiles).
ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_reviewed_by_fkey;

ALTER TABLE reports
  ADD CONSTRAINT reports_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
