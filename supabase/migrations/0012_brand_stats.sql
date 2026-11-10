-- 0012: статистика брендов по категории — для страниц «Бренд A или бренд B» (раздел brands).
-- Только наши данные: медиана и «лучшие 10 %» по числовым характеристикам моделей за последние 4 года.
-- Пересчёт — rebuild_brand_stats(категория) после каждой загрузки (scripts/icecat/rebuild.mjs).

create table if not exists public.brand_stats (
  category_id bigint not null references public.categories(id) on delete cascade,
  brand_id    bigint not null references public.brands(id) on delete cascade,
  n           int not null,          -- моделей в каталоге (активных)
  n_recent    int not null,          -- из них за последние 4 года
  newest      date,                  -- самая свежая модель
  updated_at  timestamptz not null default now(),
  primary key (category_id, brand_id)
);
create table if not exists public.brand_spec_stats (
  category_id bigint not null references public.categories(id) on delete cascade,
  brand_id    bigint not null references public.brands(id) on delete cascade,
  spec_id     bigint not null references public.spec_definitions(id) on delete cascade,
  n           int not null,
  med         double precision not null,   -- медиана
  top         double precision not null,   -- 90-й перцентиль (или 10-й, если меньше — лучше)
  primary key (category_id, brand_id, spec_id)
);
alter table public.brand_stats enable row level security;
alter table public.brand_spec_stats enable row level security;
revoke all on public.brand_stats, public.brand_spec_stats from anon, authenticated;
grant select on public.brand_stats, public.brand_spec_stats to anon, authenticated;
grant all on public.brand_stats, public.brand_spec_stats to service_role;
drop policy if exists brand_stats_read on public.brand_stats;
create policy brand_stats_read on public.brand_stats for select to anon, authenticated using (true);
drop policy if exists brand_spec_stats_read on public.brand_spec_stats;
create policy brand_spec_stats_read on public.brand_spec_stats for select to anon, authenticated using (true);

create or replace function public.rebuild_brand_stats(p_category text)
returns int
language plpgsql
security definer
set search_path = ''
set statement_timeout = '300s'
as $$
declare
  v_cat bigint;
  v_since date := (current_date - interval '4 years')::date;
  v_n int;
begin
  select id into v_cat from public.categories where key = p_category;
  if v_cat is null then return 0; end if;

  delete from public.brand_spec_stats where category_id = v_cat;
  delete from public.brand_stats where category_id = v_cat;

  insert into public.brand_stats (category_id, brand_id, n, n_recent, newest)
  select v_cat, p.brand_id, count(*)::int,
         count(*) filter (where p.release_date >= v_since)::int,
         max(p.release_date)
  from public.products p
  where p.category_id = v_cat and p.status = 'active'
  group by p.brand_id
  having count(*) >= 5;

  -- модели последних 4 лет; если у бренда их меньше 5 — все модели бренда
  insert into public.brand_spec_stats (category_id, brand_id, spec_id, n, med, top)
  select v_cat, x.brand_id, x.spec_id, count(*)::int,
         percentile_disc(0.5) within group (order by x.v),
         case when bool_or(x.hib) then percentile_disc(0.9) within group (order by x.v)
              else percentile_disc(0.1) within group (order by x.v) end
  from (
    select p.brand_id, s.spec_id, s.value_num::double precision as v, d.higher_is_better as hib
    from public.product_specs s
    join public.products p on p.id = s.product_id
    join public.spec_definitions d on d.id = s.spec_id
    join public.brand_stats b on b.category_id = v_cat and b.brand_id = p.brand_id
    where p.category_id = v_cat and p.status = 'active' and d.data_type = 'number'
      and d.higher_is_better is not null and s.value_num is not null
      and (b.n_recent < 5 or p.release_date >= v_since)
  ) x
  group by x.brand_id, x.spec_id
  having count(*) >= 3;

  select count(*) into v_n from public.brand_stats where category_id = v_cat;
  return v_n;
end $$;

revoke all on function public.rebuild_brand_stats(text) from public, anon, authenticated;
grant execute on function public.rebuild_brand_stats(text) to service_role;
