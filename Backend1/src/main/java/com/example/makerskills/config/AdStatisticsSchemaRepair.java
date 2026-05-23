package com.example.makerskills.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures public.ad_statistics has all columns required by camera ingestion.
 * Safe for repeat runs thanks to ADD COLUMN IF NOT EXISTS.
 */
@Component
@Order(2)
public class AdStatisticsSchemaRepair implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdStatisticsSchemaRepair.class);

    private final JdbcTemplate jdbcTemplate;

    public AdStatisticsSchemaRepair(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Boolean exists = jdbcTemplate.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_statistics')",
                    Boolean.class
            );
            if (!Boolean.TRUE.equals(exists)) {
                log.warn("Table public.ad_statistics not found (schema repair skipped).");
                return;
            }

            jdbcTemplate.execute("""
                    ALTER TABLE public.ad_statistics
                    ADD COLUMN IF NOT EXISTS female_views integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS male_views integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS other_views integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS age_band_0 integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS age_band_1 integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS age_band_2 integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS age_band_3 integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS age_band_4 integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS dwell_time_total bigint NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS dwell_time_count integer NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS reach integer NOT NULL DEFAULT 0
                    """);

            log.info("Verified/updated schema for public.ad_statistics (camera fields ready).");
        } catch (Exception e) {
            log.warn("Could not repair public.ad_statistics schema: {}", e.getMessage());
        }
    }
}
