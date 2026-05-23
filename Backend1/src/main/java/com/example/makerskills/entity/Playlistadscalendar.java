package com.example.makerskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;

@Entity
@Table(name = "playlist_ads_calendar", uniqueConstraints = @UniqueConstraint(columnNames = {"playlist_id", "calendar_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Playlistadscalendar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlistad playlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    private CalendarEntry calendar;

    // Nullable to avoid startup failure on existing rows during ddl-auto update.
    // Service/UI will treat null as "run".
    @Column(name = "action_type", nullable = true, length = 10)
    private String actionType;

    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (actionType == null || actionType.isBlank()) {
            actionType = "run";
        }
        createdAt = ZonedDateTime.now();
    }
}
