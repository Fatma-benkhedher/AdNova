package com.example.makerskills.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdDefaultDTO {
    private Long id;
    private String imageUrl;
    private String videoUrl;
    /** User who last set this default */
    private Long userId;
    private String userDisplayName;
}
