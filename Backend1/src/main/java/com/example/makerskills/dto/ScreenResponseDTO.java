package com.example.makerskills.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreenResponseDTO {
    private UUID id;
    private String name;
    private String robot;
    private String address;
    private Double latitude;
    private Double longitude;
    private Long userId;
    private String userDisplayName;
}
