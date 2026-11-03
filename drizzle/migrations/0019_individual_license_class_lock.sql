ALTER TABLE public.user_licenses ADD COLUMN IF NOT EXISTS locked_class_id text;

CREATE OR REPLACE FUNCTION public.record_print_class(_term_key text, _class_id text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE lic jsonb; c text := left(lower(trim(coalesce(_class_id,''))), 20); u user_licenses;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  lic := get_my_license();
  IF lic->>'source' = 'individual' AND (lic->>'can_print')::boolean AND c <> '' THEN
    SELECT * INTO u FROM user_licenses WHERE user_id = auth.uid() FOR UPDATE;
    IF u.locked_class_id IS NOT NULL AND u.locked_class_id <> c THEN
      RETURN lic || jsonb_build_object('can_print', false, 'class_blocked', true, 'locked_class', u.locked_class_id);
    END IF;
    lic := record_print(_term_key);
    IF NOT coalesce((lic->>'term_blocked')::boolean, false) AND u.locked_class_id IS NULL THEN
      UPDATE user_licenses SET locked_class_id = c WHERE user_id = auth.uid();
    END IF;
    RETURN lic;
  END IF;
  RETURN record_print(_term_key);
END $function$;

REVOKE ALL ON FUNCTION public.record_print_class(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_print_class(text, text) TO authenticated;