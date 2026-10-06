CREATE OR REPLACE FUNCTION public.shares_school_with(_other uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members me
    JOIN public.school_members them ON them.school_id = me.school_id
    WHERE me.user_id = auth.uid() AND them.user_id = _other
  )
$$;
DROP POLICY IF EXISTS "Teachers can view teacher directory" ON public.profiles;
CREATE POLICY "View own and same-school profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.shares_school_with(id));
