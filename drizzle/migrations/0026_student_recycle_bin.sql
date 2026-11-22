CREATE TABLE public.student_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  school_name text NOT NULL DEFAULT '',
  student_id text NOT NULL,
  student_name text NOT NULL DEFAULT '',
  class_id text NOT NULL DEFAULT '',
  data jsonb,
  deleted_by uuid,
  deleted_by_name text NOT NULL DEFAULT '',
  deleted_by_email text NOT NULL DEFAULT '',
  deleted_at timestamptz NOT NULL DEFAULT now(),
  restored_at timestamptz,
  restored_by uuid,
  restored_by_name text
);
CREATE INDEX student_deletions_school_idx ON public.student_deletions (school_id, deleted_at DESC);
CREATE INDEX student_deletions_time_idx ON public.student_deletions (deleted_at);
GRANT ALL ON public.student_deletions TO service_role;
ALTER TABLE public.student_deletions ENABLE ROW LEVEL SECURITY;
-- No direct policies: reads and restores go through the role-checked functions below.

-- Archive every learner row removed from a school, whichever path deletes it.
CREATE OR REPLACE FUNCTION public.archive_deleted_student()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); pname text; pemail text; sname text;
BEGIN
  SELECT display_name, email INTO pname, pemail FROM public.profiles WHERE id = uid;
  SELECT name INTO sname FROM public.schools WHERE id = OLD.school_id;
  INSERT INTO public.student_deletions (school_id, school_name, student_id, student_name, class_id, data, deleted_by, deleted_by_name, deleted_by_email)
  VALUES (OLD.school_id, coalesce(sname, ''), OLD.id, left(coalesce(OLD.data->>'name', ''), 160), coalesce(OLD.class_id, ''),
          OLD.data, uid, coalesce(nullif(pname, ''), pemail, ''), coalesce(pemail, ''));
  DELETE FROM public.student_deletions WHERE deleted_at < now() - interval '30 days';
  RETURN OLD;
END $$;
REVOKE EXECUTE ON FUNCTION public.archive_deleted_student() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER school_students_archive_delete BEFORE DELETE ON public.school_students
  FOR EACH ROW EXECUTE FUNCTION public.archive_deleted_student();

-- Who may delete a learner from a class (mirrors canDeleteFromClass in src/lib/classAccess.ts).
CREATE OR REPLACE FUNCTION public.can_delete_student(_school uuid, _class text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); r text; d jsonb; assigned jsonb; subs jsonb; base text;
BEGIN
  IF uid IS NULL OR _school IS NULL THEN RETURN false; END IF;
  SELECT role INTO r FROM public.school_members WHERE school_id = _school AND user_id = uid;
  IF NOT FOUND THEN RETURN false; END IF;
  IF r = 'headteacher' THEN RETURN true; END IF;
  SELECT details INTO d FROM public.schools WHERE id = _school;
  assigned := d->'classAssignments'->coalesce(_class, '');
  IF jsonb_typeof(assigned) IS DISTINCT FROM 'array' THEN assigned := '[]'::jsonb; END IF;
  base := regexp_replace(coalesce(_class, ''), '[abc]$', '');
  IF base IN ('kg1','kg2','b1','b2','b3','b4','b5','b6') THEN
    RETURN assigned ? uid::text;
  END IF;
  subs := d->'subjectAssignments'->coalesce(_class, '');
  IF jsonb_typeof(subs) = 'object' AND EXISTS (
    SELECT 1 FROM jsonb_each(subs) e WHERE jsonb_typeof(e.value) = 'array' AND jsonb_array_length(e.value) > 0) THEN
    RETURN assigned ? uid::text OR EXISTS (
      SELECT 1 FROM jsonb_each(subs) e WHERE jsonb_typeof(e.value) = 'array' AND e.value ? uid::text);
  END IF;
  IF jsonb_array_length(assigned) = 0 THEN RETURN true; END IF;
  RETURN assigned ? uid::text;
END $$;
REVOKE EXECUTE ON FUNCTION public.can_delete_student(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_delete_student(uuid, text) TO authenticated;

DROP POLICY IF EXISTS "Members delete students" ON public.school_students;
CREATE POLICY "Assigned members delete students" ON public.school_students
  FOR DELETE TO authenticated USING (public.can_delete_student(school_id, class_id));

-- Sync: check the delete permission per learner instead of failing the whole batch.
CREATE OR REPLACE FUNCTION public.sync_student_changes(_school uuid, _changes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE ch jsonb; sid text; cur_data jsonb; got boolean; res jsonb; merged jsonb; c jsonb; snap jsonb;
        uid uuid := auth.uid(); results jsonb := '[]'::jsonb; cpath text[]; dcls text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501'; END IF;
  IF _school IS NULL OR NOT public.is_school_member(_school) THEN
    RAISE EXCEPTION 'You are not a member of this school' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_changes) IS DISTINCT FROM 'array' OR jsonb_array_length(_changes) > 400 THEN
    RAISE EXCEPTION 'Invalid sync batch';
  END IF;
  FOR ch IN SELECT value FROM jsonb_array_elements(_changes) ORDER BY value->>'id' LOOP
    sid := ch->>'id';
    IF sid IS NULL OR length(sid) = 0 OR length(sid) > 80 THEN CONTINUE; END IF;

    IF coalesce((ch->>'delete')::boolean, false) THEN
      SELECT class_id INTO dcls FROM public.school_students WHERE id = sid AND school_id = _school FOR UPDATE;
      IF FOUND AND NOT public.can_delete_student(_school, dcls) THEN
        results := results || jsonb_build_object('id', sid, 'status', 'rejected', 'reason', 'not-assigned');
        CONTINUE;
      END IF;
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
END $function$;

-- Headteacher view of their own school's deletions (last 30 days).
CREATE OR REPLACE FUNCTION public.list_deleted_students(_school uuid)
RETURNS TABLE (id uuid, student_id text, student_name text, class_id text, deleted_by_name text, deleted_by_email text,
               deleted_at timestamptz, restored_at timestamptz, restored_by_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.school_members m WHERE m.school_id = _school AND m.user_id = auth.uid() AND m.role = 'headteacher')
     AND NOT public.is_developer() THEN
    RAISE EXCEPTION 'Only the headteacher can view deleted learners' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.student_deletions d WHERE d.deleted_at < now() - interval '30 days';
  RETURN QUERY SELECT d.id, d.student_id, d.student_name, d.class_id, d.deleted_by_name, d.deleted_by_email,
                      d.deleted_at, d.restored_at, d.restored_by_name
    FROM public.student_deletions d WHERE d.school_id = _school ORDER BY d.deleted_at DESC;
END $$;
REVOKE EXECUTE ON FUNCTION public.list_deleted_students(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_deleted_students(uuid) TO authenticated;

-- Developer view across every school (last 30 days).
CREATE OR REPLACE FUNCTION public.dev_deleted_students()
RETURNS TABLE (id uuid, school_id uuid, school_name text, student_id text, student_name text, class_id text,
               deleted_by_name text, deleted_by_email text, deleted_at timestamptz, restored_at timestamptz, restored_by_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer only' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.student_deletions d WHERE d.deleted_at < now() - interval '30 days';
  RETURN QUERY SELECT d.id, d.school_id, coalesce(s.name, d.school_name), d.student_id, d.student_name, d.class_id,
                      d.deleted_by_name, d.deleted_by_email, d.deleted_at, d.restored_at, d.restored_by_name
    FROM public.student_deletions d LEFT JOIN public.schools s ON s.id = d.school_id
    ORDER BY d.deleted_at DESC;
END $$;
REVOKE EXECUTE ON FUNCTION public.dev_deleted_students() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_deleted_students() TO authenticated;

-- Restore: headteacher within 14 days, developer within 30 days. Brings back the full saved record.
CREATE OR REPLACE FUNCTION public.restore_deleted_student(_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.student_deletions%ROWTYPE; uid uuid := auth.uid(); is_dev boolean; is_head boolean; age interval; rname text; n int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO d FROM public.student_deletions WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR d.data IS NULL THEN RAISE EXCEPTION 'This record is no longer available'; END IF;
  IF d.restored_at IS NOT NULL THEN RAISE EXCEPTION 'This learner has already been restored'; END IF;
  is_dev := public.is_developer();
  is_head := EXISTS (SELECT 1 FROM public.school_members m WHERE m.school_id = d.school_id AND m.user_id = uid AND m.role = 'headteacher');
  age := now() - d.deleted_at;
  IF age > interval '30 days' THEN RAISE EXCEPTION 'This record has been permanently deleted'; END IF;
  IF NOT (is_dev OR (is_head AND age <= interval '14 days')) THEN
    IF is_head THEN RAISE EXCEPTION 'More than 14 days have passed. Please contact the developer to recover this learner.' USING ERRCODE = '42501'; END IF;
    RAISE EXCEPTION 'You are not allowed to restore this learner' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.schools WHERE id = d.school_id) THEN RAISE EXCEPTION 'This school no longer exists'; END IF;
  IF EXISTS (SELECT 1 FROM public.school_students WHERE id = d.student_id) THEN RAISE EXCEPTION 'This learner is already in the school'; END IF;
  SELECT count(*) INTO n FROM public.school_students WHERE school_id = d.school_id AND class_id = d.class_id;
  IF n >= 35 THEN RAISE EXCEPTION 'This class already has 35 learners. Move or remove a learner first.'; END IF;
  INSERT INTO public.school_students (id, school_id, class_id, data, updated_by)
    VALUES (d.student_id, d.school_id, d.class_id, d.data, uid);
  SELECT coalesce(nullif(display_name, ''), email, '') INTO rname FROM public.profiles WHERE id = uid;
  UPDATE public.student_deletions SET restored_at = now(), restored_by = uid, restored_by_name = coalesce(rname, '') WHERE id = _id;
  RETURN jsonb_build_object('name', d.student_name, 'class_id', d.class_id, 'school_name', d.school_name);
END $$;
REVOKE EXECUTE ON FUNCTION public.restore_deleted_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_deleted_student(uuid) TO authenticated;