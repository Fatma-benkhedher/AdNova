-- Add approved flag safely for existing databases.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS approved BOOLEAN;

UPDATE users
SET approved = false
WHERE approved IS NULL;

ALTER TABLE users
    ALTER COLUMN approved SET DEFAULT false;

ALTER TABLE users
    ALTER COLUMN approved SET NOT NULL;

