package com.example.makerskills.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreenRequestDTO {
    private String name;
    private String robot;
    private String address;
    private Double latitude;
    private Double longitude;
    /** User (operator) who created or last updated this screen */
    private Long userId;
}
