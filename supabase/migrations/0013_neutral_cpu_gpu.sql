-- 0013: процессоры и видеокарты — только факты производителя, без оценок «лучше/хуже» (решение Максима 26.11.2026).
-- higher_is_better = null убирает для этих категорий: «Лучше, чем у N% моделей», «Лучшие в 2026» (общая оценка),
-- «Топ по …», «Похожие, но лучше», дуэль/радар в сравнениях, зелёную/красную подсветку и «+N%» в таблицах сравнения.
-- Цифры (ядра, частоты, кеш, TDP) показываются как есть. Прежние значения сохранены в spec_hib_backup (чтобы вернуть).
create table if not exists public.spec_hib_backup as
select d.id as spec_id, d.higher_is_better, now() as saved_at
  from public.spec_definitions d join public.categories c on c.id = d.category_id
 where c.key in ('processors', 'graphics-cards') and d.higher_is_better is not null;
alter table public.spec_hib_backup enable row level security;
revoke all on public.spec_hib_backup from anon, authenticated;
update public.spec_definitions d
   set higher_is_better = null
  from public.categories c
 where c.id = d.category_id
   and c.key in ('processors', 'graphics-cards')
   and d.higher_is_better is not null;
