begin;
do $$ declare v_n int; begin
  select count(*) into v_n from public.spec_definitions s join public.categories c on c.id=s.category_id where c.key='smartphones'; assert v_n = 30, 'specs '||v_n;
  select count(*) into v_n from public.spec_definition_i18n i join public.spec_definitions s on s.id=i.spec_id join public.categories c on c.id=s.category_id where c.key='smartphones'; assert v_n = 300, 'labels '||v_n;
  select count(*) into v_n from public.category_i18n i join public.categories c on c.id=i.category_id where c.key='smartphones'; assert v_n = 10, 'cat i18n';
  select count(*) into v_n from public.spec_group_i18n; assert v_n = 70, 'groups '||v_n;
end $$;
set local role anon;
do $$ declare v_n int; begin
  select count(*) into v_n from public.categories where key='smartphones'; assert v_n = 0, 'inactive category visible';
  select count(*) into v_n from public.spec_group_i18n; assert v_n = 70, 'anon cannot read groups';
end $$;
reset role;
select 'ALL 0002 TESTS PASSED';
rollback;
