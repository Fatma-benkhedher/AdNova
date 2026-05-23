-- Pack cover image (public URL after upload to Supabase Storage)
alter table public.packs add column if not exists image_url text;
