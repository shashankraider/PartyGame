-- Keep maintenance functions independent of the caller's schema search path.
alter function public.set_updated_at() set search_path = '';

create or replace function public.gc_expired_sessions()
returns integer language plpgsql set search_path = '' as $$
declare deleted_count integer;
begin
  delete from public.sessions where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
revoke execute on function public.gc_expired_sessions() from public, anon, authenticated;
grant execute on function public.gc_expired_sessions() to service_role;
