package com.example.makerskills.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdvertisementRequestDTO {

    private String name;
    private String thumbnailUrl;
    private String videoUrl;
    private String status;
}