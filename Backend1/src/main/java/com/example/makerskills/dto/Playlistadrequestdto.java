package com.example.makerskills.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Playlistadrequestdto {
    private String name;

    /** UUID of the screen this playlist belongs to */
    private String screenId;

    private LocalDate startDate;
    private LocalDate endDate;

    /** Optional: pre-link calendar entry IDs on creation */
    private List<Long> calendarIds;
}
