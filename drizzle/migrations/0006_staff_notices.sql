CREATE TABLE public.staff_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  meeting_date text NOT NULL DEFAULT '',
  meeting_time text NOT NULL DEFAULT '',
  venue text NOT NULL DEFAULT '',
  agenda text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX staff_notices_school_idx ON public.staff_notices(school_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.staff_notices TO authenticated;
GRANT ALL ON public.staff_notices TO service_role;
ALTER TABLE public.staff_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read notices" ON public.staff_notices FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins post notices" ON public.staff_notices FOR INSERT TO authenticated WITH CHECK (public.is_school_admin(school_id) AND created_by = auth.uid());
CREATE POLICY "Admins delete notices" ON public.staff_notices FOR DELETE TO authenticated USING (public.is_school_admin(school_id));

CREATE TABLE public.staff_notice_reads (
  notice_id uuid NOT NULL REFERENCES public.staff_notices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notice_id, user_id)
);
GRANT SELECT, INSERT ON public.staff_notice_reads TO authenticated;
GRANT ALL ON public.staff_notice_reads TO service_role;
ALTER TABLE public.staff_notice_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read acknowledgments" ON public.staff_notice_reads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff_notices n WHERE n.id = notice_id AND public.is_school_member(n.school_id)));
CREATE POLICY "Acknowledge own" ON public.staff_notice_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.staff_notices n WHERE n.id = notice_id AND public.is_school_member(n.school_id)));

ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_notices;