package com.example.makerskills.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Playlistadresponsedto {
    private Long id;
    private String name;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    // Screen summary
    private String screenId;
    private String screenName;
    private String screenAddress;

    // Linked calendar entries (each carries its own ad info)
    private List<Calendarsummarydto> calendarEntries;
}

