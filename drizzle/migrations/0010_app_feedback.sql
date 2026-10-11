CREATE TABLE public.app_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  sender_name text NOT NULL DEFAULT '',
  school_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General Feedback',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  CONSTRAINT app_feedback_message_len CHECK (char_length(message) BETWEEN 3 AND 3000),
  CONSTRAINT app_feedback_fields_len CHECK (char_length(sender_name) <= 120 AND char_length(school_name) <= 200 AND char_length(phone) <= 30 AND char_length(category) <= 60)
);
GRANT INSERT ON public.app_feedback TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_feedback TO authenticated;
GRANT ALL ON public.app_feedback TO service_role;
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_licenses WHERE user_id = auth.uid() AND permanent)
$$;

CREATE POLICY "Anyone submits feedback" ON public.app_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Developer reads feedback" ON public.app_feedback FOR SELECT TO authenticated USING (public.is_developer());
CREATE POLICY "Developer updates feedback" ON public.app_feedback FOR UPDATE TO authenticated USING (public.is_developer()) WITH CHECK (public.is_developer());
CREATE POLICY "Developer deletes feedback" ON public.app_feedback FOR DELETE TO authenticated USING (public.is_developer());