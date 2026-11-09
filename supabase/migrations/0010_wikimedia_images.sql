-- Фото с Wikimedia Commons (свободные лицензии) для моделей, которых нет в Open Icecat.
-- source_ref: «Автор · Лицензия · ссылка на страницу файла» — подпись выводится на странице модели.
alter table product_images drop constraint if exists product_images_source_check;
alter table product_images add constraint product_images_source_check check (source = any (array['feed','amazon_api','press_kit','icecat','wikimedia']));
