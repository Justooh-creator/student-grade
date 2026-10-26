CREATE OR REPLACE FUNCTION public.fee_admin_ok(_school uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE started timestamptz; paid boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.is_school_admin(_school) OR public.is_developer()) THEN RETURN false; END IF;
 SELECT started_at INTO started FROM public.attendance_trials WHERE school_id=_school;
 SELECT license_permanent OR license_expires_at > now() INTO paid FROM public.schools WHERE id=_school;
 RETURN started IS NULL OR now() < started + interval '14 days' OR coalesce(paid,false) OR public.is_developer();
END $$;

CREATE TABLE public.fee_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
 name text NOT NULL,
 daily_rate numeric(10,2) NOT NULL DEFAULT 0 CHECK (daily_rate >= 0),
 default_on boolean NOT NULL DEFAULT false,
 sort integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_items TO authenticated;
GRANT ALL ON public.fee_items TO service_role;
ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage fee items" ON public.fee_items FOR ALL TO authenticated USING (public.fee_admin_ok(school_id)) WITH CHECK (public.fee_admin_ok(school_id));

CREATE TABLE public.learner_fee_profiles (
 school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
 learner_id text NOT NULL,
 parent_phone text NOT NULL DEFAULT '',
 enrolled jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (school_id, learner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_fee_profiles TO authenticated;
GRANT ALL ON public.learner_fee_profiles TO service_role;
ALTER TABLE public.learner_fee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage fee profiles" ON public.learner_fee_profiles FOR ALL TO authenticated USING (public.fee_admin_ok(school_id)) WITH CHECK (public.fee_admin_ok(school_id));

CREATE TABLE public.fee_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
 learner_id text NOT NULL,
 fee_id uuid NOT NULL REFERENCES public.fee_items(id) ON DELETE CASCADE,
 amount numeric(10,2) NOT NULL CHECK (amount > 0),
 kind text NOT NULL CHECK (kind IN ('advance','arrears')),
 method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','momo')),
 paid_on date NOT NULL DEFAULT current_date,
 recorded_by uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.fee_payments TO authenticated;
GRANT ALL ON public.fee_payments TO service_role;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read payments" ON public.fee_payments FOR SELECT TO authenticated USING (public.fee_admin_ok(school_id));
CREATE POLICY "Owners record payments" ON public.fee_payments FOR INSERT TO authenticated WITH CHECK (public.fee_admin_ok(school_id) AND recorded_by = auth.uid());
CREATE POLICY "Owners remove payments" ON public.fee_payments FOR DELETE TO authenticated USING (public.fee_admin_ok(school_id));

CREATE TABLE public.school_fee_settings (
 school_id uuid PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
 momo_network text NOT NULL DEFAULT '',
 momo_number text NOT NULL DEFAULT '',
 momo_name text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE ON public.school_fee_settings TO authenticated;
GRANT ALL ON public.school_fee_settings TO service_role;
ALTER TABLE public.school_fee_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage momo" ON public.school_fee_settings FOR ALL TO authenticated USING (public.fee_admin_ok(school_id)) WITH CHECK (public.fee_admin_ok(school_id));

CREATE OR REPLACE FUNCTION public.ensure_default_fees(_school uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.fee_admin_ok(_school) THEN RAISE EXCEPTION 'Only the school owner can open fees'; END IF;
 PERFORM 1 FROM public.schools WHERE id=_school FOR UPDATE;
 IF NOT EXISTS (SELECT 1 FROM public.fee_items WHERE school_id=_school) THEN
  INSERT INTO public.fee_items(school_id,name,daily_rate,default_on,sort) VALUES (_school,'Feeding',5,true,0),(_school,'Bus',6,false,1);
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.save_daily_attendance_fees(_school uuid, _class text, _date date, _present_ids text[], _unpaid_ids text[])
 RETURNS public.daily_attendance LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result public.daily_attendance; unpaid text[] := coalesce(_unpaid_ids, ARRAY[]::text[]);
BEGIN
 IF EXISTS (SELECT 1 FROM unnest(unpaid) u WHERE NOT u = ANY(coalesce(_present_ids,ARRAY[]::text[]))) THEN RAISE EXCEPTION 'Only present learners can be marked No Money Today'; END IF;
 result := public.save_daily_attendance(_school,_class,_date,_present_ids);
 UPDATE public.daily_attendance SET entries = (SELECT coalesce(jsonb_agg(e || jsonb_build_object('unpaid', (e->>'id') = ANY(unpaid))), '[]'::jsonb) FROM jsonb_array_elements(entries) e)
  WHERE id = result.id RETURNING * INTO result;
 RETURN result;
END $$;