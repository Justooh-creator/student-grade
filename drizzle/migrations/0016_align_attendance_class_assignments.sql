CREATE OR REPLACE FUNCTION public.can_edit_attendance(_school uuid, _class text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE assigned jsonb; subjects jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_school_member(_school) THEN RETURN false; END IF;
 IF public.is_school_admin(_school) THEN RETURN true; END IF;
 SELECT details->'classAssignments'->_class, details->'subjectAssignments'->_class INTO assigned, subjects FROM public.schools WHERE id = _school;
 IF _class ~ '^b[789]' AND subjects IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_each(subjects) s WHERE jsonb_array_length(s.value) > 0) THEN
  RETURN coalesce(assigned ? auth.uid()::text, false) OR EXISTS (SELECT 1 FROM jsonb_each(subjects) s WHERE s.value ? auth.uid()::text);
 END IF;
 IF coalesce(jsonb_array_length(assigned), 0) > 0 THEN RETURN assigned ? auth.uid()::text; END IF;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.can_edit_attendance(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_attendance(uuid,text) TO authenticated;