CREATE OR REPLACE FUNCTION public.guard_school_details_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT (public.is_school_admin(OLD.id) OR public.is_developer()) THEN
    IF NEW.name IS DISTINCT FROM OLD.name
       OR (COALESCE(NEW.details, '{}'::jsonb) - 'classTeacher' - 'classTeachers' - 'classTeacherSignatures' - 'timetables' - 'logo' - 'signature' - 'stamp') IS DISTINCT FROM
          (COALESCE(OLD.details, '{}'::jsonb) - 'classTeacher' - 'classTeachers' - 'classTeacherSignatures' - 'timetables' - 'logo' - 'signature' - 'stamp') THEN
      RAISE EXCEPTION 'Only a headteacher or admin can change School Details' USING ERRCODE = '42501';
    END IF;
    -- Preserve school images as well; the existing stripping trigger keeps them device-only.
    NEW.details := (NEW.details - 'logo' - 'signature' - 'stamp') ||
      jsonb_build_object('logo', OLD.details->'logo', 'signature', OLD.details->'signature', 'stamp', OLD.details->'stamp');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_school_details_update() FROM PUBLIC;
CREATE TRIGGER guard_school_details_update BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.guard_school_details_update();
ALTER POLICY "Members update school" ON public.schools TO authenticated
USING (public.is_school_member(id) OR public.is_developer())
WITH CHECK (public.is_school_member(id) OR public.is_developer());
ALTER POLICY "Members read school" ON public.schools TO authenticated
USING (public.is_school_member(id) OR public.is_developer());