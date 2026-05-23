package com.example.makerskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ad_defaults")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdDefault {

    /**
     * Legacy NOT NULL columns on older DBs. Not used by the UI (global default).
     * Kept so INSERT satisfies PostgreSQL constraints until you run a migration to drop them.
     */
    public static final LocalDate GLOBAL_PLACEHOLDER_DAY = LocalDate.of(2000, 1, 1);
    public static final LocalTime GLOBAL_PLACEHOLDER_TIME = LocalTime.MIDNIGHT;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate day;

    @Column(name = "slot_time", nullable = false)
    private LocalTime slotTime;

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @Column(name = "video_url", columnDefinition = "text")
    private String videoUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (day == null) {
            day = GLOBAL_PLACEHOLDER_DAY;
        }
        if (slotTime == null) {
            slotTime = GLOBAL_PLACEHOLDER_TIME;
        }
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        if (day == null) {
            day = GLOBAL_PLACEHOLDER_DAY;
        }
        if (slotTime == null) {
            slotTime = GLOBAL_PLACEHOLDER_TIME;
        }
        updatedAt = OffsetDateTime.now();
    }
}
