CREATE OR REPLACE FUNCTION public.dev_list_schools()
 RETURNS TABLE(id uuid, name text, join_code text, teacher_count integer, license_expires_at timestamp with time zone, license_permanent boolean, license_terms integer, print_term_key text, first_printed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer only' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT s.id, s.name, s.join_code, c.n,
    s.license_expires_at, s.license_permanent, s.license_terms, s.print_term_key, s.first_printed_at
  FROM public.schools s
  CROSS JOIN LATERAL (SELECT count(*)::int AS n FROM public.school_members m WHERE m.school_id = s.id) c
  WHERE c.n > 0
  ORDER BY lower(s.name);
END $function$;

REVOKE EXECUTE ON FUNCTION public.dev_list_schools() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.dev_list_schools() TO authenticated;