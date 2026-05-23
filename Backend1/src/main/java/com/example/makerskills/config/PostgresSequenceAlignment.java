package com.example.makerskills.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Aligns SERIAL / IDENTITY sequences with MAX(id) so inserts never reuse existing primary keys.
 * Fixes 409 Conflict (duplicate key playlist_ads_pkey, playlist_ads_calendar_pkey, etc.) after
 * manual DB edits, restores, or Hibernate ddl-auto drift on PostgreSQL / Supabase.
 */
@Component
@Order(1)
public class PostgresSequenceAlignment implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PostgresSequenceAlignment.class);

    /** Whitelist only — table names are interpolated into SQL. */
    private static final List<String> TABLES_WITH_LONG_ID = List.of(
            "playlist_ads",
            "playlist_ads_calendar",
            "playlist_finale",
            "playlist_finale_item",
            "calendar"
    );

    private final JdbcTemplate jdbcTemplate;

    public PostgresSequenceAlignment(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String table : TABLES_WITH_LONG_ID) {
            alignTableIdSequence(table);
        }
    }

    private void alignTableIdSequence(String table) {
        try {
            Boolean exists = jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?)",
                    Boolean.class,
                    table);
            if (!Boolean.TRUE.equals(exists)) {
                return;
            }
            String seqName = jdbcTemplate.queryForObject(
                    "SELECT pg_get_serial_sequence(?, 'id')",
                    (rs, rowNum) -> rs.getString(1),
                    table);
            if (seqName == null || seqName.isBlank()) {
                log.debug("No serial sequence for public.{}.id (skipped)", table);
                return;
            }
            Long max = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(MAX(id), 0) FROM " + table,
                    Long.class);
            long safeMax = max != null ? max : 0L;
            Long newVal = jdbcTemplate.queryForObject(
                    "SELECT setval(cast(? AS regclass), ?, true)",
                    Long.class,
                    seqName,
                    safeMax);
            log.info("Aligned sequence for public.{} (max id={}, setval returned {}, sequence={})",
                    table, safeMax, newVal, seqName);
        } catch (Exception e) {
            log.warn("Could not align id sequence for table {}: {}", table, e.getMessage());
        }
    }
}
