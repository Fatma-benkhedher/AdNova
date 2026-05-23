package com.example.makerskills.controller;

import com.example.makerskills.Service.CalendarService;
import com.example.makerskills.dto.CalendarDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {
    private final CalendarService service;

    @GetMapping
    public ResponseEntity<List<CalendarDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-day")
    public ResponseEntity<List<CalendarDTO>> getByDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day) {
        return ResponseEntity.ok(service.getByDay(day));
    }

    @GetMapping("/by-day-and-screen")
    public ResponseEntity<List<CalendarDTO>> getByDayAndScreen(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate day,
            @RequestParam UUID screenId) {
        return ResponseEntity.ok(service.getByDayAndScreen(day, screenId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarDTO> getById(@PathVariable Long id) {
        CalendarDTO dto = service.getById(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<CalendarDTO> create(@RequestBody CalendarDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarDTO> update(@PathVariable Long id, @RequestBody CalendarDTO dto) {
        CalendarDTO updated = service.update(id, dto);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CalendarDTO>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getByUserId(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!service.delete(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }
}
