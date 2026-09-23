-- Task 1: allow at most one accepted couple partner per account.
-- Existing accepted relationships are checked before enforcing the rule.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT user_id AS member_id, friend_id AS partner_id
      FROM public.connections
      WHERE relationship_type = 'couple' AND status = 'accepted'
      UNION ALL
      SELECT friend_id AS member_id, user_id AS partner_id
      FROM public.connections
      WHERE relationship_type = 'couple' AND status = 'accepted'
    ) AS active_pairs
    GROUP BY member_id
    HAVING COUNT(DISTINCT partner_id) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enable couple exclusivity: existing accounts have multiple accepted couple partners. Resolve those rows in public.connections first.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_one_active_couple_partner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  first_member uuid;
  second_member uuid;
BEGIN
  IF NEW.relationship_type IS DISTINCT FROM 'couple'
     OR NEW.status IS DISTINCT FROM 'accepted' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL OR NEW.friend_id IS NULL OR NEW.user_id = NEW.friend_id THEN
    RAISE EXCEPTION 'A couple connection requires two different users.'
      USING ERRCODE = '23514';
  END IF;

  first_member := LEAST(NEW.user_id, NEW.friend_id);
  second_member := GREATEST(NEW.user_id, NEW.friend_id);

  -- Lock both people in a stable order so concurrent requests cannot pair
  -- either person with two different partners.
  PERFORM pg_advisory_xact_lock(hashtextextended(first_member::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended(second_member::text, 0));

  IF EXISTS (
    SELECT 1
    FROM public.connections AS existing
    WHERE existing.relationship_type = 'couple'
      AND existing.status = 'accepted'
      AND (
        existing.user_id IN (NEW.user_id, NEW.friend_id)
        OR existing.friend_id IN (NEW.user_id, NEW.friend_id)
      )
      AND NOT (
        existing.user_id IN (NEW.user_id, NEW.friend_id)
        AND existing.friend_id IN (NEW.user_id, NEW.friend_id)
      )
  ) THEN
    RAISE EXCEPTION 'Each user can have only one active couple partner.'
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_one_active_couple_partner ON public.connections;
CREATE TRIGGER enforce_one_active_couple_partner
BEFORE INSERT OR UPDATE OF user_id, friend_id, relationship_type, status
ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.enforce_one_active_couple_partner();

CREATE OR REPLACE FUNCTION public.remove_couple_connection(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  deleted_rows integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '28000';
  END IF;
  IF target_user_id IS NULL OR target_user_id = current_user_id THEN
    RAISE EXCEPTION 'A different partner must be selected.' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.connections
  WHERE relationship_type = 'couple'
    AND status = 'accepted'
    AND (
      (user_id = current_user_id AND friend_id = target_user_id)
      OR (user_id = target_user_id AND friend_id = current_user_id)
    );

  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_couple_connection(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_couple_connection(uuid) TO authenticated;

-- Edge Functions use this service-role-only helper to find every object owned
-- by the account, including old avatar uploads no longer referenced by a row.
CREATE OR REPLACE FUNCTION public.list_account_storage_paths(account_user_id uuid)
RETURNS TABLE(object_path text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
  SELECT objects.name
  FROM storage.objects AS objects
  WHERE objects.bucket_id = 'meal-photos'
    AND objects.owner_id = account_user_id::text;
$$;

REVOKE ALL ON FUNCTION public.list_account_storage_paths(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_account_storage_paths(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.list_account_storage_paths(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_account_storage_paths(uuid) TO service_role;
