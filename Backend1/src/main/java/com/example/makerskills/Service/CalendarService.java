package com.example.makerskills.Service;

import com.example.makerskills.dto.CalendarDTO;
import com.example.makerskills.entity.CalendarEntry;
import com.example.makerskills.entity.Screen;
import com.example.makerskills.repository.CalendarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository repository;
    private final Playlistadservice playlistadservice;
    private final PlaylistFinaleService playlistFinaleService;

    private CalendarDTO mapToDTO(CalendarEntry entity) {
        CalendarDTO dto = new CalendarDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setAdId(entity.getAdId());
        dto.setUserId(entity.getUserId());
        dto.setTime(entity.getTime());
        dto.setDay(entity.getDay());
        dto.setStatus(entity.getStatus());
        if (entity.getScreen() != null) dto.setScreenId(entity.getScreen().getId());
        LocalDateTime created = entity.getCreatedAt();
        if (created != null) dto.setCreatedAt(created);
        return dto;
    }

    private CalendarEntry mapToEntity(CalendarDTO dto) {
        CalendarEntry entity = new CalendarEntry();
        entity.setName(dto.getName());
        entity.setAdId(dto.getAdId());
        entity.setUserId(dto.getUserId());
        entity.setTime(dto.getTime());
        entity.setDay(dto.getDay());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "approved");
        if (dto.getScreenId() != null) {
            Screen screen = new Screen();
            screen.setId(dto.getScreenId());
            entity.setScreen(screen);
        }
        return entity;
    }

    public List<CalendarDTO> getAll() {
        return repository.findAll().stream().map(this::mapToDTO).toList();
    }

    public List<CalendarDTO> getByDay(LocalDate day) {
        return repository.findByDay(day).stream().map(this::mapToDTO).toList();
    }

    public List<CalendarDTO> getByDayAndScreen(LocalDate day, UUID screenId) {
        return repository.findByDayAndScreen_Id(day, screenId).stream().map(this::mapToDTO).toList();
    }

    public CalendarDTO getById(Long id) {
        return repository.findById(id).map(this::mapToDTO).orElse(null);
    }

    public CalendarDTO create(CalendarDTO dto) {
        CalendarEntry saved = repository.save(mapToEntity(dto));
        playlistadservice.syncCalendarEntry(saved);
        playlistFinaleService.syncAfterCalendarChange(saved);
        return mapToDTO(saved);
    }

    public CalendarDTO update(Long id, CalendarDTO dto) {
        return repository.findById(id).map(existing -> {
            LocalDate oldDay = existing.getDay();
            UUID oldScreenId = existing.getScreen() == null ? null : existing.getScreen().getId();

            existing.setName(dto.getName());
            existing.setAdId(dto.getAdId());
            existing.setUserId(dto.getUserId());
            existing.setTime(dto.getTime());
            existing.setDay(dto.getDay());
            existing.setStatus(dto.getStatus());
            if (dto.getScreenId() != null) {
                Screen screen = new Screen();
                screen.setId(dto.getScreenId());
                existing.setScreen(screen);
            }
            CalendarEntry updated = repository.save(existing);
            playlistadservice.syncCalendarEntry(updated);

            LocalDate newDay = updated.getDay();
            UUID newScreenId = updated.getScreen() == null ? null : updated.getScreen().getId();
            if (!Objects.equals(oldDay, newDay) || !Objects.equals(oldScreenId, newScreenId)) {
                playlistFinaleService.rebuildForDayAndScreen(oldDay, oldScreenId);
            }
            playlistFinaleService.syncAfterCalendarChange(updated);
            return mapToDTO(updated);
        }).orElse(null);
    }

    public boolean delete(Long id) {
        if (!repository.existsById(id)) return false;
        CalendarEntry existing = repository.findById(id).orElse(null);
        LocalDate day = existing == null ? null : existing.getDay();
        UUID screenId = existing != null && existing.getScreen() != null ? existing.getScreen().getId() : null;

        playlistadservice.unlinkCalendarEntry(id);
        repository.deleteById(id);

        if (day != null) {
            playlistFinaleService.rebuildForDayAndScreen(day, screenId);
        }
        return true;
    }

    public List<CalendarDTO> getByUserId(Long userId) {
        return repository.findByUserId(userId).stream().map(this::mapToDTO).toList();
    }
}
