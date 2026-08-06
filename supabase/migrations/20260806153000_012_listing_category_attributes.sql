-- Flexible per-category attributes (breed, age, vaccination, equipment
-- condition, feed type, medicine expiry, etc.) without a schema explosion
-- of one column per category. Field sets are defined and validated in the
-- frontend (src/categoryFields.ts) per category slug; the column itself
-- stays a generic JSONB bag.

ALTER TABLE listings ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;
