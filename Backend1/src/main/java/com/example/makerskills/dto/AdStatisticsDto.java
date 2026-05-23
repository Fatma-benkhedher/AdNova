package com.example.makerskills.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AdStatisticsDto {

    // ─── Request (used for create and increment) ──────────────────────────────
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {
        private Long      adId;
        private LocalDate date;

        @Builder.Default private int  views          = 0;
        @Builder.Default private int  impressions    = 0;
        @Builder.Default private int  reach          = 0;
        @Builder.Default private int  airedCount     = 0;
        @Builder.Default private int  skippedCount   = 0;
        @Builder.Default private int  femaleViews    = 0;
        @Builder.Default private int  maleViews      = 0;
        @Builder.Default private int  otherViews     = 0;
        @Builder.Default private int  ageBand0       = 0;
        @Builder.Default private int  ageBand1       = 0;
        @Builder.Default private int  ageBand2       = 0;
        @Builder.Default private int  ageBand3       = 0;
        @Builder.Default private int  ageBand4       = 0;
        @Builder.Default private long dwellTimeTotal = 0L;
        @Builder.Default private int  dwellTimeCount = 0;
        @Builder.Default private int  interactions   = 0;
    }

    // ─── Response ─────────────────────────────────────────────────────────────
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long          id;
        private Long          adId;
        private LocalDate     date;
        private int           views;
        private int           impressions;
        private int           reach;
        private int           airedCount;
        private int           skippedCount;
        private int           femaleViews;
        private int           maleViews;
        private int           otherViews;
        private int           ageBand0;
        private int           ageBand1;
        private int           ageBand2;
        private int           ageBand3;
        private int           ageBand4;
        private long          dwellTimeTotal;
        private int           dwellTimeCount;
        private double        avgDwellTimeSeconds;  // computed: total / count
        private int           interactions;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ─── Summary (for range queries) ─────────────────────────────────────────
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RangeSummary {
        private Long      adId;
        private LocalDate from;
        private LocalDate to;
        private long      totalViews;
        private long      totalInteractions;
    }

    /** Dashboard totals across all ads (date range). Field names match the React StatsSummary type. */
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class GlobalDashboardSummary {
        private LocalDate from;
        private LocalDate to;
        private long totalViews;
        private long totalImpressions;
        private long totalReach;
        private long totalAired;
        private long totalSkipped;
        private long totalInteractions;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DemographicsResponse {
        private List<DemoBucket> ageGroups;
        private List<DemoBucket> genderSplit;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DemoBucket {
        private String label;
        private long count;
    }
}