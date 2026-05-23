package com.example.makerskills.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
@Data
@Builder
@NoArgsConstructor      // allows new AdvertisementResponseDTO()
@AllArgsConstructor     // allows creating with all args
public class AdvertisementResponseDTO {
    private Long id;
    private String name;
    private String thumbnailUrl;
    private String videoUrl;
    private String status;
    private OffsetDateTime submittedAt;
    private OffsetDateTime updatedAt;

    /** Matches DB int8 columns {@code like}, {@code dislike}, {@code love}. */
    private Long likeCount;
    private Long dislikeCount;
    private Long loveCount;
}