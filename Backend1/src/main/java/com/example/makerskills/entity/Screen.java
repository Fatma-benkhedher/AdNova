package com.example.makerskills.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Maps to {@code screens}. Some schemas store both {@code robot_id} (FK) and a NOT NULL text column {@code robot}.
 */
@Entity
@Table(name = "screens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "nom", nullable = false, unique = true)
    private String nom;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "robot_id", nullable = false)
    private Robot robot;

    /**
     * Text column {@code robot} (e.g. same value as {@link Robot#getNom()}). Kept in sync in {@link #syncRobotTextColumn}.
     */
    @Column(name = "robot", nullable = false, columnDefinition = "text")
    private String robotNom;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "address", nullable = false, columnDefinition = "text")
    private String address;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User createdBy;

    @PrePersist
    @PreUpdate
    private void syncRobotTextColumn() {
        if (robot != null) {
            this.robotNom = robot.getNom();
        }
    }
}
