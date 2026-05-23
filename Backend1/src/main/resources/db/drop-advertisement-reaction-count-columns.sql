-- Removes legacy Hibernate columns only (your real data stays in like / dislike / love).
ALTER TABLE advertisements DROP COLUMN IF EXISTS like_count;
ALTER TABLE advertisements DROP COLUMN IF EXISTS dislike_count;
ALTER TABLE advertisements DROP COLUMN IF EXISTS love_count;
