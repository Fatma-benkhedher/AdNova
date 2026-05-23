-- Run once if you already had ad_defaults with day + slot_time + operator_user_id.

ALTER TABLE ad_defaults DROP CONSTRAINT IF EXISTS ad_defaults_day_slot_time_unique;
ALTER TABLE ad_defaults DROP CONSTRAINT IF EXISTS ad_defaults_day_time_unique;

ALTER TABLE ad_defaults ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users (id);

UPDATE ad_defaults SET user_id = operator_user_id WHERE user_id IS NULL AND operator_user_id IS NOT NULL;

ALTER TABLE ad_defaults DROP COLUMN IF EXISTS operator_user_id;
ALTER TABLE ad_defaults DROP COLUMN IF EXISTS day;
ALTER TABLE ad_defaults DROP COLUMN IF EXISTS slot_time;

-- If multiple rows exist, keep one global default, e.g.:
-- DELETE FROM ad_defaults WHERE id > (SELECT MIN(id) FROM ad_defaults);
