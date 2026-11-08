-- 0003_import_icecat.sql — импорт из Open Icecat (этап 1, шаг 4).
-- Что: источник данных у товара (важно: данные Icecat нельзя отдавать генеративному ИИ — лицензия OCL §10),
--      варианты модели (память/цвет/артикулы), журнал внешних позиций для инкрементального импорта,
--      фото и идентификаторы из Icecat. Идемпотентно.

alter table public.products add column if not exists data_source text not null default 'manual'
  check (data_source in ('manual','icecat','official','feed'));
alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;

-- фото из Icecat
alter table public.product_images drop constraint if exists product_images_source_check;
alter table public.product_images add constraint product_images_source_check
  check (source in ('feed','amazon_api','press_kit','icecat'));

-- идентификатор Icecat
alter table public.product_identifiers drop constraint if exists product_identifiers_kind_check;
alter table public.product_identifiers add constraint product_identifiers_kind_check
  check (kind in ('gtin','asin','mpn','sku','icecat'));

-- внешние позиции (SKU источника) → наша модель; по updated понимаем, что перекачивать
create table if not exists public.source_items (
  source       text not null check (source in ('icecat')),
  external_id  text not null,
  product_id   bigint references public.products(id) on delete set null,
  category_key text not null,
  updated      text,                 -- метка обновления у источника (YYYYMMDDHHMMSS)
  status       text not null default 'new' check (status in ('new','imported','skipped','error')),
  note         text,
  fetched_at   timestamptz,
  primary key (source, external_id)
);
create index if not exists source_items_todo_idx on public.source_items (source, status, updated desc);
alter table public.source_items enable row level security;
revoke all on public.source_items from anon, authenticated;
grant all on public.source_items to service_role;

insert into public.feeds (name, network, format, url_env, license_note, is_active)
values ('icecat-open', 'open_data', 'api', 'ICECAT_API_TOKEN',
        'Open Icecat Open Content License v1.4: показывать с пометкой «Database Right data-sheet <год> Icecat»; не использовать для генеративного ИИ', true)
on conflict (name) do nothing;
