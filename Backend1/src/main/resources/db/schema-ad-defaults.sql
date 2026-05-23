-- Global default slot media (single row updated over time). Optional image_url / video_url, user who last updated.

CREATE TABLE IF NOT EXISTS ad_defaults (
    id           BIGSERIAL PRIMARY KEY,
    image_url    TEXT,
    video_url    TEXT,
    user_id      BIGINT NULL REFERENCES users (id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration from older schema (day + slot_time): run once if upgrading
-- ALTER TABLE ad_defaults DROP CONSTRAINT IF EXISTS ad_defaults_day_slot_time_unique;
-- ALTER TABLE ad_defaults DROP COLUMN IF EXISTS day;
-- ALTER TABLE ad_defaults DROP COLUMN IF EXISTS slot_time;
-- ALTER TABLE ad_defaults DROP COLUMN IF EXISTS operator_user_id;
-- ALTER TABLE ad_defaults ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users (id);
