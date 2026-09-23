-- A connection code creates a pending request. Only the addressed account can
-- accept it; accepting creates the reciprocal accepted row atomically.

CREATE OR REPLACE FUNCTION public.request_connection(
  target_user_code text,
  requested_relationship_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  requester_id uuid := auth.uid();
  target_id uuid;
  target_name text;
  existing_status text;
BEGIN
  IF requester_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '28000';
  END IF;
  IF requested_relationship_type NOT IN ('couple', 'friend') THEN
    RAISE EXCEPTION 'Invalid relationship type.' USING ERRCODE = '22023';
  END IF;

  SELECT id, display_name INTO target_id, target_name
  FROM public.profiles
  WHERE upper(user_code) = upper(trim(target_user_code))
  LIMIT 1;

  IF target_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy mã tài khoản.');
  END IF;
  IF target_id = requester_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Bạn không thể tự kết nối với chính mình.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    LEAST(requester_id, target_id)::text || ':' || GREATEST(requester_id, target_id)::text,
    0
  ));

  SELECT status INTO existing_status
  FROM public.connections
  WHERE (user_id = requester_id AND friend_id = target_id)
     OR (user_id = target_id AND friend_id = requester_id)
  ORDER BY (status = 'accepted') DESC, created_at DESC NULLS LAST
  LIMIT 1;

  IF existing_status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Hai tài khoản đã kết nối với nhau.');
  END IF;
  IF existing_status = 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Đã có lời mời đang chờ được xử lý.');
  END IF;

  INSERT INTO public.connections (user_id, friend_id, relationship_type, status)
  VALUES (requester_id, target_id, requested_relationship_type, 'pending');

  RETURN jsonb_build_object('success', true, 'friend_id', target_id, 'friend_name', target_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_connection_request(
  requester_user_id uuid,
  approve_request boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  approver_id uuid := auth.uid();
  request_row public.connections%ROWTYPE;
  reciprocal_id uuid;
BEGIN
  IF approver_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO request_row
  FROM public.connections
  WHERE user_id = requester_user_id
    AND friend_id = approver_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lời mời không còn tồn tại.');
  END IF;

  IF NOT approve_request THEN
    DELETE FROM public.connections WHERE id = request_row.id;
    RETURN jsonb_build_object('success', true, 'approved', false);
  END IF;

  UPDATE public.connections SET status = 'accepted' WHERE id = request_row.id;

  SELECT id INTO reciprocal_id
  FROM public.connections
  WHERE user_id = approver_id AND friend_id = requester_user_id
  LIMIT 1;

  IF reciprocal_id IS NULL THEN
    INSERT INTO public.connections (user_id, friend_id, relationship_type, status)
    VALUES (approver_id, requester_user_id, request_row.relationship_type, 'accepted');
  ELSE
    UPDATE public.connections
    SET relationship_type = request_row.relationship_type, status = 'accepted'
    WHERE id = reciprocal_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'approved', true);
END;
$$;

REVOKE ALL ON FUNCTION public.request_connection(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_connection_request(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_connection(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_connection_request(uuid, boolean) TO authenticated;
