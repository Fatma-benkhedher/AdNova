package com.example.makerskills.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Calendarsummarydto {
    private Long calendarId;
    private LocalDate day;
    private LocalTime time;
    private String calendarStatus;
    private String actionType; // run | stop
    private boolean defaultInserted;

    private Long adId;
    private String adName;
    private String adVideoUrl;
    private String adThumbnailUrl;
}
