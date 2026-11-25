ALTER TABLE public.student_deletions ADD COLUMN head_hidden_at timestamptz;
CREATE OR REPLACE FUNCTION public.list_deleted_students(_school uuid)
RETURNS TABLE (id uuid, student_id text, student_name text, class_id text, deleted_by_name text, deleted_by_email text, deleted_at timestamptz, restored_at timestamptz, restored_by_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.school_members m WHERE m.school_id = _school AND m.user_id = auth.uid() AND m.role = 'headteacher') AND NOT public.is_developer() THEN
    RAISE EXCEPTION 'Only the headteacher can view deleted learners' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.student_deletions d WHERE d.deleted_at < now() - interval '30 days';
  RETURN QUERY SELECT d.id, d.student_id, d.student_name, d.class_id, d.deleted_by_name, d.deleted_by_email, d.deleted_at, d.restored_at, d.restored_by_name
    FROM public.student_deletions d WHERE d.school_id = _school AND d.head_hidden_at IS NULL ORDER BY d.deleted_at DESC;
END $$;
REVOKE EXECUTE ON FUNCTION public.list_deleted_students(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_deleted_students(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.empty_student_bin(_school uuid DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501'; END IF;
  IF _school IS NULL THEN
    IF NOT public.is_developer() THEN RAISE EXCEPTION 'Developer only' USING ERRCODE = '42501'; END IF;
    DELETE FROM public.student_deletions WHERE restored_at IS NULL;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.school_members WHERE school_id = _school AND user_id = auth.uid() AND role = 'headteacher') THEN
      RAISE EXCEPTION 'Headteacher only' USING ERRCODE = '42501';
    END IF;
    UPDATE public.student_deletions SET head_hidden_at = now() WHERE school_id = _school AND head_hidden_at IS NULL AND restored_at IS NULL;
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END $$;
REVOKE EXECUTE ON FUNCTION public.empty_student_bin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empty_student_bin(uuid) TO authenticated;
CREATE TABLE public.developer_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'heads', 'unverified')),
  kind text NOT NULL DEFAULT 'update' CHECK (kind IN ('update', 'tip', 'urgent')),
  whatsapp_phone text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcement_title_length CHECK (length(trim(title)) BETWEEN 1 AND 160),
  CONSTRAINT announcement_body_length CHECK (length(trim(body)) BETWEEN 1 AND 4000),
  CONSTRAINT announcement_phone CHECK (whatsapp_phone = '' OR whatsapp_phone ~ '^[0-9]{8,15}$')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_announcements TO authenticated;
GRANT ALL ON public.developer_announcements TO service_role;
ALTER TABLE public.developer_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY developer_manage_announcements ON public.developer_announcements FOR ALL TO authenticated USING (public.is_developer()) WITH CHECK (public.is_developer());
CREATE TABLE public.announcement_dismissals (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  announcement_id uuid NOT NULL REFERENCES public.developer_announcements(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  PRIMARY KEY (user_id, announcement_id)
);
GRANT SELECT, INSERT, UPDATE ON public.announcement_dismissals TO authenticated;
GRANT ALL ON public.announcement_dismissals TO service_role;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_announcement_dismissals ON public.announcement_dismissals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.validate_announcement()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.revision := OLD.revision + 1;
    NEW.updated_at := now();
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER announcement_revision BEFORE UPDATE ON public.developer_announcements FOR EACH ROW EXECUTE FUNCTION public.validate_announcement();
CREATE OR REPLACE FUNCTION public.list_my_announcements()
RETURNS SETOF public.developer_announcements LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.* FROM public.developer_announcements a
  WHERE auth.uid() IS NOT NULL AND a.active
    AND (a.audience = 'all'
      OR (a.audience = 'heads' AND EXISTS (SELECT 1 FROM public.school_members m WHERE m.user_id = auth.uid() AND m.role = 'headteacher'))
      OR (a.audience = 'unverified' AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.email_confirmed_at IS NULL)))
    AND NOT EXISTS (SELECT 1 FROM public.announcement_dismissals d WHERE d.user_id = auth.uid() AND d.announcement_id = a.id AND d.revision = a.revision)
  ORDER BY a.created_at DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.list_my_announcements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_announcements() TO authenticated;