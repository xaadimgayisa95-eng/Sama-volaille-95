-- DAAN DOOLE foundation: independent stores and store products.
-- Additive migration: preserves the existing SamaVolaille tables and data.

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '',
  logo_url text,
  cover_url text,
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'XOF' CHECK (currency = 'XOF'),
  plan text NOT NULL DEFAULT 'catalog' CHECK (plan IN ('catalog', 'store')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 160),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '',
  price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price numeric(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= price),
  category text NOT NULL DEFAULT '',
  image_urls text[] NOT NULL DEFAULT '{}',
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON public.stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_stores_status_slug ON public.stores(status, slug);
CREATE INDEX IF NOT EXISTS idx_store_products_store_published
  ON public.store_products(store_id, is_published, sort_order);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Public visitors can only discover published stores.
DROP POLICY IF EXISTS "public_read_published_stores" ON public.stores;
CREATE POLICY "public_read_published_stores"
  ON public.stores FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Store owners can see their own store even while it is still a draft.
DROP POLICY IF EXISTS "owners_read_own_stores" ON public.stores;
CREATE POLICY "owners_read_own_stores"
  ON public.stores FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Platform administrators (existing user_roles table) can create and manage stores.
DROP POLICY IF EXISTS "platform_admin_manage_stores" ON public.stores;
CREATE POLICY "platform_admin_manage_stores"
  ON public.stores FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

-- Owners may edit their store details; a trigger below protects platform-controlled fields.
DROP POLICY IF EXISTS "owners_update_own_stores" ON public.stores;
CREATE POLICY "owners_update_own_stores"
  ON public.stores FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_store_platform_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.owner_user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles ur
       WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
     ) THEN
    IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
       OR NEW.plan IS DISTINCT FROM OLD.plan
       OR (NEW.status = 'suspended' AND NEW.status IS DISTINCT FROM OLD.status) THEN
      RAISE EXCEPTION 'Only platform administrators can change store ownership, plan, or suspend a store';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_store_platform_fields_trigger ON public.stores;
CREATE TRIGGER protect_store_platform_fields_trigger
BEFORE UPDATE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.protect_store_platform_fields();

-- Public visitors can read published products only when their store is published.
DROP POLICY IF EXISTS "public_read_published_store_products" ON public.store_products;
CREATE POLICY "public_read_published_store_products"
  ON public.store_products FOR SELECT TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_products.store_id AND s.status = 'published'
    )
  );

-- Store owners can see all products belonging to their store, including drafts.
DROP POLICY IF EXISTS "owners_read_own_store_products" ON public.store_products;
CREATE POLICY "owners_read_own_store_products"
  ON public.store_products FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_products.store_id AND s.owner_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owners_insert_own_store_products" ON public.store_products;
CREATE POLICY "owners_insert_own_store_products"
  ON public.store_products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_products.store_id AND s.owner_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owners_update_own_store_products" ON public.store_products;
CREATE POLICY "owners_update_own_store_products"
  ON public.store_products FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_products.store_id AND s.owner_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_products.store_id AND s.owner_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owners_delete_own_store_products" ON public.store_products;
CREATE POLICY "owners_delete_own_store_products"
  ON public.store_products FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_products.store_id AND s.owner_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "platform_admin_manage_store_products" ON public.store_products;
CREATE POLICY "platform_admin_manage_store_products"
  ON public.store_products FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));
