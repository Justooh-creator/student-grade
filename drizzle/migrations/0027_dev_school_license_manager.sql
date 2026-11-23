CREATE OR REPLACE FUNCTION public.print_window_closed(_terms integer, _key text, _first timestamp with time zone)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  -- The 15-day early lockout is retired: licenses print until their expiry date.
  -- 1-term licenses stay locked to their first printed term inside record_print.
  SELECT false
$function$;

CREATE OR REPLACE FUNCTION public.dev_list_schools()
 RETURNS TABLE(id uuid, name text, join_code text, teacher_count integer, license_expires_at timestamp with time zone, license_permanent boolean, license_terms integer, print_term_key text, first_printed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer only' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT s.id, s.name, s.join_code,
    (SELECT count(*)::int FROM public.school_members m WHERE m.school_id = s.id),
    s.license_expires_at, s.license_permanent, s.license_terms, s.print_term_key, s.first_printed_at
  FROM public.schools s ORDER BY lower(s.name);
END $function$;

CREATE OR REPLACE FUNCTION public.dev_set_school_license(_school uuid, _action text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE base timestamptz;
BEGIN
  IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer only' USING ERRCODE = '42501'; END IF;
  SELECT GREATEST(COALESCE(license_expires_at, now()), now()) INTO base FROM public.schools WHERE id = _school FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'School not found'; END IF;
  IF _action = 'term' THEN
    UPDATE public.schools SET license_expires_at = base + interval '100 days', license_terms = 1,
      first_printed_at = NULL, print_term_key = NULL WHERE id = _school;
  ELSIF _action = 'year' THEN
    UPDATE public.schools SET license_expires_at = base + interval '365 days', license_terms = 3,
      first_printed_at = NULL, print_term_key = NULL WHERE id = _school;
  ELSIF _action = 'expire' THEN
    UPDATE public.schools SET license_expires_at = now(), license_permanent = false WHERE id = _school;
  ELSIF _action = 'reset_lock' THEN
    UPDATE public.schools SET first_printed_at = NULL, print_term_key = NULL WHERE id = _school;
  ELSE
    RAISE EXCEPTION 'Unknown action';
  END IF;
END $function$;

REVOKE EXECUTE ON FUNCTION public.dev_list_schools() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.dev_set_school_license(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.dev_list_schools() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dev_set_school_license(uuid, text) TO authenticated;