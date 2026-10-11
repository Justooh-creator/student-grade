CREATE OR REPLACE FUNCTION public.redeem_code(_code text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE g gift_codes; m school_members; base timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO g FROM gift_codes WHERE code = upper(trim(_code)) FOR UPDATE;
  IF g.id IS NULL THEN RAISE EXCEPTION 'Code not valid'; END IF;
  IF g.kind = 'developer' THEN
    INSERT INTO user_licenses (user_id, permanent) VALUES (auth.uid(), true)
      ON CONFLICT (user_id) DO UPDATE SET permanent = true, updated_at = now();
    RETURN get_my_license();
  END IF;
  IF g.redeemed_at IS NOT NULL THEN RAISE EXCEPTION 'This code has already been used'; END IF;
  SELECT * INTO m FROM school_members WHERE user_id = auth.uid();
  IF m.id IS NOT NULL THEN
    IF m.role <> 'headteacher' THEN RAISE EXCEPTION 'Only the headteacher can activate the school'; END IF;
    SELECT GREATEST(COALESCE(license_expires_at, now()), now()) INTO base FROM schools WHERE id = m.school_id;
    UPDATE schools SET license_expires_at = base + make_interval(days => g.days),
      license_terms = CASE WHEN g.days > 120 THEN 3 ELSE 1 END, first_printed_at = NULL, print_term_key = NULL
      WHERE id = m.school_id;
  ELSE
    SELECT GREATEST(COALESCE(expires_at, now()), now()) INTO base FROM user_licenses WHERE user_id = auth.uid();
    INSERT INTO user_licenses (user_id, expires_at, license_terms) VALUES (auth.uid(), COALESCE(base, now()) + make_interval(days => g.days), CASE WHEN g.days > 120 THEN 3 ELSE 1 END)
      ON CONFLICT (user_id) DO UPDATE SET expires_at = EXCLUDED.expires_at, license_terms = EXCLUDED.license_terms,
        first_printed_at = NULL, print_term_key = NULL, updated_at = now();
  END IF;
  UPDATE gift_codes SET redeemed_at = now(), redeemed_by = auth.uid(), redeemed_school = m.school_id WHERE id = g.id;
  RETURN get_my_license();
END $function$;