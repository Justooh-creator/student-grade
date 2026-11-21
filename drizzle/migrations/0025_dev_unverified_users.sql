CREATE OR REPLACE FUNCTION public.dev_unverified_users()
RETURNS TABLE(id uuid, email text, display_name text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer only' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, coalesce(p.display_name, ''), u.created_at
    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.email_confirmed_at IS NULL ORDER BY u.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.dev_confirm_user(_user uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer only' USING ERRCODE = '42501'; END IF;
  UPDATE auth.users SET email_confirmed_at = now() WHERE id = _user AND email_confirmed_at IS NULL;
END $$;

REVOKE ALL ON FUNCTION public.dev_unverified_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dev_confirm_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_unverified_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_confirm_user(uuid) TO authenticated;