begin;
insert into public.brands (slug,name) values ('samsung','Samsung'),('xiaomi','Xiaomi'),('apple','Apple');
do $$ declare v_c bigint := (select id from public.categories where key='smartphones'); begin
  insert into public.products (category_id,brand_id,slug,name,status,release_date) values
   (v_c,(select id from public.brands where slug='samsung'),'samsung-galaxy-s24','Galaxy S24','active','2024-01-20'),
   (v_c,(select id from public.brands where slug='samsung'),'samsung-galaxy-s25','Galaxy S25','active','2025-01-22'),
   (v_c,(select id from public.brands where slug='samsung'),'samsung-galaxy-a16','Galaxy A16','active','2024-10-01'),
   (v_c,(select id from public.brands where slug='xiaomi'),'xiaomi-14','14','active','2024-02-25'),
   (v_c,(select id from public.brands where slug='apple'),'apple-iphone-old','iPhone 6','active','2014-09-19'),
   (v_c,(select id from public.brands where slug='xiaomi'),'xiaomi-draft','Draft','draft','2024-02-25');
  insert into public.product_specs (product_id,spec_id,value_num)
  select p.id, d.id, v.val from (values
    ('samsung-galaxy-s24','display_size',6.2),('samsung-galaxy-s24','ram',8),('samsung-galaxy-s24','battery',4000),
    ('samsung-galaxy-s25','display_size',6.2),('samsung-galaxy-s25','ram',12),('samsung-galaxy-s25','battery',4000),
    ('samsung-galaxy-a16','display_size',6.7),('samsung-galaxy-a16','ram',4),('samsung-galaxy-a16','battery',5000),
    ('xiaomi-14','display_size',6.36),('xiaomi-14','ram',12),('xiaomi-14','battery',4610)) v(slug,key,val)
  join public.products p on p.slug=v.slug join public.spec_definitions d on d.key=v.key and d.category_id=v_c;
end $$;
do $$ declare v_n int; v_s24 bigint; v_s25 bigint; v_x bigint; v_old bigint; begin
  select public.rebuild_comparisons('smartphones', 3) into v_n;
  select id into v_s24 from public.products where slug='samsung-galaxy-s24';
  select id into v_s25 from public.products where slug='samsung-galaxy-s25';
  select id into v_x from public.products where slug='xiaomi-14';
  select id into v_old from public.products where slug='apple-iphone-old';
  assert v_n > 0, 'no pairs';
  assert exists (select 1 from public.comparisons where product_a=least(v_s24,v_s25) and product_b=greatest(v_s24,v_s25)), 'S24 vs S25 missing';
  assert exists (select 1 from public.comparisons where product_a=least(v_s24,v_x) and product_b=greatest(v_s24,v_x)), 'S24 vs Xiaomi 14 missing';
  assert not exists (select 1 from public.comparisons where v_old in (product_a,product_b)), 'old phone paired with new';
  assert not exists (select 1 from public.comparisons c join public.products p on p.id in (c.product_a,c.product_b) where p.status='draft'), 'draft paired';
  -- повторный вызов не плодит дубли
  perform public.rebuild_comparisons('smartphones', 3);
  assert (select count(*) from public.comparisons) = v_n, 'duplicates';
end $$;
set local role anon;
do $$ begin
  begin perform public.rebuild_comparisons('smartphones', 3); raise exception 'anon can rebuild'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'ALL 0004 TESTS PASSED';
rollback;
