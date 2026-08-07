-- Admin-editable key/value settings (Wave link, Orange Money number,
-- WhatsApp confirmation number, featured-listing price), so the owner
-- can change these from AdminSettingsScreen without a code change.

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_public_read" ON app_settings;
CREATE POLICY "app_settings_public_read" ON app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "app_settings_admin_write" ON app_settings;
CREATE POLICY "app_settings_admin_write" ON app_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()));

INSERT INTO app_settings (key, value) VALUES
  ('featured_price', '1000'),
  ('wave_link', 'https://pay.wave.com/m/M_sn_0q9SzxPw16WN/c/sn/'),
  ('orange_money_number', '+221778223401'),
  ('whatsapp_number', '+221708812971')
ON CONFLICT (key) DO NOTHING;
