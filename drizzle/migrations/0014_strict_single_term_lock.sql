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
      IF COALESCE(s.license_terms,1) = 1 AND s.print_term_key IS NOT NULL AND s.print_term_key IS DISTINCT FROM k THEN
        RETURN get_my_license() || jsonb_build_object('can_print', false, 'term_blocked', true, 'locked_term', s.print_term_key);
      END IF;
      UPDATE schools SET first_printed_at = now(), print_term_key = k
        WHERE id = s.id
          AND (first_printed_at IS NULL OR (COALESCE(license_terms, 1) > 1 AND print_term_key IS DISTINCT FROM k))
          AND NOT print_window_closed(license_terms, print_term_key, first_printed_at);
      RETURN get_my_license();
    END IF;
  END IF;
  IF u.expires_at > now() THEN
    IF COALESCE(u.license_terms,1) = 1 AND u.print_term_key IS NOT NULL AND u.print_term_key IS DISTINCT FROM k THEN
      RETURN get_my_license() || jsonb_build_object('can_print', false, 'term_blocked', true, 'locked_term', u.print_term_key);
    END IF;
    UPDATE user_licenses SET first_printed_at = now(), print_term_key = k
      WHERE user_id = auth.uid()
        AND (first_printed_at IS NULL OR (COALESCE(license_terms, 1) > 1 AND print_term_key IS DISTINCT FROM k))
        AND NOT print_window_closed(license_terms, print_term_key, first_printed_at);
  END IF;
  RETURN get_my_license();
END $function$;