-- Security hardening for DAAN DOOLE store ownership.
-- Owners may edit storefront details, but only platform admins may change
-- ownership, commercial plan, or publication/suspension status.

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
       OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only platform administrators can change store ownership, plan, or publication status';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
