-- 0008: статистика характеристик по категории — для «лучше, чем у N% моделей», гистограмм и радара сравнения.
-- Считается из наших данных (без ИИ). Пересчёт — rebuild_spec_stats(категория) в конце каждой загрузки.

create table if not exists public.spec_stats (
  spec_id     bigint primary key references public.spec_definitions(id) on delete cascade,
  category_id bigint not null references public.categories(id) on delete cascade,
  n           int not null,                 -- моделей со значением
  pct         double precision[] not null,  -- 101 перцентиль (0..100)
  hist        int[] not null,               -- 20 столбцов между 1-м и 99-м перцентилем
  lo          double precision,             -- граница гистограммы (1-й перцентиль)
  hi          double precision,             -- граница гистограммы (99-й перцентиль)
  updated_at  timestamptz not null default now()
);
alter table public.spec_stats enable row level security;
revoke all on public.spec_stats from anon, authenticated;
grant select on public.spec_stats to anon, authenticated;
grant all on public.spec_stats to service_role;
drop policy if exists spec_stats_read on public.spec_stats;
create policy spec_stats_read on public.spec_stats for select to anon, authenticated using (true);

create or replace function public.rebuild_spec_stats(p_category text)
returns int
language plpgsql
security definer
set search_path = ''
set statement_timeout = '300s'
as $$
declare
  v_cat bigint;
  v_n int;
begin
  select id into v_cat from public.categories where key = p_category;
  if v_cat is null then return 0; end if;

  delete from public.spec_stats where category_id = v_cat;

  with v as (
    select s.spec_id, s.value_num::double precision as x
    from public.product_specs s
    join public.products p on p.id = s.product_id
    join public.spec_definitions d on d.id = s.spec_id
    where p.category_id = v_cat and p.status = 'active' and d.data_type = 'number' and s.value_num is not null
  ), agg as (
    select spec_id, count(*)::int as n,
           percentile_disc((select array_agg(g / 100.0)::double precision[] from generate_series(0, 100) g)) within group (order by x) as pct
    from v group by spec_id having count(*) >= 10
  ), b as (
    select a.spec_id, a.n, a.pct, a.pct[2] as lo, a.pct[100] as hi from agg a
  ), h as (
    select b.spec_id, k, count(v.x)::int as c
    from b cross join generate_series(1, 20) k
    left join v on v.spec_id = b.spec_id
      and case when b.hi > b.lo then least(greatest(width_bucket(v.x, b.lo, b.hi, 20), 1), 20) else 1 end = k
    group by b.spec_id, k
  )
  insert into public.spec_stats (spec_id, category_id, n, pct, hist, lo, hi)
  select b.spec_id, v_cat, b.n, b.pct, (select array_agg(h.c order by h.k) from h where h.spec_id = b.spec_id), b.lo, b.hi
  from b;

  select count(*) into v_n from public.spec_stats where category_id = v_cat;
  return v_n;
end $$;

revoke all on function public.rebuild_spec_stats(text) from public, anon, authenticated;
grant execute on function public.rebuild_spec_stats(text) to service_role;
