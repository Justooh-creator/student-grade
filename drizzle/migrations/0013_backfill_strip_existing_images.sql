COMMENT ON FUNCTION public.strip_cloud_images() IS 'Keeps cloud records text-only: removes photos, logos, signatures and stamps.';
UPDATE public.school_students SET data = data - 'photo' WHERE data ? 'photo';
UPDATE public.schools SET details = details - 'logo' - 'signature' - 'stamp' - 'classTeacherSignatures' WHERE details ?| array['logo','signature','stamp','classTeacherSignatures'];