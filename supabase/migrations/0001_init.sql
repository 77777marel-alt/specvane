-- 0001_init.sql — Specvane: базовая схема каталога техники.
-- Что: категории (дерево) + схема характеристик, бренды, товары, характеристики,
--      магазины, предложения и история цен, тексты (Gemini), сравнения, подборки,
--      фиды и журнал импорта, очередь генерации и суточный учёт расходов.
-- Права: RLS включён везде. Сайт читает анонимным ключом только опубликованное.
--        Запись — только service_role (ночной импорт, очередь текстов).
-- Миграция идемпотентная (if not exists / create or replace).

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------- общие функции ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Язык сайта: en, de, fr, it, es, nl, pl, sv, pt-br, ja (+ будущие)
create or replace function public.is_lang(v text)
returns boolean language sql immutable set search_path = '' as $$
  select v ~ '^[a-z]{2}(-[a-z]{2})?$'
$$;

-- ---------- категории ----------
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  parent_id   bigint references public.categories(id) on delete restrict,
  key         text not null unique check (key ~ '^[a-z0-9-]+$'),   -- внутренний ключ (en)
  sort        int not null default 0,
  is_active   boolean not null default false,
  min_specs_to_publish int not null default 8,                    -- порог для индексации товара
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.category_i18n (
  category_id bigint not null references public.categories(id) on delete cascade,
  lang        text not null check (public.is_lang(lang)),
  slug        text not null check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  name_plural text,
  intro       text,
  primary key (category_id, lang),
  unique (lang, slug)
);

-- схема характеристик категории
create table if not exists public.spec_definitions (
  id           bigint generated always as identity primary key,
  category_id  bigint not null references public.categories(id) on delete cascade,
  key          text not null check (key ~ '^[a-z0-9_]+$'),   -- brightness_lm, battery_mah
  group_key    text not null default 'general',             -- display, audio, battery…
  data_type    text not null check (data_type in ('number','bool','text','enum')),
  unit         text,                                        -- единая единица: in, mAh, lm, W, g, Hz
  enum_values  text[],
  higher_is_better boolean,                                 -- для подсветки в сравнении
  is_key_spec  boolean not null default false,              -- 3–5 главных наверху страницы
  is_filter    boolean not null default false,
  sort         int not null default 0,
  unique (category_id, key)
);

create table if not exists public.spec_definition_i18n (
  spec_id  bigint not null references public.spec_definitions(id) on delete cascade,
  lang     text not null check (public.is_lang(lang)),
  label    text not null,
  help     text,
  primary key (spec_id, lang)
);

-- ---------- бренды ----------
create table if not exists public.brands (
  id          bigint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  website     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- товары ----------
create table if not exists public.products (
  id            bigint generated always as identity primary key,
  category_id   bigint not null references public.categories(id) on delete restrict,
  brand_id      bigint not null references public.brands(id) on delete restrict,
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),  -- samsung-galaxy-s26 (не переводится)
  name          text not null,                 -- «Galaxy S26»
  model_number  text,                          -- SM-S941B
  series        text,
  release_date  date,
  status        text not null default 'draft' check (status in ('draft','active','archived')),
  spec_count    int not null default 0,        -- заполненных характеристик (считает импорт)
  is_indexable  boolean not null default false,-- в sitemap/IndexNow только при true
  specs_hash    text,                          -- хеш характеристик: менялись → перегенерировать тексты
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id, status);
create index if not exists products_brand_idx    on public.products (brand_id);
create index if not exists products_name_trgm    on public.products using gin (name extensions.gin_trgm_ops);

-- идентификаторы для склейки: EAN/GTIN, ASIN, MPN
create table if not exists public.product_identifiers (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  kind        text not null check (kind in ('gtin','asin','mpn','sku')),
  value       text not null,
  country     text not null default '' check (country = '' or country ~ '^[A-Z]{2}$'), -- ASIN зависит от страны
  unique (kind, value, country)
);
create index if not exists product_identifiers_product_idx on public.product_identifiers (product_id);

-- преемник / вариант / альтернатива
create table if not exists public.product_relations (
  product_id  bigint not null references public.products(id) on delete cascade,
  related_id  bigint not null references public.products(id) on delete cascade,
  kind        text not null check (kind in ('successor','variant','alternative')),
  primary key (product_id, related_id, kind),
  check (product_id <> related_id)
);

create table if not exists public.product_specs (
  product_id  bigint not null references public.products(id) on delete cascade,
  spec_id     bigint not null references public.spec_definitions(id) on delete cascade,
  value_num   numeric,
  value_bool  boolean,
  value_text  text,
  source      text not null default 'unknown',   -- feed:<id>, official:<brand>, amazon
  updated_at  timestamptz not null default now(),
  primary key (product_id, spec_id),
  check (num_nonnulls(value_num, value_bool, value_text) = 1)
);
create index if not exists product_specs_spec_num_idx on public.product_specs (spec_id, value_num);

create table if not exists public.product_images (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  url         text not null check (url ~ '^https://'),
  source      text not null check (source in ('feed','amazon_api','press_kit')), -- только разрешённые
  source_ref  text,
  width       int,
  height      int,
  sort        int not null default 0,
  unique (product_id, url)
);

-- ---------- магазины, предложения, цены ----------
create table if not exists public.merchants (
  id          bigint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  network     text not null check (network in ('amazon','awin','impact','webgains','cj','direct')),
  country     text not null check (country ~ '^[A-Z]{2}$'),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.offers (
  id            bigint generated always as identity primary key,
  product_id    bigint not null references public.products(id) on delete cascade,
  merchant_id   bigint not null references public.merchants(id) on delete cascade,
  country       text not null check (country ~ '^[A-Z]{2}$'),
  price         numeric(12,2) check (price is null or price > 0),  -- null: Amazon без PA-API
  currency      char(3) not null check (currency ~ '^[A-Z]{3}$'),
  url           text not null check (url ~ '^https://'),           -- партнёрская ссылка
  in_stock      boolean not null default true,
  last_seen_at  timestamptz not null default now(),
  price_updated_at timestamptz,
  feed_id       bigint,
  unique (product_id, merchant_id, country)
);
create index if not exists offers_product_country_idx on public.offers (product_id, country, in_stock, price);

-- один снимок в день на предложение (для «было/стало» только по реальной истории — Omnibus)
create table if not exists public.price_history (
  offer_id  bigint not null references public.offers(id) on delete cascade,
  day       date not null,
  price     numeric(12,2) not null check (price > 0),
  currency  char(3) not null,
  primary key (offer_id, day)
);

-- ---------- сравнения и подборки ----------
create table if not exists public.comparisons (
  id           bigint generated always as identity primary key,
  product_a    bigint not null references public.products(id) on delete cascade,
  product_b    bigint not null references public.products(id) on delete cascade,
  category_id  bigint not null references public.categories(id) on delete cascade,
  relevance    numeric not null default 0,      -- близость цены/года/категории
  is_indexable boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (product_a < product_b),                -- пара хранится один раз
  unique (product_a, product_b)
);

create table if not exists public.collections (
  id           bigint generated always as identity primary key,
  category_id  bigint not null references public.categories(id) on delete cascade,
  key          text not null check (key ~ '^[a-z0-9-]+$'),   -- under-500, gaming, home-cinema
  rules        jsonb not null default '{}'::jsonb,           -- фильтры: цена, характеристики
  is_active    boolean not null default false,
  updated_at   timestamptz not null default now(),
  unique (category_id, key)
);

-- подборка адаптируется под страну: своя цена-порог, своя валюта, свой slug
create table if not exists public.collection_i18n (
  collection_id bigint not null references public.collections(id) on delete cascade,
  lang          text not null check (public.is_lang(lang)),
  country       text not null check (country ~ '^[A-Z]{2}$'),
  slug          text not null check (slug ~ '^[a-z0-9-]+$'),
  title         text not null,
  price_max     numeric(12,2),
  currency      char(3),
  primary key (collection_id, lang),
  unique (lang, slug)
);

-- ---------- тексты (Gemini) ----------
create table if not exists public.texts (
  id           bigint generated always as identity primary key,
  entity_type  text not null check (entity_type in ('product','comparison','collection','category','brand')),
  entity_id    bigint not null,
  lang         text not null check (public.is_lang(lang)),
  kind         text not null check (kind in ('summary','verdict','pros','cons','who_for','faq','body')),
  content      jsonb not null,
  version      int not null default 1,
  specs_hash   text,                    -- по каким данным написано
  model        text,                    -- gemini-…-flash-lite
  status       text not null default 'draft' check (status in ('draft','qa_failed','published')),
  qa_errors    text[],
  generated_at timestamptz not null default now(),
  unique (entity_type, entity_id, lang, kind)
);
create index if not exists texts_lookup_idx on public.texts (entity_type, entity_id, lang) where status = 'published';

create table if not exists public.glossary (
  term_key  text not null check (term_key ~ '^[a-z0-9_]+$'),
  lang      text not null check (public.is_lang(lang)),
  text      text not null,
  primary key (term_key, lang)
);

-- ---------- служебное: фиды, импорт, очередь, расходы ----------
create table if not exists public.feeds (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  network      text not null check (network in ('amazon','awin','impact','webgains','cj','direct','official','open_data')),
  merchant_id  bigint references public.merchants(id) on delete set null,
  country      text check (country ~ '^[A-Z]{2}$'),
  format       text not null default 'csv' check (format in ('csv','xml','json','rss','api')),
  url_env      text,          -- имя переменной окружения с адресом/ключом (секрет в БД не храним)
  license_note text,          -- на каком основании используем данные
  is_active    boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.feed_runs (
  id           bigint generated always as identity primary key,
  feed_id      bigint not null references public.feeds(id) on delete cascade,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running','ok','error')),
  items_seen   int not null default 0,
  items_new    int not null default 0,
  items_updated int not null default 0,
  error        text
);
create index if not exists feed_runs_feed_idx on public.feed_runs (feed_id, started_at desc);

create table if not exists public.gen_jobs (
  id           bigint generated always as identity primary key,
  entity_type  text not null,
  entity_id    bigint not null,
  lang         text not null check (public.is_lang(lang)),
  kind         text not null,
  status       text not null default 'queued' check (status in ('queued','running','done','error')),
  attempts     int not null default 0,
  run_after    timestamptz not null default now(),
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists gen_jobs_queue_idx on public.gen_jobs (status, run_after) where status = 'queued';
-- одна активная задача на текст (готовые и ошибочные копятся как журнал)
create unique index if not exists gen_jobs_active_uniq on public.gen_jobs (entity_type, entity_id, lang, kind)
  where status in ('queued','running');

-- суточный учёт расходов Gemini — код останавливает очередь при превышении лимита
create table if not exists public.gen_usage (
  day          date primary key,
  requests     int not null default 0,
  tokens_in    bigint not null default 0,
  tokens_out   bigint not null default 0,
  cost_eur     numeric(10,4) not null default 0
);

-- ---------- триггеры updated_at ----------
do $$
declare v_t text;
begin
  foreach v_t in array array['categories','brands','products','comparisons','collections'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', v_t, v_t);
    execute format('create trigger %I_set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', v_t, v_t);
  end loop;
end $$;

-- ---------- права и RLS ----------
do $$
declare v_t text;
begin
  foreach v_t in array array[
    'categories','category_i18n','spec_definitions','spec_definition_i18n','brands',
    'products','product_identifiers','product_relations','product_specs','product_images',
    'merchants','offers','price_history','comparisons','collections','collection_i18n',
    'texts','glossary','feeds','feed_runs','gen_jobs','gen_usage'] loop
    execute format('alter table public.%I enable row level security', v_t);
    execute format('revoke all on public.%I from anon, authenticated', v_t);
  end loop;
end $$;

-- публичное чтение (только витрина)
grant select on public.categories, public.category_i18n, public.spec_definitions,
  public.spec_definition_i18n, public.brands, public.products, public.product_relations,
  public.product_specs, public.product_images, public.merchants, public.offers,
  public.price_history, public.comparisons, public.collections, public.collection_i18n,
  public.texts
  to anon, authenticated;

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select to anon, authenticated using (is_active);

drop policy if exists category_i18n_read on public.category_i18n;
create policy category_i18n_read on public.category_i18n for select to anon, authenticated
  using (exists (select 1 from public.categories c where c.id = category_id and c.is_active));

drop policy if exists spec_definitions_read on public.spec_definitions;
create policy spec_definitions_read on public.spec_definitions for select to anon, authenticated using (true);

drop policy if exists spec_definition_i18n_read on public.spec_definition_i18n;
create policy spec_definition_i18n_read on public.spec_definition_i18n for select to anon, authenticated using (true);

drop policy if exists brands_read on public.brands;
create policy brands_read on public.brands for select to anon, authenticated using (is_active);

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated using (status <> 'draft');

drop policy if exists product_relations_read on public.product_relations;
create policy product_relations_read on public.product_relations for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status <> 'draft'));

drop policy if exists product_specs_read on public.product_specs;
create policy product_specs_read on public.product_specs for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status <> 'draft'));

drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status <> 'draft'));

drop policy if exists merchants_read on public.merchants;
create policy merchants_read on public.merchants for select to anon, authenticated using (is_active);

drop policy if exists offers_read on public.offers;
create policy offers_read on public.offers for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status <> 'draft'));

drop policy if exists price_history_read on public.price_history;
create policy price_history_read on public.price_history for select to anon, authenticated using (true);

drop policy if exists comparisons_read on public.comparisons;
create policy comparisons_read on public.comparisons for select to anon, authenticated using (true);

drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections for select to anon, authenticated using (is_active);

drop policy if exists collection_i18n_read on public.collection_i18n;
create policy collection_i18n_read on public.collection_i18n for select to anon, authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.is_active));

drop policy if exists texts_read on public.texts;
create policy texts_read on public.texts for select to anon, authenticated using (status = 'published');

-- glossary, feeds, feed_runs, gen_jobs, gen_usage, product_identifiers: только service_role.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
