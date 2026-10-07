ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS license_expires_at timestamptz, ADD COLUMN IF NOT EXISTS license_permanent boolean NOT NULL DEFAULT false;

CREATE TABLE public.user_licenses (
  user_id uuid PRIMARY KEY,
  expires_at timestamptz,
  permanent boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_licenses TO authenticated;
GRANT ALL ON public.user_licenses TO service_role;
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own license" ON public.user_licenses FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.gift_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'gift',
  days integer NOT NULL DEFAULT 365,
  redeemed_at timestamptz,
  redeemed_by uuid,
  redeemed_school uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.gift_codes TO service_role;
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_license()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE m school_members; s schools; u user_licenses;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('can_print', false, 'source', 'none', 'status', 'unpaid'); END IF;
  SELECT * INTO u FROM user_licenses WHERE user_id = auth.uid();
  IF u.permanent THEN RETURN jsonb_build_object('can_print', true, 'source', 'developer', 'status', 'active'); END IF;
  SELECT * INTO m FROM school_members WHERE user_id = auth.uid();
  IF m.id IS NOT NULL THEN
    SELECT * INTO s FROM schools WHERE id = m.school_id;
    IF s.license_permanent OR s.license_expires_at > now() THEN
      RETURN jsonb_build_object('can_print', true, 'source', 'school', 'status', 'active', 'expires_at', s.license_expires_at);
    END IF;
  END IF;
  IF u.expires_at > now() THEN
    RETURN jsonb_build_object('can_print', true, 'source', 'individual', 'status', 'active', 'expires_at', u.expires_at);
  END IF;
  RETURN jsonb_build_object('can_print', false, 'source', CASE WHEN m.id IS NOT NULL THEN 'school' ELSE 'individual' END,
    'status', CASE WHEN COALESCE(s.license_expires_at, u.expires_at) IS NOT NULL THEN 'expired' ELSE 'unpaid' END,
    'expires_at', COALESCE(s.license_expires_at, u.expires_at));
END $$;

CREATE OR REPLACE FUNCTION public.redeem_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    UPDATE schools SET license_expires_at = base + make_interval(days => g.days) WHERE id = m.school_id;
  ELSE
    SELECT GREATEST(COALESCE(expires_at, now()), now()) INTO base FROM user_licenses WHERE user_id = auth.uid();
    INSERT INTO user_licenses (user_id, expires_at) VALUES (auth.uid(), COALESCE(base, now()) + make_interval(days => g.days))
      ON CONFLICT (user_id) DO UPDATE SET expires_at = EXCLUDED.expires_at, updated_at = now();
  END IF;
  UPDATE gift_codes SET redeemed_at = now(), redeemed_by = auth.uid(), redeemed_school = m.school_id WHERE id = g.id;
  RETURN get_my_license();
END $$;

REVOKE ALL ON FUNCTION public.get_my_license() FROM anon;
REVOKE ALL ON FUNCTION public.redeem_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_license() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_code(text) TO authenticated;