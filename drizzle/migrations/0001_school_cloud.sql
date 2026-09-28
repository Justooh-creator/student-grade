CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  join_code text NOT NULL UNIQUE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.school_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'teacher',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE TABLE public.school_students (
  id text PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.school_students(school_id);

GRANT SELECT, UPDATE ON public.schools TO authenticated;
GRANT SELECT, DELETE ON public.school_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_students TO authenticated;
GRANT ALL ON public.schools, public.school_members, public.school_students TO service_role;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_school_member(_school uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = _school AND user_id = auth.uid())
$$;

CREATE POLICY "Members read school" ON public.schools FOR SELECT TO authenticated USING (public.is_school_member(id));
CREATE POLICY "Members update school" ON public.schools FOR UPDATE TO authenticated USING (public.is_school_member(id)) WITH CHECK (public.is_school_member(id));
CREATE POLICY "Members read members" ON public.school_members FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Leave school" ON public.school_members FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Members read students" ON public.school_students FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Members insert students" ON public.school_students FOR INSERT TO authenticated WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "Members update students" ON public.school_students FOR UPDATE TO authenticated USING (public.is_school_member(school_id)) WITH CHECK (public.is_school_member(school_id));
CREATE POLICY "Members delete students" ON public.school_students FOR DELETE TO authenticated USING (public.is_school_member(school_id));

CREATE OR REPLACE FUNCTION public.create_school(_name text)
RETURNS public.schools LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.schools; c text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM school_members WHERE user_id = auth.uid()) THEN RAISE EXCEPTION 'You already belong to a school'; END IF;
  LOOP
    c := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM schools WHERE join_code = c);
  END LOOP;
  INSERT INTO schools (name, join_code, created_by) VALUES (_name, c, auth.uid()) RETURNING * INTO s;
  INSERT INTO school_members (school_id, user_id, role) VALUES (s.id, auth.uid(), 'headteacher');
  RETURN s;
END $$;

CREATE OR REPLACE FUNCTION public.join_school(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO sid FROM schools WHERE join_code = upper(trim(_code));
  IF sid IS NULL THEN RAISE EXCEPTION 'School code not found'; END IF;
  INSERT INTO school_members (school_id, user_id) VALUES (sid, auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  RETURN sid;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_school(text), public.join_school(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_school(text), public.join_school(text), public.is_school_member(uuid) TO authenticated;

ALTER TABLE public.schools REPLICA IDENTITY FULL;
ALTER TABLE public.school_students REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schools;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_students;