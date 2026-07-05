/*
# Add admin roles, favorites, and enhanced features

1. New Tables:
- `user_roles` - Admin role management
  - user_id (uuid, references auth.users)
  - role (text: 'admin', 'moderator')
  - created_at (timestamp)

- `favorites` - User favorites/bookmarks
  - id (uuid, primary key)
  - user_id (uuid, references auth.users)
  - listing_id (uuid, references listings)
  - created_at (timestamp)

- `reports` - Content reports for moderation
  - id (uuid, primary key)
  - listing_id (uuid, references listings)
  - reporter_id (uuid, references auth.users)
  - reason (text)
  - status (text: 'pending', 'reviewed', 'resolved')
  - reviewed_by (uuid, references auth.users)
  - created_at (timestamp)

2. Security
- Enable RLS on all tables
- Only admins can manage roles
- Users can only favorite their own favorites
- Admins can view and manage reports
*/

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- User roles policies (only admins can manage)
DROP POLICY IF EXISTS "public_read_roles" ON user_roles;
CREATE POLICY "public_read_roles" ON user_roles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_roles" ON user_roles;
CREATE POLICY "admin_insert_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_roles" ON user_roles;
CREATE POLICY "admin_delete_roles" ON user_roles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Favorites policies
DROP POLICY IF EXISTS "read_own_favorites" ON favorites;
CREATE POLICY "read_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Reports policies
DROP POLICY IF EXISTS "admin_read_reports" ON reports;
CREATE POLICY "admin_read_reports" ON reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())
    OR reporter_id = auth.uid()
  );

DROP POLICY IF EXISTS "user_insert_reports" ON reports;
CREATE POLICY "user_insert_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "admin_update_reports" ON reports;
CREATE POLICY "admin_update_reports" ON reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_listing ON reports(listing_id);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update listings_count when listing is added
CREATE OR REPLACE FUNCTION update_listings_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET listings_count = (
    SELECT COUNT(*) FROM listings WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_listings_count ON listings;
CREATE TRIGGER trigger_update_listings_count
AFTER INSERT OR DELETE ON listings
FOR EACH ROW EXECUTE FUNCTION update_listings_count();