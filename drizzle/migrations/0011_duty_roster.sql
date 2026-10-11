CREATE TABLE public.duty_rosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  week_start date NOT NULL,
  entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, week_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.duty_rosters TO authenticated;
GRANT ALL ON public.duty_rosters TO service_role;
ALTER TABLE public.duty_rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read rosters" ON public.duty_rosters FOR SELECT TO authenticated USING (public.is_school_member(school_id));
CREATE POLICY "Admins insert rosters" ON public.duty_rosters FOR INSERT TO authenticated WITH CHECK (public.is_school_admin(school_id) AND created_by = auth.uid());
CREATE POLICY "Admins update rosters" ON public.duty_rosters FOR UPDATE TO authenticated USING (public.is_school_admin(school_id)) WITH CHECK (public.is_school_admin(school_id));
CREATE POLICY "Admins delete rosters" ON public.duty_rosters FOR DELETE TO authenticated USING (public.is_school_admin(school_id));

CREATE TABLE public.duty_roster_acks (
  roster_id uuid NOT NULL REFERENCES public.duty_rosters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  acked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (roster_id, user_id)
);
GRANT SELECT, INSERT ON public.duty_roster_acks TO authenticated;
GRANT ALL ON public.duty_roster_acks TO service_role;
ALTER TABLE public.duty_roster_acks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read roster acks" ON public.duty_roster_acks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.duty_rosters r WHERE r.id = roster_id AND public.is_school_member(r.school_id)));
CREATE POLICY "Acknowledge own roster" ON public.duty_roster_acks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.duty_rosters r WHERE r.id = roster_id AND public.is_school_member(r.school_id)));

ALTER PUBLICATION supabase_realtime ADD TABLE public.duty_rosters;