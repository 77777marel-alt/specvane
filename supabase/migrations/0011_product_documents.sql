-- Документы модели из Open Icecat: инструкция, брошюра, энергетическая этикетка ЕС, информационный лист ЕС (EPREL fiche).
-- Храним только ссылки на официальные PDF/PNG (на серверах Icecat/производителя), сами файлы не копируем.
create table if not exists public.product_documents (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('manual', 'brochure', 'energy_label', 'product_fiche')),
  url text not null check (url ~ '^https://'),
  lang text,
  title text,
  unique (product_id, url)
);
create index if not exists product_documents_product_idx on public.product_documents (product_id);
alter table public.products add column if not exists docs_checked_at timestamptz;

alter table public.product_documents enable row level security;
drop policy if exists product_documents_read on public.product_documents;
create policy product_documents_read on public.product_documents for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status <> 'draft'));
grant select on public.product_documents to anon, authenticated;
grant all on public.product_documents to service_role;
grant usage, select on sequence public.product_documents_id_seq to service_role;
create index if not exists products_docs_todo_idx on public.products (id) where docs_checked_at is null;
