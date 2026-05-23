package com.example.makerskills.controller;

import com.example.makerskills.Service.PlaylistFinaleService;
import com.example.makerskills.Service.Playlistadservice;
import com.example.makerskills.dto.Playlistadresponsedto;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/playlist-finale")
@RequiredArgsConstructor
public class PlaylistFinaleController {

    private final PlaylistFinaleService playlistFinaleService;
    private final Playlistadservice playlistadservice;

    @GetMapping("/day")
    public ResponseEntity<List<Playlistadresponsedto>> getByDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
            @RequestParam(required = false) UUID screenId) {
        return ResponseEntity.ok(playlistFinaleService.getByDay(day, screenId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<Playlistadresponsedto>> getToday(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
            @RequestParam(required = false) UUID screenId) {
        LocalDate d = day == null ? LocalDate.now() : day;
        return ResponseEntity.ok(playlistFinaleService.getByDay(d, screenId));
    }

    /**
     * Run/stop a scheduled spot. Delegates to the legacy playlist junction updater (also syncs playlist_finale_item).
     */
    @PatchMapping("/{playlistId}/calendar/{calendarId}/action")
    public ResponseEntity<Void> setAction(
            @PathVariable Long playlistId,
            @PathVariable Long calendarId,
            @RequestParam String actionType) {
        playlistadservice.setActionType(playlistId, calendarId, actionType);
        return ResponseEntity.ok().build();
    }
}
