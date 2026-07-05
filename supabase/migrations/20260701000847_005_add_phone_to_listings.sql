-- Add phone column to listings for direct contact
ALTER TABLE listings ADD COLUMN IF NOT EXISTS phone text DEFAULT '';

-- Add index for phone searches
CREATE INDEX IF NOT EXISTS idx_listings_phone ON listings(phone);