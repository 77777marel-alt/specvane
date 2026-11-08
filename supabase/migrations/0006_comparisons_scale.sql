-- 0006: пары «A vs B» считаем среди 3000 самых новых моделей категории (масштаб: ноутбуки, ТВ, мониторы).

create or replace function public.rebuild_comparisons(p_category text, p_per int default 5)
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
  drop table if exists _p, _pairs;

  create temp table _p on commit drop as
  select p.id, p.brand_id, p.name,
         coalesce(p.release_date, date '2015-01-01') as rel,
         max(case when d.key = 'display_size' then s.value_num end) as disp,
         max(case when d.key = 'ram' then s.value_num end) as ram,
         max(case when d.key = 'battery' then s.value_num end) as bat,
         max(case when d.key = 'main_camera' then s.value_num end) as cam,
         max(case when d.key = 'refresh_rate' then s.value_num end) as hz,
         -- линейка: имя без последнего числа (Galaxy S24 → «galaxy s»), номер поколения
         lower(regexp_replace(p.name, '\s*\d+.*$', '')) as line,
         nullif(substring(p.name from '(\d{1,9})'), '')::int as gen
  from public.products p
  left join public.product_specs s on s.product_id = p.id
  left join public.spec_definitions d on d.id = s.spec_id
  where p.category_id = v_cat and p.status = 'active' and p.release_date is not null
  group by p.id
  order by 4 desc   -- самые новые модели: пары ищут среди них; иначе ноутбуки (десятки тысяч) не уложатся по времени
  limit 3000;

  create temp table _pairs on commit drop as
  with scored as (
    select a.id as a, b.id as b,
           abs(a.rel - b.rel) / 182.0
           + coalesce(abs(a.disp - b.disp) / 0.4, 1.5)
           + coalesce(abs(a.ram - b.ram) / 4.0, 1)
           + coalesce(abs(a.bat - b.bat) / 800.0, 1)
           + coalesce(abs(a.cam - b.cam) / 50.0, 0.5)
           + coalesce(abs(a.hz - b.hz) / 60.0, 0.5)
           - case when a.brand_id <> b.brand_id then 0.3 else 0 end as dist
    from _p a join _p b on a.id <> b.id and abs(a.rel - b.rel) <= 400
  ), ranked as (
    select a, b, dist, row_number() over (partition by a order by dist) as rn from scored
  )
  select least(a, b) as pa, greatest(a, b) as pb, min(dist) as dist from ranked where rn <= p_per group by 1, 2
  union
  -- соседние поколения одной линейки одного бренда
  select least(a.id, b.id), greatest(a.id, b.id), 0.5
  from _p a join _p b on a.brand_id = b.brand_id and a.line = b.line and a.line <> '' and b.gen = a.gen + 1 and a.id <> b.id;

  insert into public.comparisons (product_a, product_b, category_id, relevance, is_indexable)
  select pa, pb, v_cat, round((10.0 / (1 + min(dist)))::numeric, 3), true from _pairs group by pa, pb
  on conflict (product_a, product_b) do update set relevance = excluded.relevance, is_indexable = true, updated_at = now();

  -- пары, где модель ушла из каталога, не показываем
  update public.comparisons c set is_indexable = false
  where c.category_id = v_cat and (
    not exists (select 1 from public.products p where p.id = c.product_a and p.status = 'active') or
    not exists (select 1 from public.products p where p.id = c.product_b and p.status = 'active'));

  select count(*) into v_n from public.comparisons where category_id = v_cat and is_indexable;
  return v_n;
end $$;

revoke all on function public.rebuild_comparisons(text, int) from public, anon, authenticated;
grant execute on function public.rebuild_comparisons(text, int) to service_role;

