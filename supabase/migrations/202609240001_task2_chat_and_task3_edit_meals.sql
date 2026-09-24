-- Chat members may remove their own messages. A sender cannot remove another
-- user's message through this function.
CREATE OR REPLACE FUNCTION public.delete_own_message(target_message_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  deleted_rows integer;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.messages
  WHERE id::text = target_message_id
    AND sender_id = current_user_id;

  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows > 0;
END;
$$;

-- Meal owners may edit descriptive fields after publishing, but not ownership,
-- timestamps, or the uploaded photo itself.
CREATE OR REPLACE FUNCTION public.update_own_meal_details(
  target_meal_id text,
  new_dish_name text,
  new_caption text,
  new_meal_type text,
  new_location text,
  new_calories text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  updated_meal jsonb;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '28000';
  END IF;
  IF new_meal_type IS NULL OR new_meal_type NOT IN ('breakfast', 'lunch', 'dinner', 'snack') THEN
    RAISE EXCEPTION 'Invalid meal type.' USING ERRCODE = '22023';
  END IF;
  IF length(trim(coalesce(new_dish_name, ''))) = 0 THEN
    RAISE EXCEPTION 'Meal name cannot be empty.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.meals
  SET dish_name = trim(new_dish_name),
      caption = nullif(trim(coalesce(new_caption, '')), ''),
      meal_type = new_meal_type,
      location = nullif(trim(coalesce(new_location, '')), ''),
      calories = nullif(trim(coalesce(new_calories, '')), '')
  WHERE id::text = target_meal_id
    AND user_id = current_user_id
  RETURNING to_jsonb(meals) INTO updated_meal;

  RETURN updated_meal;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_message(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_own_meal_details(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_message(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_meal_details(text, text, text, text, text, text) TO authenticated;
