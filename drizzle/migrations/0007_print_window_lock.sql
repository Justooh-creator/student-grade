ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS license_terms integer, ADD COLUMN IF NOT EXISTS print_term_key text, ADD COLUMN IF NOT EXISTS first_printed_at timestamptz;
ALTER TABLE public.user_licenses ADD COLUMN IF NOT EXISTS license_terms integer, ADD COLUMN IF NOT EXISTS print_term_key text, ADD COLUMN IF NOT EXISTS first_printed_at timestamptz;

-- Window closed? Termly plans lock 15 days after first print of any term; 3-term plans only after Term 3.
CREATE OR REPLACE FUNCTION public.print_window_closed(_terms integer, _key text, _first timestamptz)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT _first IS NOT NULL AND _first + interval '15 days' < now()
    AND (COALESCE(_terms, 1) = 1 OR COALESCE(_key, '') ILIKE '%term 3%')
$$;

CREATE OR REPLACE FUNCTION public.get_my_license()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE m school_members; s schools; u user_licenses;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('can_print', false, 'source', 'none', 'status', 'unpaid'); END IF;
  SELECT * INTO u FROM user_licenses WHERE user_id = auth.uid();
  IF u.permanent THEN RETURN jsonb_build_object('can_print', true, 'source', 'developer', 'status', 'active'); END IF;
  SELECT * INTO m FROM school_members WHERE user_id = auth.uid();
  IF m.id IS NOT NULL THEN
    SELECT * INTO s FROM schools WHERE id = m.school_id;
    IF s.license_permanent OR (s.license_expires_at > now() AND NOT print_window_closed(s.license_terms, s.print_term_key, s.first_printed_at)) THEN
      RETURN jsonb_build_object('can_print', true, 'source', 'school', 'status', 'active', 'expires_at', s.license_expires_at,
        'first_printed_at', s.first_printed_at, 'license_terms', s.license_terms);
    END IF;
  END IF;
  IF u.expires_at > now() AND NOT print_window_closed(u.license_terms, u.print_term_key, u.first_printed_at) THEN
    RETURN jsonb_build_object('can_print', true, 'source', 'individual', 'status', 'active', 'expires_at', u.expires_at,
      'first_printed_at', u.first_printed_at, 'license_terms', u.license_terms);
  END IF;
  RETURN jsonb_build_object('can_print', false, 'source', CASE WHEN m.id IS NOT NULL THEN 'school' ELSE 'individual' END,
    'status', CASE WHEN COALESCE(s.license_expires_at, u.expires_at) IS NOT NULL THEN 'expired' ELSE 'unpaid' END,
    'expires_at', COALESCE(s.license_expires_at, u.expires_at));
END $function$;

-- Record the first save/print of a term. Reprints never reset the clock.
CREATE OR REPLACE FUNCTION public.record_print(_term_key text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE m school_members; s schools; u user_licenses; k text := left(trim(coalesce(_term_key,'')), 80);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO u FROM user_licenses WHERE user_id = auth.uid();
  IF u.permanent THEN RETURN get_my_license(); END IF;
  SELECT * INTO m FROM school_members WHERE user_id = auth.uid();
  IF m.id IS NOT NULL THEN
    SELECT * INTO s FROM schools WHERE id = m.school_id;
    IF s.license_permanent THEN RETURN get_my_license(); END IF;
    IF s.license_expires_at > now() THEN
      UPDATE schools SET first_printed_at = now(), print_term_key = k
        WHERE id = s.id AND (first_printed_at IS NULL OR print_term_key IS DISTINCT FROM k)
          AND NOT print_window_closed(license_terms, print_term_key, first_printed_at);
      RETURN get_my_license();
    END IF;
  END IF;
  IF u.expires_at > now() THEN
    UPDATE user_licenses SET first_printed_at = now(), print_term_key = k
      WHERE user_id = auth.uid() AND (first_printed_at IS NULL OR print_term_key IS DISTINCT FROM k)
        AND NOT print_window_closed(license_terms, print_term_key, first_printed_at);
  END IF;
  RETURN get_my_license();
END $function$;
GRANT EXECUTE ON FUNCTION public.record_print(text) TO authenticated;