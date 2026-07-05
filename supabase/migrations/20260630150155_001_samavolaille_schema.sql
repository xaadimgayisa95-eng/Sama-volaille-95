/*
# SamaVolaille Database Schema

1. New Tables
- `profiles` - User profiles extending auth.users
  - id (uuid, primary key, references auth.users)
  - name (text, display name)
  - phone (text, contact phone)
  - location (text, user location/region)
  - avatar_url (text, optional avatar image)
  - verified (boolean, seller verification status)
  - listings_count (integer, number of active listings)
  - created_at (timestamp)

- `categories` - Poultry categories
  - id (uuid, primary key)
  - name (text, category name in French)
  - name_en (text, category name in English)
  - icon (text, emoji icon for the category)
  - slug (text, URL-friendly identifier)
  - sort_order (integer, display order)

- `listings` - Poultry listings/ads
  - id (uuid, primary key)
  - title (text, listing title)
  - description (text, detailed description)
  - price (integer, price in FCFA)
  - price_unit (text, price per unit e.g. "par poussin")
  - quantity (integer, available quantity)
  - category_id (uuid, references categories)
  - user_id (uuid, references auth.users)
  - location (text, pickup location)
  - status (text: 'available', 'reserved', 'sold')
  - featured (boolean, featured listing)
  - images (text[], array of image URLs)
  - created_at (timestamp)

2. Security
- Enable RLS on all tables
- Owner-scoped policies for profiles (users can only modify their own)
- Owner-scoped policies for listings (users can only modify their own)
- Public read access for categories
- Authenticated users can create listings
*/

-- Categories table (public read)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  icon text DEFAULT '🐔',
  slug text UNIQUE NOT NULL,
  sort_order integer DEFAULT 0
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  location text DEFAULT '',
  avatar_url text DEFAULT '',
  verified boolean DEFAULT false,
  listings_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  price integer NOT NULL,
  price_unit text DEFAULT '',
  quantity integer DEFAULT 1,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  location text DEFAULT '',
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  featured boolean DEFAULT false,
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policies for categories (public read, no write from frontend)
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Policies for profiles
DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for listings
DROP POLICY IF EXISTS "public_read_listings" ON listings;
CREATE POLICY "public_read_listings" ON listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_listings" ON listings;
CREATE POLICY "insert_own_listings" ON listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_listings" ON listings;
CREATE POLICY "update_own_listings" ON listings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_listings" ON listings;
CREATE POLICY "delete_own_listings" ON listings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, name_en, icon, slug, sort_order) VALUES
  ('Poussins', 'Chicks', '🐣', 'poussins', 1),
  ('Poulets de chair', 'Broilers', '🍗', 'poulets-de-chair', 2),
  ('Poules pondeuses', 'Layer hens', '🥚', 'poules-pondeuses', 3),
  ('Dindes', 'Turkeys', '🦃', 'dindes', 4),
  ('Canards', 'Ducks', '🦆', 'canards', 5),
  ('Oeufs', 'Eggs', '🥚', 'oeufs', 6),
  ('Coquelets', 'Roosters', '🐓', 'coquelets', 7),
  ('Autres', 'Other', '🐔', 'autres', 8)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(featured);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);