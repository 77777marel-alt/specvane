begin;
insert into public.brands (slug,name) values ('samsung','Samsung');
insert into public.products (category_id,brand_id,slug,name,data_source,variants)
  values ((select id from public.categories where key='smartphones'),(select id from public.brands where slug='samsung'),'samsung-galaxy-s22','Galaxy S22','icecat','[{"icecat_id":96571544}]');
insert into public.product_images (product_id,url,source) values ((select id from public.products where slug='samsung-galaxy-s22'),'https://images.icecat.biz/x.jpg','icecat');
insert into public.product_identifiers (product_id,kind,value) values ((select id from public.products where slug='samsung-galaxy-s22'),'icecat','96571544');
insert into public.source_items (source,external_id,category_key,updated) values ('icecat','96571544','smartphones','20260101000000');
do $$ begin
  begin insert into public.products (category_id,brand_id,slug,name,data_source) values (1,1,'x-x','X','scraped'); raise exception 'data_source check missing'; exception when check_violation then null; end;
end $$;
set local role anon;
do $$ begin
  begin perform 1 from public.source_items; raise exception 'anon reads source_items'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'ALL 0003 TESTS PASSED';
rollback;
