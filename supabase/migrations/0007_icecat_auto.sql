-- 0007: автоматические категории из Open Icecat (волна 3+).
-- icecat_categories — справочник категорий Icecat с числом позиций (заполняет scripts/icecat/discover.mjs).
-- selected = true → auto-setup.mjs создаёт категорию сайта, характеристики (ключ f<ID признака Icecat>) и подписи на 10 языках.

create table if not exists public.icecat_categories (
  catid        text primary key,
  name_en      text,
  sku_count    int not null default 0,
  sample_ids   text[] not null default '{}',
  open_share   numeric,              -- доля открытых карточек в пробе (0..1)
  selected     boolean not null default false,
  category_key text,                 -- ключ категории сайта после настройки
  checked_at   timestamptz,
  updated_at   timestamptz not null default now()
);
alter table public.icecat_categories enable row level security;
revoke all on public.icecat_categories from anon, authenticated;
grant all on public.icecat_categories to service_role;

alter table public.categories add column if not exists icecat_catid text;
alter table public.categories add column if not exists auto boolean not null default false;

-- очередь импорта растёт до миллионов строк: индекс под выборку «новые позиции категории»
create index if not exists source_items_cat_todo_idx on public.source_items (source, category_key, status, updated desc);
