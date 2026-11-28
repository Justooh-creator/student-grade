ALTER TABLE public.duty_rosters ADD COLUMN IF NOT EXISTS week_number integer;
COMMENT ON COLUMN public.duty_rosters.week_number IS 'Display week number assigned by the headteacher when publishing a term duty plan.';
CREATE OR REPLACE FUNCTION public.dev_registration_list(_search text DEFAULT '', _offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_developer() THEN RAISE EXCEPTION 'Developer access required' USING ERRCODE='42501'; END IF;
 WITH accounts AS (
 SELECT u.id, coalesce(p.display_name,'') AS display_name, coalesce(u.email,'') AS email,
 u.created_at, u.email_confirmed_at IS NOT NULL AS verified,
 coalesce(m.role,'individual') AS role, coalesce(s.name,'') AS school_name
 FROM auth.users u LEFT JOIN public.profiles p ON p.id=u.id
 LEFT JOIN LATERAL (SELECT sm.school_id, sm.role FROM public.school_members sm WHERE sm.user_id=u.id ORDER BY sm.created_at, sm.id LIMIT 1) m ON true
 LEFT JOIN public.schools s ON s.id=m.school_id
 ), filtered AS (
 SELECT * FROM accounts WHERE length(trim(coalesce(_search,'')))=0 OR
 strpos(lower(display_name || ' ' || email || ' ' || school_name),lower(left(trim(_search),100)))>0
 ), page AS (SELECT * FROM filtered ORDER BY created_at DESC,id LIMIT 8 OFFSET greatest(0,least(coalesce(_offset,0),1000000)))
 SELECT jsonb_build_object('total',(SELECT count(*) FROM accounts),'this_week',(SELECT count(*) FROM accounts WHERE created_at >= date_trunc('week',now())), 'matched',(SELECT count(*) FROM filtered), 'rows',coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC,id) FROM page),'[]'::jsonb)) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.dev_registration_list(text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dev_registration_list(text,integer) TO authenticated;
