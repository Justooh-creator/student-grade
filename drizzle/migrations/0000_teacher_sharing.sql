CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view teacher directory" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.record_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  class_id text NOT NULL CHECK (class_id IN ('b7','b8','b9')),
  sender_name text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, recipient_id, class_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.record_shares TO authenticated;
GRANT ALL ON public.record_shares TO service_role;
ALTER TABLE public.record_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sender or recipient can read" ON public.record_shares FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Sender inserts" ON public.record_shares FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND recipient_id <> sender_id);
CREATE POLICY "Sender updates" ON public.record_shares FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Sender or recipient deletes" ON public.record_shares FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
ALTER TABLE public.record_shares REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.record_shares;