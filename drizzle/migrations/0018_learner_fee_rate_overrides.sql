ALTER TABLE public.learner_fee_profiles ADD COLUMN rate_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE FUNCTION public.valid_fee_rate_overrides(_rates jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
 IF jsonb_typeof(_rates) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
 FOR v IN SELECT value FROM jsonb_each(_rates) LOOP
  IF jsonb_typeof(v) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
  IF (v::text)::numeric < 0 OR (v::text)::numeric > 100000 OR round((v::text)::numeric, 2) <> (v::text)::numeric THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END;
$$;
ALTER TABLE public.learner_fee_profiles ADD CONSTRAINT valid_learner_fee_rates CHECK (public.valid_fee_rate_overrides(rate_overrides));
COMMENT ON COLUMN public.learner_fee_profiles.rate_overrides IS 'Per-fee daily rate overrides. Missing fee keys inherit the current general school rate; zero is an explicit override. Existing owner and trial RLS remains in force.';