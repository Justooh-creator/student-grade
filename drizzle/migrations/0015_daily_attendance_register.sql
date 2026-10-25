CREATE TABLE public.attendance_trials (
 school_id uuid PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
 started_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.attendance_trials TO authenticated;
GRANT ALL ON public.attendance_trials TO service_role;
ALTER TABLE public.attendance_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read attendance trial" ON public.attendance_trials FOR SELECT TO authenticated USING (public.is_school_member(school_id));

CREATE TABLE public.attendance_early_learners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
 class_id text NOT NULL,
 name text NOT NULL,
 admission_no text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT attendance_early_class CHECK (class_id ~ '^(creche|nursery1|nursery2)([abc])?$')
);
GRANT SELECT, INSERT, DELETE ON public.attendance_early_learners TO authenticated;
GRANT ALL ON public.attendance_early_learners TO service_role;
ALTER TABLE public.attendance_early_learners ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_edit_attendance(_school uuid, _class text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned jsonb; subjects jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_school_member(_school) THEN RETURN false; END IF;
 IF public.is_school_admin(_school) THEN RETURN true; END IF;
 SELECT details->'classAssignments'->_class, details->'subjectAssignments'->_class INTO assigned, subjects FROM public.schools WHERE id = _school;
 IF coalesce(jsonb_array_length(assigned), 0) > 0 THEN
  RETURN assigned ? auth.uid()::text;
 END IF;
 IF _class ~ '^b[789]' AND subjects IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_each(subjects) s WHERE jsonb_array_length(s.value) > 0) THEN
  RETURN EXISTS (SELECT 1 FROM jsonb_each(subjects) s WHERE s.value ? auth.uid()::text);
 END IF;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.can_edit_attendance(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_attendance(uuid,text) TO authenticated;
CREATE POLICY "Members read early learners" ON public.attendance_early_learners FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Assigned teachers add early learners" ON public.attendance_early_learners FOR INSERT TO authenticated WITH CHECK (public.can_edit_attendance(school_id,class_id));
CREATE POLICY "Assigned teachers remove early learners" ON public.attendance_early_learners FOR DELETE TO authenticated USING (public.can_edit_attendance(school_id,class_id));
CREATE OR REPLACE FUNCTION public.validate_early_attendance_learner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 PERFORM 1 FROM public.schools WHERE id = NEW.school_id FOR UPDATE;
 IF length(trim(NEW.name)) = 0 THEN RAISE EXCEPTION 'Enter a learner name'; END IF;
 IF (SELECT count(*) FROM public.attendance_early_learners WHERE school_id=NEW.school_id AND class_id=NEW.class_id) >= 35 THEN RAISE EXCEPTION 'Class full (35 max)'; END IF;
 IF EXISTS (SELECT 1 FROM public.attendance_early_learners WHERE school_id=NEW.school_id AND class_id=NEW.class_id AND (lower(trim(name))=lower(trim(NEW.name)) OR (trim(NEW.admission_no) <> '' AND lower(trim(admission_no))=lower(trim(NEW.admission_no))))) THEN RAISE EXCEPTION 'This learner is already registered'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_early_attendance_learner BEFORE INSERT ON public.attendance_early_learners FOR EACH ROW EXECUTE FUNCTION public.validate_early_attendance_learner();

CREATE TABLE public.daily_attendance (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
 class_id text NOT NULL,
 attendance_date date NOT NULL,
 entries jsonb NOT NULL DEFAULT '[]'::jsonb,
 recorded_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(school_id,class_id,attendance_date)
);
GRANT SELECT ON public.daily_attendance TO authenticated;
GRANT ALL ON public.daily_attendance TO service_role;
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read daily attendance" ON public.daily_attendance FOR SELECT TO authenticated USING (public.is_school_member(school_id));

CREATE OR REPLACE FUNCTION public.attendance_access(_school uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE started timestamptz; paid boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_school_member(_school) THEN RAISE EXCEPTION 'Join this school first'; END IF;
 SELECT started_at INTO started FROM public.attendance_trials WHERE school_id = _school;
 SELECT license_permanent OR license_expires_at > now() INTO paid FROM public.schools WHERE id = _school;
 RETURN jsonb_build_object('started_at', started, 'expires_at', started + interval '14 days', 'allowed', started IS NULL OR now() < started + interval '14 days' OR coalesce(paid,false) OR public.is_developer(), 'licensed', coalesce(paid,false) OR public.is_developer());
END; $$;
REVOKE ALL ON FUNCTION public.attendance_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attendance_access(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_daily_attendance(_school uuid, _class text, _date date, _present_ids text[]) RETURNS public.daily_attendance
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE roster jsonb; result public.daily_attendance; access jsonb;
BEGIN
 IF NOT public.can_edit_attendance(_school,_class) THEN RAISE EXCEPTION 'This class is view only for your account'; END IF;
 IF _class !~ '^(creche|nursery1|nursery2|kg1|kg2|b[1-9])([abc])?$' THEN RAISE EXCEPTION 'Invalid class'; END IF;
 IF _date IS NULL OR _date > current_date THEN RAISE EXCEPTION 'Select today or a past date'; END IF;
 PERFORM 1 FROM public.schools WHERE id = _school FOR UPDATE;
 access := public.attendance_access(_school);
 IF NOT (access->>'allowed')::boolean THEN RAISE EXCEPTION 'The 14-day trial has ended. Activate a School Cloud license to save attendance.'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'admissionNo',r.admission_no,'present',r.id = ANY(coalesce(_present_ids,ARRAY[]::text[]))) ORDER BY r.name,r.id) INTO roster FROM (
  SELECT id::text, name, admission_no FROM public.attendance_early_learners WHERE school_id=_school AND class_id=_class
  UNION ALL
  SELECT id, coalesce(data->>'name',''), coalesce(data->>'admissionNo','') FROM public.school_students WHERE school_id=_school AND class_id=_class
 ) r;
 IF roster IS NULL THEN RAISE EXCEPTION 'Add learners before saving attendance'; END IF;
 IF EXISTS (SELECT 1 FROM unnest(coalesce(_present_ids,ARRAY[]::text[])) p WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(roster) e WHERE e->>'id'=p)) THEN RAISE EXCEPTION 'The class register changed. Reload and try again.'; END IF;
 INSERT INTO public.attendance_trials(school_id) VALUES (_school) ON CONFLICT(school_id) DO NOTHING;
 INSERT INTO public.daily_attendance(school_id,class_id,attendance_date,entries,recorded_by) VALUES (_school,_class,_date,roster,auth.uid())
 ON CONFLICT(school_id,class_id,attendance_date) DO UPDATE SET entries=EXCLUDED.entries, recorded_by=auth.uid(), updated_at=now()
 RETURNING * INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.save_daily_attendance(uuid,text,date,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_daily_attendance(uuid,text,date,text[]) TO authenticated;