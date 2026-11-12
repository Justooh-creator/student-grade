REVOKE ALL ON public.student_sync_conflicts FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.student_sync_conflicts FROM authenticated;
GRANT SELECT, INSERT ON public.student_sync_conflicts TO authenticated;
GRANT UPDATE (resolved_at, resolved_by, resolution) ON public.student_sync_conflicts TO authenticated;
GRANT ALL ON public.student_sync_conflicts TO service_role;