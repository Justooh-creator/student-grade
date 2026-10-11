CREATE OR REPLACE FUNCTION public.strip_cloud_images()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_TABLE_NAME = 'school_students' THEN
    NEW.data := NEW.data - 'photo';
  ELSIF TG_TABLE_NAME = 'schools' THEN
    NEW.details := (NEW.details - 'logo' - 'signature' - 'stamp' - 'classTeacherSignatures');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS strip_student_images ON public.school_students;
CREATE TRIGGER strip_student_images BEFORE INSERT OR UPDATE ON public.school_students
  FOR EACH ROW EXECUTE FUNCTION public.strip_cloud_images();

DROP TRIGGER IF EXISTS strip_school_images ON public.schools;
CREATE TRIGGER strip_school_images BEFORE INSERT OR UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.strip_cloud_images();