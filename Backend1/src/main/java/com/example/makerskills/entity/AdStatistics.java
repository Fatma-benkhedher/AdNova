package com.example.makerskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "ad_statistics",
        uniqueConstraints = @UniqueConstraint(columnNames = {"ad_id", "date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ad_id", nullable = false)
    private Advertisement advertisement;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    @Builder.Default
    private int views = 0;

    @Column(nullable = false)
    @Builder.Default
    private int impressions = 0;

    @Column(nullable = false)
    @Builder.Default
    private int reach = 0;

    @Column(name = "aired_count", nullable = false)
    @Builder.Default
    private int airedCount = 0;

    @Column(name = "skipped_count", nullable = false)
    @Builder.Default
    private int skippedCount = 0;

    @Column(name = "female_views", nullable = false)
    @Builder.Default
    private int femaleViews = 0;

    @Column(name = "male_views", nullable = false)
    @Builder.Default
    private int maleViews = 0;

    @Column(name = "other_views", nullable = false)
    @Builder.Default
    private int otherViews = 0;

    /** Face detections counted per age band (same order as camera model: 0..4). */
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

    /** Sum of all individual dwell times in seconds */
    @Column(name = "dwell_time_total", nullable = false)
    @Builder.Default
    private long dwellTimeTotal = 0L;

    /** Number of dwell-time samples — used to compute the average */
    @Column(name = "dwell_time_count", nullable = false)
    @Builder.Default
    private int dwellTimeCount = 0;

    /** Taps, QR scans, button clicks, etc. */
    @Column(nullable = false)
    @Builder.Default
    private int interactions = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Transient
    public double getAvgDwellTimeSeconds() {
        return dwellTimeCount == 0 ? 0.0 : (double) dwellTimeTotal / dwellTimeCount;
    }
}