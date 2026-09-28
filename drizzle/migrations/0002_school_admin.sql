CREATE OR REPLACE FUNCTION public.is_school_admin(_school uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = _school AND user_id = auth.uid() AND role = 'headteacher')
$$;

CREATE OR REPLACE FUNCTION public.set_member_role(_member uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m school_members;
BEGIN
  IF _role NOT IN ('headteacher','teacher') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  SELECT * INTO m FROM school_members WHERE id = _member;
  IF m IS NULL OR NOT is_school_admin(m.school_id) THEN RAISE EXCEPTION 'Only a school admin can do this'; END IF;
  IF _role = 'teacher' AND m.role = 'headteacher'
     AND (SELECT count(*) FROM school_members WHERE school_id = m.school_id AND role = 'headteacher') <= 1 THEN
    RAISE EXCEPTION 'The school needs at least one admin';
  END IF;
  UPDATE school_members SET role = _role WHERE id = _member;
END $$;

CREATE OR REPLACE FUNCTION public.remove_member(_member uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m school_members;
BEGIN
  SELECT * INTO m FROM school_members WHERE id = _member;
  IF m IS NULL OR NOT is_school_admin(m.school_id) THEN RAISE EXCEPTION 'Only a school admin can do this'; END IF;
  IF m.user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot remove yourself here'; END IF;
  DELETE FROM school_members WHERE id = _member;
END $$;

CREATE OR REPLACE FUNCTION public.regenerate_join_code(_school uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  IF NOT is_school_admin(_school) THEN RAISE EXCEPTION 'Only a school admin can do this'; END IF;
  LOOP
    c := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM schools WHERE join_code = c);
  END LOOP;
  UPDATE schools SET join_code = c WHERE id = _school;
  RETURN c;
END $$;

REVOKE EXECUTE ON FUNCTION public.set_member_role(uuid,text), public.remove_member(uuid), public.regenerate_join_code(uuid), public.is_school_admin(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid,text), public.remove_member(uuid), public.regenerate_join_code(uuid), public.is_school_admin(uuid) TO authenticated;

ALTER TABLE public.school_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_members;