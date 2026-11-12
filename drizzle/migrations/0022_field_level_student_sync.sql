-- Field-level, conflict-aware learner sync (Issue 2). Additive only.

CREATE TABLE public.student_sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  student_name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'field' CHECK (kind IN ('field','deleted')),
  path text[] NOT NULL DEFAULT '{}',
  base_value jsonb NOT NULL DEFAULT 'null'::jsonb,
  cloud_value jsonb NOT NULL DEFAULT 'null'::jsonb,
  local_value jsonb NOT NULL DEFAULT 'null'::jsonb,
  raised_by uuid NOT NULL DEFAULT auth.uid(),
  raised_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution text CHECK (resolution IS NULL OR resolution IN ('kept_cloud','used_local','restored','kept_deleted'))
);
CREATE INDEX student_sync_conflicts_open_idx ON public.student_sync_conflicts (school_id, student_id) WHERE resolved_at IS NULL;

GRANT SELECT, INSERT ON public.student_sync_conflicts TO authenticated;
GRANT UPDATE (resolved_at, resolved_by, resolution) ON public.student_sync_conflicts TO authenticated;
GRANT ALL ON public.student_sync_conflicts TO service_role;

ALTER TABLE public.student_sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Raiser or admin reads sync conflicts" ON public.student_sync_conflicts
  FOR SELECT TO authenticated
  USING (public.is_school_member(school_id) AND (raised_by = auth.uid() OR public.is_school_admin(school_id)));
CREATE POLICY "Members record their own sync conflicts" ON public.student_sync_conflicts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_school_member(school_id) AND raised_by = auth.uid());
CREATE POLICY "Raiser or admin resolves sync conflicts" ON public.student_sync_conflicts
  FOR UPDATE TO authenticated
  USING (public.is_school_member(school_id) AND (raised_by = auth.uid() OR public.is_school_admin(school_id)))
  WITH CHECK (public.is_school_member(school_id) AND (raised_by = auth.uid() OR public.is_school_admin(school_id)));

-- Set a nested value, creating missing parent objects.
CREATE OR REPLACE FUNCTION public.jsonb_set_deep(_target jsonb, _path text[], _value jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public' AS $$
DECLARE t jsonb := CASE WHEN jsonb_typeof(_target) = 'object' THEN _target ELSE '{}'::jsonb END;
        n int := coalesce(array_length(_path, 1), 0); i int;
BEGIN
  IF n = 0 THEN RETURN t; END IF;
  FOR i IN 1..n-1 LOOP
    IF jsonb_typeof(t #> _path[1:i]) IS DISTINCT FROM 'object' THEN
      t := jsonb_set(t, _path[1:i], '{}'::jsonb, true);
    END IF;
  END LOOP;
  RETURN jsonb_set(t, _path, coalesce(_value, 'null'::jsonb), true);
END $$;

-- Treat missing, JSON null and empty text as the same "empty" value.
CREATE OR REPLACE FUNCTION public.sync_norm(_v jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE WHEN _v IS NULL OR _v = 'null'::jsonb OR _v = '""'::jsonb THEN 'null'::jsonb ELSE _v END
$$;

-- Same arithmetic as the app's setCatScore (IEEE double, round half up to 1 dp).
CREATE OR REPLACE FUNCTION public.recalc_cat_entry(_e jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public' AS $$
DECLARE e jsonb := CASE WHEN jsonb_typeof(_e) = 'object' THEN _e ELSE '{}'::jsonb END;
        t1 float8; t2 float8; pr float8; gr float8; ex float8; raw float8; anyp boolean;
BEGIN
  t1 := CASE WHEN jsonb_typeof(e->'test1') = 'number' THEN (e->>'test1')::float8 END;
  t2 := CASE WHEN jsonb_typeof(e->'test2') = 'number' THEN (e->>'test2')::float8 END;
  pr := CASE WHEN jsonb_typeof(e->'project') = 'number' THEN (e->>'project')::float8 END;
  gr := CASE WHEN jsonb_typeof(e->'group') = 'number' THEN (e->>'group')::float8 END;
  ex := CASE WHEN jsonb_typeof(e->'examRaw') = 'number' THEN (e->>'examRaw')::float8 END;
  anyp := t1 IS NOT NULL OR t2 IS NOT NULL OR pr IS NOT NULL OR gr IS NOT NULL;
  raw := 0::float8 + coalesce(t1, 0::float8) + coalesce(t2, 0::float8) + coalesce(pr, 0::float8) + coalesce(gr, 0::float8);
  RETURN e || jsonb_build_object(
    'sbaRaw', CASE WHEN anyp THEN to_jsonb(raw) ELSE 'null'::jsonb END,
    'sba', CASE WHEN anyp THEN to_jsonb(floor(raw * 0.5::float8 * 10::float8 + 0.5::float8) / 10::float8) ELSE 'null'::jsonb END,
    'exam', CASE WHEN ex IS NULL THEN 'null'::jsonb ELSE to_jsonb(floor(ex * 0.5::float8 * 10::float8 + 0.5::float8) / 10::float8) END);
END $$;

-- Pure merge: apply field operations whose base still matches; report the rest as conflicts.
CREATE OR REPLACE FUNCTION public.merge_student_ops(_data jsonb, _ops jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public' AS $$
DECLARE d jsonb := CASE WHEN jsonb_typeof(_data) = 'object' THEN _data ELSE '{}'::jsonb END;
        op jsonb; p text[]; n int; curv jsonb; b jsonb; v jsonb; mx numeric; s text;
        conf jsonb := '[]'::jsonb; bad jsonb := '[]'::jsonb; recalc text[] := '{}';
BEGIN
  IF jsonb_typeof(_ops) IS DISTINCT FROM 'array' THEN
    RETURN jsonb_build_object('data', d, 'conflicts', conf, 'invalid', bad);
  END IF;
  FOR op IN SELECT value FROM jsonb_array_elements(_ops) LOOP
    IF jsonb_typeof(op->'p') IS DISTINCT FROM 'array' THEN CONTINUE; END IF;
    SELECT array_agg(x ORDER BY o) INTO p FROM jsonb_array_elements_text(op->'p') WITH ORDINALITY AS t(x, o);
    n := coalesce(array_length(p, 1), 0);
    IF n = 0 OR p[1] IN ('id', 'photo')
       OR (p[1] = 'scores' AND n <> 3) OR (p[1] = 'fees' AND n <> 2)
       OR (p[1] NOT IN ('scores', 'fees') AND n <> 1) THEN
      bad := bad || jsonb_build_object('p', op->'p', 'reason', 'path'); CONTINUE;
    END IF;
    b := public.sync_norm(op->'b'); v := public.sync_norm(op->'v');
    IF p[1] = 'scores' AND p[3] IN ('test1','test2','project','group','examRaw') AND v <> 'null'::jsonb THEN
      mx := CASE p[3] WHEN 'test1' THEN 20 WHEN 'test2' THEN 20 WHEN 'project' THEN 30 WHEN 'group' THEN 30 ELSE 100 END;
      IF jsonb_typeof(v) <> 'number' OR (v::text)::numeric < 0 OR (v::text)::numeric > mx THEN
        bad := bad || jsonb_build_object('p', op->'p', 'reason', 'range'); CONTINUE;
      END IF;
    END IF;
    curv := public.sync_norm(d #> p);
    IF curv = v THEN CONTINUE; END IF;
    IF curv = b THEN
      d := public.jsonb_set_deep(d, p, op->'v');
      IF p[1] = 'scores' AND p[3] IN ('test1','test2','project','group','examRaw') AND NOT (p[2] = ANY(recalc)) THEN
        recalc := recalc || p[2];
      END IF;
    ELSE
      conf := conf || jsonb_build_object('p', to_jsonb(p), 'base', b, 'local', v, 'cloud', curv);
    END IF;
  END LOOP;
  FOREACH s IN ARRAY recalc LOOP
    d := jsonb_set(d, ARRAY['scores', s], public.recalc_cat_entry(d->'scores'->s));
  END LOOP;
  RETURN jsonb_build_object('data', d, 'conflicts', conf, 'invalid', bad);
END $$;

-- Atomic sync entry point. Runs as the caller, so existing school_students RLS still applies.
CREATE OR REPLACE FUNCTION public.sync_student_changes(_school uuid, _changes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE ch jsonb; sid text; cur_data jsonb; got boolean; res jsonb; merged jsonb; c jsonb; snap jsonb;
        uid uuid := auth.uid(); results jsonb := '[]'::jsonb; cpath text[];
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501'; END IF;
  IF _school IS NULL OR NOT public.is_school_member(_school) THEN
    RAISE EXCEPTION 'You are not a member of this school' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_changes) IS DISTINCT FROM 'array' OR jsonb_array_length(_changes) > 400 THEN
    RAISE EXCEPTION 'Invalid sync batch';
  END IF;
  -- Fixed lock order (by learner id) so concurrent batches cannot deadlock.
  FOR ch IN SELECT value FROM jsonb_array_elements(_changes) ORDER BY value->>'id' LOOP
    sid := ch->>'id';
    IF sid IS NULL OR length(sid) = 0 OR length(sid) > 80 THEN CONTINUE; END IF;

    IF coalesce((ch->>'delete')::boolean, false) THEN
      DELETE FROM public.school_students WHERE id = sid AND school_id = _school;
      results := results || jsonb_build_object('id', sid, 'status', 'deleted');
      CONTINUE;
    END IF;

    SELECT data INTO cur_data FROM public.school_students WHERE id = sid AND school_id = _school FOR UPDATE;
    got := FOUND;
    IF NOT got AND coalesce((ch->>'create')::boolean, false) THEN
      INSERT INTO public.school_students (id, school_id, class_id, data, updated_by)
        VALUES (sid, _school, left(coalesce(ch->>'classId', ''), 20), jsonb_build_object('id', sid), uid)
        ON CONFLICT (id) DO NOTHING;
      SELECT data INTO cur_data FROM public.school_students WHERE id = sid AND school_id = _school FOR UPDATE;
      got := FOUND;
      IF NOT got THEN
        results := results || jsonb_build_object('id', sid, 'status', 'rejected');
        CONTINUE;
      END IF;
    ELSIF NOT got THEN
      -- Removed by another teacher while this device was offline: keep this copy for review.
      snap := CASE WHEN jsonb_typeof(ch->'snapshot') = 'object' THEN (ch->'snapshot') - 'photo' ELSE 'null'::jsonb END;
      IF NOT EXISTS (SELECT 1 FROM public.student_sync_conflicts WHERE school_id = _school AND student_id = sid
                     AND kind = 'deleted' AND raised_by = uid AND resolved_at IS NULL) THEN
        INSERT INTO public.student_sync_conflicts (school_id, student_id, student_name, kind, path, local_value, raised_by)
          VALUES (_school, sid, left(coalesce(snap->>'name', ''), 120), 'deleted', '{}', snap, uid);
      END IF;
      results := results || jsonb_build_object('id', sid, 'status', 'missing');
      CONTINUE;
    END IF;

    res := public.merge_student_ops(cur_data, ch->'ops');
    merged := (res->'data') || jsonb_build_object('id', sid);
    IF merged IS DISTINCT FROM cur_data THEN
      UPDATE public.school_students
        SET data = merged,
            class_id = CASE WHEN coalesce(merged->>'classId', '') <> '' THEN left(merged->>'classId', 20) ELSE class_id END,
            updated_by = uid, updated_at = now()
        WHERE id = sid AND school_id = _school
        RETURNING data INTO merged;
    ELSE
      merged := cur_data;
    END IF;

    FOR c IN SELECT value FROM jsonb_array_elements(res->'conflicts') LOOP
      cpath := ARRAY(SELECT jsonb_array_elements_text(c->'p'));
      IF NOT EXISTS (SELECT 1 FROM public.student_sync_conflicts WHERE school_id = _school AND student_id = sid
                     AND kind = 'field' AND path = cpath AND local_value = c->'local' AND raised_by = uid AND resolved_at IS NULL) THEN
        INSERT INTO public.student_sync_conflicts (school_id, student_id, student_name, kind, path, base_value, cloud_value, local_value, raised_by)
          VALUES (_school, sid, left(coalesce(merged->>'name', ''), 120), 'field', cpath, c->'base', c->'cloud', c->'local', uid);
      END IF;
    END LOOP;

    results := results || jsonb_build_object('id', sid, 'status', 'ok', 'data', merged,
                                             'conflicts', res->'conflicts', 'invalid', res->'invalid');
  END LOOP;
  RETURN jsonb_build_object('results', results);
END $$;

REVOKE EXECUTE ON FUNCTION public.sync_student_changes(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_student_changes(uuid, jsonb) TO authenticated;