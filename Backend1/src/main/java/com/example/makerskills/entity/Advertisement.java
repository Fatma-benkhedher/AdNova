package com.example.makerskills.entity;

import jakarta.persistence.*;

import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "advertisements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Advertisement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "videoUrl") // <-- new field
    private String videoUrl;

    private String status;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** Existing DB columns int8 {@code like} / {@code dislike} / {@code love}; {@code like} is quoted as a reserved keyword. */
    @JdbcTypeCode(SqlTypes.BIGINT)
    @Column(name = "\"like\"")
    private Long likeCount;

    @JdbcTypeCode(SqlTypes.BIGINT)
    @Column(name = "dislike")
    private Long dislikeCount;

    @JdbcTypeCode(SqlTypes.BIGINT)
    @Column(name = "love")
    private Long loveCount;
}