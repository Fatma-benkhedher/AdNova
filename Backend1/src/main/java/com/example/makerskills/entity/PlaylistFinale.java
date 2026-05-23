package com.example.makerskills.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "playlist_finale", uniqueConstraints = {
        @UniqueConstraint(name = "uk_playlist_finale_day_screen", columnNames = {"day", "screen_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistFinale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "day", nullable = false)
    private LocalDate day;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screen_id")
    private Screen screen;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * Playlist-level action (reserved for future use / device sync). Items have their own action.
     */
    @Column(name = "action", nullable = false, length = 16)
    @Builder.Default
    private String action = "run";

    @Column(name = "created_at")
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @OneToMany(mappedBy = "playlistFinale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PlaylistFinaleItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (action == null || action.isBlank()) {
            action = "run";
        }
        ZonedDateTime now = ZonedDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    public UUID getScreenIdOrNull() {
        return screen == null ? null : screen.getId();
    }
}
