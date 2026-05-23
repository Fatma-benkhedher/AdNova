package com.example.makerskills.controller;

import com.example.makerskills.Service.Playlistadservice;
import com.example.makerskills.dto.Playlistadrequestdto;
import com.example.makerskills.dto.Playlistadresponsedto;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class Playlistadcontroller {
    private final Playlistadservice service;

    @PostMapping
    public ResponseEntity<Playlistadresponsedto> create(@RequestBody Playlistadrequestdto req, @RequestParam Long userId) {
        return ResponseEntity.ok(service.create(req, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Playlistadresponsedto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/screen/{screenId}")
    public ResponseEntity<List<Playlistadresponsedto>> getByScreen(@PathVariable String screenId) {
        return ResponseEntity.ok(service.getByScreen(screenId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Playlistadresponsedto>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getByUser(userId));
    }

    @GetMapping("/day")
    public ResponseEntity<List<Playlistadresponsedto>> getByDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        return ResponseEntity.ok(service.getByDay(day));
    }

    @GetMapping("/today")
    public ResponseEntity<List<Playlistadresponsedto>> getToday(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        return ResponseEntity.ok(service.getToday(day));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Playlistadresponsedto> update(@PathVariable Long id, @RequestBody Playlistadrequestdto req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{playlistId}/calendar/{calendarId}")
    public ResponseEntity<Void> addCalendar(@PathVariable Long playlistId, @PathVariable Long calendarId) {
        service.addCalendarEntry(playlistId, calendarId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{playlistId}/calendar/{calendarId}")
    public ResponseEntity<Void> removeCalendar(@PathVariable Long playlistId, @PathVariable Long calendarId) {
        service.removeCalendarEntry(playlistId, calendarId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{playlistId}/calendar/{calendarId}/action")
    public ResponseEntity<Void> setAction(
            @PathVariable Long playlistId,
            @PathVariable Long calendarId,
            @RequestParam String actionType) {
        service.setActionType(playlistId, calendarId, actionType);
        return ResponseEntity.ok().build();
    }
}
