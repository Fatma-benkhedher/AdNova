package com.example.makerskills.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSummaryDTO {
    private long totalViews;
    private long totalImpressions;
    private long totalReach;
    private long dwellSecondsTotal;
    private long dwellSamples;
}
