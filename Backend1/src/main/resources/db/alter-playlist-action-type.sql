-- Ensure action type exists for run/stop control in playlist rows.
ALTER TABLE playlist_ads_calendar
    ADD COLUMN IF NOT EXISTS action_type VARCHAR(10);

UPDATE playlist_ads_calendar
SET action_type = 'run'
WHERE action_type IS NULL OR action_type = '';

ALTER TABLE playlist_ads_calendar
    ALTER COLUMN action_type SET DEFAULT 'run';

ALTER TABLE playlist_ads_calendar
    ALTER COLUMN action_type SET NOT NULL;

-- Helpful indexes for daily playlist queries.
CREATE INDEX IF NOT EXISTS idx_playlist_ads_start_date ON playlist_ads (start_date);
CREATE INDEX IF NOT EXISTS idx_playlist_ads_calendar_calendar_id ON playlist_ads_calendar (calendar_id);
