-- Field-level, conflict-aware School Details sync. Additive only.

CREATE TABLE public.school_sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  path text[] NOT NULL DEFAULT '{}',
  base_value jsonb NOT NULL DEFAULT 'null'::jsonb,
  cloud_value jsonb NOT NULL DEFAULT 'null'::jsonb,
  local_value jsonb NOT NULL DEFAULT 'null'::jsonb,
  raised_by uuid NOT NULL DEFAULT auth.uid(),
  raised_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution text CHECK (resolution IS NULL OR resolution IN ('kept_cloud','used_local'))
);
CREATE INDEX school_sync_conflicts_open_idx ON public.school_sync_conflicts (school_id) WHERE resolved_at IS NULL;

REVOKE ALL ON public.school_sync_conflicts FROM anon;
GRANT SELECT, INSERT ON public.school_sync_conflicts TO authenticated;
GRANT UPDATE (resolved_at, resolved_by, resolution) ON public.school_sync_conflicts TO authenticated;
GRANT ALL ON public.school_sync_conflicts TO service_role;

ALTER TABLE public.school_sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Raiser or admin reads school sync conflicts" ON public.school_sync_conflicts
  FOR SELECT TO authenticated
  USING (public.is_school_member(school_id) AND (raised_by = auth.uid() OR public.is_school_admin(school_id)));
CREATE POLICY "Members record their own school sync conflicts" ON public.school_sync_conflicts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_school_member(school_id) AND raised_by = auth.uid());
CREATE POLICY "Raiser or admin resolves school sync conflicts" ON public.school_sync_conflicts
  FOR UPDATE TO authenticated
  USING (public.is_school_member(school_id) AND (raised_by = auth.uid() OR public.is_school_admin(school_id)))
  WITH CHECK (public.is_school_member(school_id) AND (raised_by = auth.uid() OR public.is_school_admin(school_id)));

-- Pure merge for School Details: apply ops whose base still matches; a JSON null value removes the field.
CREATE OR REPLACE FUNCTION public.merge_school_ops(_details jsonb, _ops jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public' AS $$
DECLARE d jsonb := CASE WHEN jsonb_typeof(_details) = 'object' THEN _details ELSE '{}'::jsonb END;
        op jsonb; p text[]; n int; i int; ok boolean; curv jsonb; b jsonb; v jsonb;
        conf jsonb := '[]'::jsonb; bad jsonb := '[]'::jsonb;
BEGIN
  IF jsonb_typeof(_ops) IS DISTINCT FROM 'array' THEN
    RETURN jsonb_build_object('data', d, 'conflicts', conf, 'invalid', bad);
  END IF;
  FOR op IN SELECT value FROM jsonb_array_elements(_ops) LOOP
    IF jsonb_typeof(op->'p') IS DISTINCT FROM 'array' OR jsonb_array_length(op->'p') = 0
       OR EXISTS (SELECT 1 FROM jsonb_array_elements(op->'p') e WHERE jsonb_typeof(e) <> 'string') THEN
      bad := bad || jsonb_build_object('p', coalesce(op->'p', '[]'::jsonb), 'reason', 'path'); CONTINUE;
    END IF;
    SELECT array_agg(x ORDER BY o) INTO p FROM jsonb_array_elements_text(op->'p') WITH ORDINALITY AS t(x, o);
    n := array_length(p, 1);
    IF EXISTS (SELECT 1 FROM unnest(p) x WHERE x IN ('', '__proto__', 'constructor', 'prototype') OR length(x) > 80)
       OR p[1] IN ('logo', 'signature', 'stamp', 'classTeacherSignatures')
       OR (p[1] IN ('classTeachers', 'classAssignments', 'timetables') AND n <> 2)
       OR (p[1] = 'subjectAssignments' AND n <> 3)
       OR (p[1] NOT IN ('classTeachers', 'classAssignments', 'timetables', 'subjectAssignments') AND n <> 1) THEN
      bad := bad || jsonb_build_object('p', op->'p', 'reason', 'path'); CONTINUE;
    END IF;
    b := public.sync_norm(op->'b'); v := public.sync_norm(op->'v');
    IF p[1] = 'streams' AND v <> 'null'::jsonb
       AND NOT (jsonb_typeof(v) = 'number' AND (v::text)::numeric IN (1, 2, 3)) THEN
      bad := bad || jsonb_build_object('p', op->'p', 'reason', 'range'); CONTINUE;
    END IF;
    ok := true;
    FOR i IN 1..n-1 LOOP
      IF jsonb_typeof(d #> p[1:i]) IS DISTINCT FROM 'object' THEN ok := false; END IF;
    END LOOP;
    curv := CASE WHEN ok THEN public.sync_norm(d #> p) ELSE 'null'::jsonb END;
    IF curv = v THEN CONTINUE; END IF;
    IF curv = b THEN
      IF op->'v' IS NULL OR op->'v' = 'null'::jsonb THEN
        IF ok THEN d := d #- p; END IF;
      ELSE
        d := public.jsonb_set_deep(d, p, op->'v');
      END IF;
    ELSE
      conf := conf || jsonb_build_object('p', to_jsonb(p), 'base', b, 'local', v, 'cloud', curv);
    END IF;
  END LOOP;
  RETURN jsonb_build_object('data', d, 'conflicts', conf, 'invalid', bad);
END $$;

-- Atomic School Details sync. Runs as the caller, so existing schools RLS still applies.
CREATE OR REPLACE FUNCTION public.sync_school_changes(_school uuid, _ops jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE cur_details jsonb; cur_name text; res jsonb; merged jsonb; c jsonb; cpath text[]; nm text;
        uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501'; END IF;
  IF _school IS NULL OR NOT public.is_school_member(_school) THEN
    RAISE EXCEPTION 'You are not a member of this school' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_ops) IS DISTINCT FROM 'array' OR jsonb_array_length(_ops) > 400 THEN
    RAISE EXCEPTION 'Invalid sync batch';
  END IF;
  SELECT details, name INTO cur_details, cur_name FROM public.schools WHERE id = _school FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'School not found' USING ERRCODE = '42501'; END IF;

  res := public.merge_school_ops(cur_details, _ops);
  merged := res->'data';
  IF merged IS DISTINCT FROM cur_details THEN
    nm := CASE WHEN coalesce(trim(merged->>'name'), '') <> '' THEN left(merged->>'name', 200) ELSE cur_name END;
    UPDATE public.schools SET details = merged, name = nm, updated_at = now()
      WHERE id = _school
      RETURNING details, name INTO merged, cur_name;
  ELSE
    merged := cur_details;
  END IF;

  FOR c IN SELECT value FROM jsonb_array_elements(res->'conflicts') LOOP
    cpath := ARRAY(SELECT jsonb_array_elements_text(c->'p'));
    IF NOT EXISTS (SELECT 1 FROM public.school_sync_conflicts WHERE school_id = _school AND path = cpath
                   AND local_value = c->'local' AND raised_by = uid AND resolved_at IS NULL) THEN
      INSERT INTO public.school_sync_conflicts (school_id, path, base_value, cloud_value, local_value, raised_by)
        VALUES (_school, cpath, c->'base', c->'cloud', c->'local', uid);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('data', merged, 'name', cur_name, 'conflicts', res->'conflicts', 'invalid', res->'invalid');
END $$;

REVOKE EXECUTE ON FUNCTION public.sync_school_changes(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_school_changes(uuid, jsonb) TO authenticated;