-- Replace the generic 8-category seed with 11 species-specific categories.
-- Each category represents one distinct animal/product rather than a broad
-- grouping, per product decision. Existing category rows are removed and
-- re-seeded; any listing referencing a removed category falls back to NULL
-- (listings.category_id is ON DELETE SET NULL) rather than being deleted.

DELETE FROM categories;

INSERT INTO categories (name, name_en, icon, slug, sort_order) VALUES
  ('Poussins', 'Chicks', '🐤', 'poussins', 1),
  ('Poulets', 'Chickens', '🐔', 'poulets', 2),
  ('Dindes', 'Turkeys', '🦃', 'dindes', 3),
  ('Pintades', 'Guinea fowl', '🐦', 'pintades', 4),
  ('Canards & Oies', 'Ducks & Geese', '🦆', 'canards-oies', 5),
  ('Pigeons', 'Pigeons', '🕊️', 'pigeons', 6),
  ('Cailles', 'Quails', '🐦', 'cailles', 7),
  ('Œufs', 'Eggs', '🥚', 'oeufs', 8),
  ('Matériel d''élevage', 'Farming equipment', '🧰', 'materiel-elevage', 9),
  ('Produits vétérinaires', 'Veterinary products', '💊', 'produits-veterinaires', 10),
  ('Aliments', 'Feed', '🌾', 'aliments', 11)
ON CONFLICT (slug) DO NOTHING;
