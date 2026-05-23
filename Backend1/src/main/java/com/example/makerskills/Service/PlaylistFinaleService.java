package com.example.makerskills.Service;

import com.example.makerskills.dto.Calendarsummarydto;
import com.example.makerskills.dto.Playlistadresponsedto;
import com.example.makerskills.entity.*;
import com.example.makerskills.repository.CalendarRepository;
import com.example.makerskills.repository.PlaylistFinaleItemRepository;
import com.example.makerskills.repository.PlaylistFinaleRepository;
import com.example.makerskills.repository.Playlistadscalendarrepository;
import com.example.makerskills.repository.ScreenRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistFinaleService {

    private final PlaylistFinaleRepository playlistFinaleRepository;
    private final PlaylistFinaleItemRepository playlistFinaleItemRepository;
    private final CalendarRepository calendarRepository;
    private final ScreenRepository screenRepository;
    private final Playlistadscalendarrepository playlistadscalendarrepository;

    @Transactional
    public List<Playlistadresponsedto> getByDay(LocalDate day, UUID screenIdFilter) {
        List<Playlistadresponsedto> rows = loadDayRows(day);
        rows = applyScreenFilter(rows, screenIdFilter);
        if (!rows.isEmpty()) {
            return rows;
        }

        // Backfill: older DBs may have calendar rows but no playlist_finale yet.
        List<CalendarEntry> todays = calendarRepository.findByDay(day);
        if (todays.isEmpty()) {
            return rows;
        }

        Set<UUID> screenIds = new HashSet<>();
        boolean missingScreen = false;
        for (CalendarEntry c : todays) {
            if (c.getScreen() == null || c.getScreen().getId() == null) {
                missingScreen = true;
            } else {
                screenIds.add(c.getScreen().getId());
            }
        }
        if (screenIdFilter != null) {
            rebuildForDayAndScreen(day, screenIdFilter);
        } else {
            for (UUID sid : screenIds) {
                rebuildForDayAndScreen(day, sid);
            }
            if (missingScreen) {
                rebuildForDayAndScreen(day, null);
            }
        }

        rows = applyScreenFilter(loadDayRows(day), screenIdFilter);
        return rows;
    }

    private List<Playlistadresponsedto> loadDayRows(LocalDate day) {
        return playlistFinaleRepository.findByDayWithItems(day).stream()
                .map(this::toPlaylistRowDto)
                .sorted(Comparator.comparing(Playlistadresponsedto::getScreenName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private List<Playlistadresponsedto> applyScreenFilter(List<Playlistadresponsedto> rows, UUID screenIdFilter) {
        if (screenIdFilter == null) {
            return rows;
        }
        String sid = screenIdFilter.toString();
        return rows.stream()
                .filter(r -> sid.equalsIgnoreCase(r.getScreenId()))
                .toList();
    }

    @Transactional
    public void rebuildForDayAndScreen(LocalDate day, UUID screenId) {
        if (day == null) return;

        List<CalendarEntry> entries = calendarRepository.findByDayAndOptionalScreen(day, screenId);
        if (entries.isEmpty()) {
            if (screenId != null) {
                playlistFinaleRepository.findByDayAndScreen_Id(day, screenId).ifPresent(playlistFinaleRepository::delete);
            } else {
                playlistFinaleRepository.findByDayAndScreenIsNull(day).ifPresent(playlistFinaleRepository::delete);
            }
            return;
        }

        entries.sort(Comparator
                .comparing(CalendarEntry::getDay, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(CalendarEntry::getTime, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(CalendarEntry::getId, Comparator.nullsLast(Comparator.naturalOrder())));

        Screen screenEntity = null;
        if (screenId != null) {
            screenEntity = screenRepository.findById(screenId)
                    .orElseThrow(() -> new EntityNotFoundException("Screen not found: " + screenId));
        }

        String generatedName = "playlist " + day;

        PlaylistFinale finale = screenId == null
                ? playlistFinaleRepository.findByDayAndScreenIsNull(day).orElse(null)
                : playlistFinaleRepository.findByDayAndScreen_Id(day, screenId).orElse(null);

        if (finale == null) {
            finale = PlaylistFinale.builder()
                    .day(day)
                    .screen(screenEntity)
                    .name(generatedName)
                    .action("run")
                    .build();
        } else {
            finale.setDay(day);
            finale.setScreen(screenEntity);
            finale.setName(generatedName);
            if (finale.getAction() == null || finale.getAction().isBlank()) {
                finale.setAction("run");
            }
            finale.getItems().clear();
        }

        int order = 0;
        for (CalendarEntry c : entries) {
            String action = resolveActionFromJunction(c.getId());
            finale.getItems().add(PlaylistFinaleItem.builder()
                    .playlistFinale(finale)
                    .sortOrder(order++)
                    .calendarEntry(c)
                    .actionType(action)
                    .build());
        }

        playlistFinaleRepository.save(finale);
    }

    @Transactional
    public void syncAfterCalendarChange(CalendarEntry entry) {
        if (entry == null) return;
        LocalDate day = entry.getDay();
        UUID screenId = entry.getScreen() == null ? null : entry.getScreen().getId();
        rebuildForDayAndScreen(day, screenId);
    }

    @Transactional
    public void setItemActionByCalendarId(Long calendarId, String actionType) {
        if (calendarId == null) return;
        String normalized = "stop".equalsIgnoreCase(actionType) ? "stop" : "run";
        List<PlaylistFinaleItem> items = playlistFinaleItemRepository.findByCalendarEntry_Id(calendarId);
        for (PlaylistFinaleItem it : items) {
            it.setActionType(normalized);
        }
        playlistFinaleItemRepository.saveAll(items);
    }

    private String resolveActionFromJunction(Long calendarId) {
        return playlistadscalendarrepository.findByCalendar_Id(calendarId).stream()
                .map(Playlistadscalendar::getActionType)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .findFirst()
                .orElse("run");
    }

    private Playlistadresponsedto toPlaylistRowDto(PlaylistFinale pf) {
        List<Calendarsummarydto> entries = pf.getItems().stream()
                .sorted(Comparator.comparingInt(PlaylistFinaleItem::getSortOrder))
                .map(it -> {
                    CalendarEntry c = it.getCalendarEntry();
                    Advertisement ad = c == null ? null : c.getAdvertisement();
                    return Calendarsummarydto.builder()
                            .calendarId(c != null ? c.getId() : null)
                            .day(c != null ? c.getDay() : null)
                            .time(c != null ? c.getTime() : null)
                            .calendarStatus(c != null ? c.getStatus() : null)
                            .actionType(it.getActionType() == null ? "run" : it.getActionType())
                            .defaultInserted(false)
                            .adId(ad != null ? ad.getId() : (c != null ? c.getAdId() : null))
                            .adName(ad != null ? ad.getName() : (c != null ? c.getName() : null))
                            .adVideoUrl(ad != null ? ad.getVideoUrl() : null)
                            .adThumbnailUrl(ad != null ? ad.getThumbnailUrl() : null)
                            .build();
                })
                .collect(Collectors.toList());

        Screen screen = pf.getScreen();
        return Playlistadresponsedto.builder()
                .id(pf.getId())
                .name("playlist " + pf.getDay())
                .status("active")
                .startDate(pf.getDay())
                .endDate(pf.getDay())
                .createdAt(pf.getCreatedAt())
                .updatedAt(pf.getUpdatedAt())
                .screenId(screen == null ? null : screen.getId().toString())
                .screenName(screen == null ? "—" : screen.getNom())
                .screenAddress(screen == null ? "" : screen.getAddress())
                .calendarEntries(entries)
                .build();
    }
}
