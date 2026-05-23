-- Screen creator / owner (optional for legacy rows)
ALTER TABLE screens ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users (id);
