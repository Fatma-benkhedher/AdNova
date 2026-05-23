-- Run once on the same PostgreSQL / Supabase DB used by Spring Boot (after screens + robots exist).
-- Adds location + name fields expected by JPA entity com.example.makerskills.entity.Screen

ALTER TABLE screens ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
ALTER TABLE screens ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE screens ADD COLUMN IF NOT EXISTS longitude double precision;

-- Screen title is stored in column "nom" only (no "name" column in DB).

-- After backfilling real addresses, you may drop the default:
-- ALTER TABLE screens ALTER COLUMN address DROP DEFAULT;
