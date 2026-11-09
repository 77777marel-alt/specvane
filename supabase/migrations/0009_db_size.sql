-- Размер базы в МБ для предохранителя импорта (бесплатный Supabase — 500 МБ). Только для service_role.
create or replace function public.db_size_mb() returns integer language sql security definer set search_path = public as $$ select (pg_database_size(current_database()) / 1048576)::int $$;
revoke all on function public.db_size_mb() from public, anon, authenticated;
grant execute on function public.db_size_mb() to service_role;
