-- -----------------------------------------------------------------------------
-- Fix: ERROR duplicate key value violates unique constraint "playlist_ads_pkey"
--      or "playlist_ads_calendar_pkey" — Key (id)=(1) already exists.
--
-- Cause: PostgreSQL sequence for id is not aligned with MAX(id).
--
-- Backend1 also runs an automatic alignment on startup (PostgresSequenceAlignment).
-- Use this script only if you prefer a manual fix in Supabase SQL Editor.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  seq_name text;
BEGIN
  seq_name := pg_get_serial_sequence('playlist_ads', 'id');
  IF seq_name IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L::regclass, (SELECT COALESCE(MAX(id), 0) FROM playlist_ads), true)',
      seq_name
    );
  END IF;
END $$;

DO $$
DECLARE
  seq_name text;
BEGIN
  seq_name := pg_get_serial_sequence('playlist_ads_calendar', 'id');
  IF seq_name IS NOT NULL THEN
    EXECUTE format(
      'SELECT setval(%L::regclass, (SELECT COALESCE(MAX(id), 0) FROM playlist_ads_calendar), true)',
      seq_name
    );
  END IF;
END $$;

DO $$
DECLARE
  seq_name text;
BEGIN
  IF to_regclass('public.playlist_finale') IS NOT NULL THEN
    seq_name := pg_get_serial_sequence('playlist_finale', 'id');
    IF seq_name IS NOT NULL THEN
      EXECUTE format(
        'SELECT setval(%L::regclass, (SELECT COALESCE(MAX(id), 0) FROM playlist_finale), true)',
        seq_name
      );
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  seq_name text;
BEGIN
  IF to_regclass('public.playlist_finale_item') IS NOT NULL THEN
    seq_name := pg_get_serial_sequence('playlist_finale_item', 'id');
    IF seq_name IS NOT NULL THEN
      EXECUTE format(
        'SELECT setval(%L::regclass, (SELECT COALESCE(MAX(id), 0) FROM playlist_finale_item), true)',
        seq_name
      );
    END IF;
  END IF;
END $$;
