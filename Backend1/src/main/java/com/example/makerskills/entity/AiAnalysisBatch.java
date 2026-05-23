package com.example.makerskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analysis_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAnalysisBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ad_id")
    private Long adId;

    @Column(name = "male_count", nullable = false)
    @Builder.Default
    private int maleCount = 0;

    @Column(name = "female_count", nullable = false)
    @Builder.Default
    private int femaleCount = 0;

    @Column(name = "other_gender_count", nullable = false)
    @Builder.Default
    private int otherGenderCount = 0;

    @Column(name = "age_band_0", nullable = false)
    @Builder.Default
    private int ageBand0 = 0;

    @Column(name = "age_band_1", nullable = false)
    @Builder.Default
    private int ageBand1 = 0;

    @Column(name = "age_band_2", nullable = false)
    @Builder.Default
    private int ageBand2 = 0;

    @Column(name = "age_band_3", nullable = false)
    @Builder.Default
    private int ageBand3 = 0;

    @Column(name = "age_band_4", nullable = false)
    @Builder.Default
    private int ageBand4 = 0;

    @Column(name = "dwell_seconds_total", nullable = false)
    @Builder.Default
    private long dwellSecondsTotal = 0L;

    @Column(name = "dwell_samples", nullable = false)
    @Builder.Default
    private int dwellSamples = 0;

    @Column(name = "detection_events", nullable = false)
    @Builder.Default
    private int detectionEvents = 0;

    @Column(name = "concurrent_viewers", nullable = false)
    @Builder.Default
    private int concurrentViewers = 0;

    @Column(name = "captured_at", nullable = false, updatable = false)
    private LocalDateTime capturedAt;

    @PrePersist
    protected void onCreate() {
        this.capturedAt = LocalDateTime.now();
    }
}
