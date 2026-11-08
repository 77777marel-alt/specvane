-- Тесты 0001: запускать на чистом PG16 после stub.sql и миграции.
begin;
insert into public.categories (key, is_active) values ('projectors', true), ('hidden', false);
insert into public.category_i18n values
  ((select id from public.categories where key='projectors'),'de','beamer','Beamer',null,null),
  ((select id from public.categories where key='hidden'),'de','versteckt','X',null,null);
insert into public.brands (slug,name) values ('epson','Epson');
insert into public.products (category_id,brand_id,slug,name,status) values
  ((select id from public.categories where key='projectors'),(select id from public.brands where slug='epson'),'epson-eh-tw7100','EH-TW7100','active'),
  ((select id from public.categories where key='projectors'),(select id from public.brands where slug='epson'),'epson-draft','Draft','draft');
insert into public.texts (entity_type,entity_id,lang,kind,content,status) values
  ('product',(select id from public.products where slug='epson-eh-tw7100'),'de','summary','"ok"','published'),
  ('product',(select id from public.products where slug='epson-eh-tw7100'),'de','verdict','"no"','draft');
insert into public.feeds (name,network) values ('awin-test','awin');
insert into public.glossary values ('brightness','de','Helligkeit');

do $$ declare v_n int; begin
  -- плохие данные отклоняются
  begin insert into public.category_i18n values (1,'DE','x','x',null,null); raise exception 'lang check missing'; exception when check_violation then null; end;
  begin insert into public.comparisons (product_a,product_b,category_id) values (2,1,1); raise exception 'a<b check missing'; exception when check_violation then null; end;
  begin insert into public.product_images (product_id,url,source) values (1,'https://x/y.jpg','scraped'); raise exception 'image source check missing'; exception when check_violation then null; end;
  begin insert into public.product_specs (product_id,spec_id,value_num,value_text) values (1,1,1,'a'); raise exception 'spec one-value check missing'; exception when others then null; end;
  -- updated_at триггер
  update public.products set name = name where slug='epson-eh-tw7100';
end $$;

set local role anon;
do $$ declare v_n int; begin
  select count(*) into v_n from public.categories;           assert v_n = 1, 'anon sees inactive categories';
  select count(*) into v_n from public.category_i18n;        assert v_n = 1, 'anon sees inactive category_i18n';
  select count(*) into v_n from public.products;             assert v_n = 1, 'anon sees draft products';
  select count(*) into v_n from public.texts;                assert v_n = 1, 'anon sees unpublished texts';
  begin perform 1 from public.feeds;    raise exception 'anon can read feeds';    exception when insufficient_privilege then null; end;
  begin perform 1 from public.glossary; raise exception 'anon can read glossary'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.gen_usage; raise exception 'anon can read gen_usage'; exception when insufficient_privilege then null; end;
  begin insert into public.brands (slug,name) values ('x','x'); raise exception 'anon can insert'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role service_role;
do $$ declare v_n int; begin
  select count(*) into v_n from public.feeds; assert v_n = 1, 'service_role cannot read feeds';
end $$;
reset role;
select 'ALL TESTS PASSED' as result;
rollback;
