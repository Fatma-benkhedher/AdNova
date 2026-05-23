package com.example.makerskills.Service;

import com.example.makerskills.dto.Calendarsummarydto;
import com.example.makerskills.dto.Playlistadrequestdto;
import com.example.makerskills.dto.Playlistadresponsedto;
import com.example.makerskills.entity.*;
import com.example.makerskills.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class Playlistadservice {
    private static final int SLOT_GAP_MINUTES = 2;

    private final Playlistadrepository playlistAdRepo;
    private final Playlistadscalendarrepository junctionRepo;
    private final CalendarRepository calendarRepo;
    private final ScreenRepository screenRepo;
    private final UserRepository userRepo;
    private final AdDefaultRepository adDefaultRepository;
    private final PlaylistFinaleService playlistFinaleService;

    @Transactional
    public Playlistadresponsedto create(Playlistadrequestdto req, Long userId) {
        Screen screen = screenRepo.findById(UUID.fromString(req.getScreenId()))
                .orElseThrow(() -> new EntityNotFoundException("Screen not found: " + req.getScreenId()));
        User user = userRepo.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        Playlistad playlist = Playlistad.builder()
                .name(req.getName())
                .screen(screen)
                .user(user)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status("active")
                .build();

        Playlistad saved = playlistAdRepo.save(playlist);
        if (req.getCalendarIds() != null) {
            req.getCalendarIds().forEach(calId -> addCalendarEntry(saved.getId(), calId));
        }
        return toDTO(playlistAdRepo.findByIdWithDetails(saved.getId()).orElse(saved));
    }

    @Transactional(readOnly = true)
    public Playlistadresponsedto getById(Long id) {
        Playlistad p = playlistAdRepo.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Playlist not found: " + id));
        return toDTO(p);
    }

    @Transactional(readOnly = true)
    public List<Playlistadresponsedto> getByScreen(String screenId) {
        return playlistAdRepo.findByScreenIdWithDetails(UUID.fromString(screenId)).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Playlistadresponsedto> getByUser(Long userId) {
        return playlistAdRepo.findByUser_Id(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Playlistadresponsedto> getByDay(LocalDate day) {
        return playlistAdRepo.findByDayWithDetails(day).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<Playlistadresponsedto> getToday() {
        return getByDay(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<Playlistadresponsedto> getToday(LocalDate day) {
        return getByDay(day == null ? LocalDate.now() : day);
    }

    @Transactional
    public Playlistadresponsedto update(Long id, Playlistadrequestdto req) {
        Playlistad p = playlistAdRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Playlist not found: " + id));
        if (req.getName() != null) p.setName(req.getName());
        if (req.getStartDate() != null) p.setStartDate(req.getStartDate());
        if (req.getEndDate() != null) p.setEndDate(req.getEndDate());
        if (req.getScreenId() != null) {
            Screen screen = screenRepo.findById(UUID.fromString(req.getScreenId()))
                    .orElseThrow(() -> new EntityNotFoundException("Screen not found"));
            p.setScreen(screen);
        }
        return toDTO(playlistAdRepo.save(p));
    }

    @Transactional
    public void delete(Long id) {
        if (!playlistAdRepo.existsById(id)) {
            throw new EntityNotFoundException("Playlist not found: " + id);
        }
        playlistAdRepo.deleteById(id);
    }

    @Transactional
    public void addCalendarEntry(Long playlistId, Long calendarId) {
        if (junctionRepo.existsByPlaylist_IdAndCalendar_Id(playlistId, calendarId)) return;
        Playlistad playlist = playlistAdRepo.findById(playlistId)
                .orElseThrow(() -> new EntityNotFoundException("Playlist not found: " + playlistId));
        CalendarEntry calendarEntry = calendarRepo.findById(calendarId)
                .orElseThrow(() -> new EntityNotFoundException("Calendar entry not found: " + calendarId));
        junctionRepo.save(Playlistadscalendar.builder()
                .playlist(playlist)
                .calendar(calendarEntry)
                .actionType("run")
                .build());
    }

    @Transactional
    public void removeCalendarEntry(Long playlistId, Long calendarId) {
        junctionRepo.deleteByPlaylist_IdAndCalendar_Id(playlistId, calendarId);
    }

    @Transactional
    public void syncCalendarEntry(CalendarEntry entry) {
        if (entry == null || entry.getId() == null || entry.getScreen() == null || entry.getDay() == null) return;
        UUID screenId = entry.getScreen().getId();
        if (screenId == null) return;
        Playlistad playlist = playlistAdRepo.findFirstByScreen_IdAndStartDate(screenId, entry.getDay())
                .orElseGet(() -> {
                    Screen screen = screenRepo.findById(screenId).orElseThrow(() -> new EntityNotFoundException("Screen not found: " + screenId));
                    User owner = entry.getUserId() != null ? userRepo.findById(entry.getUserId()).orElse(null) : null;
                    return playlistAdRepo.save(Playlistad.builder()
                            .name("playlist " + entry.getDay())
                            .screen(screen)
                            .user(owner)
                            .startDate(entry.getDay())
                            .endDate(entry.getDay())
                            .status("active")
                            .build());
                });
        if (!junctionRepo.existsByPlaylist_IdAndCalendar_Id(playlist.getId(), entry.getId())) {
            junctionRepo.save(Playlistadscalendar.builder()
                    .playlist(playlist)
                    .calendar(entry)
                    .actionType("run")
                    .build());
        }
    }

    @Transactional
    public void unlinkCalendarEntry(Long calendarId) {
        junctionRepo.deleteByCalendar_Id(calendarId);
    }

    @Transactional
    public void setActionType(Long playlistId, Long calendarId, String actionType) {
        String normalized = "stop".equalsIgnoreCase(actionType) ? "stop" : "run";
        // Resolve by calendar id: UI may pass playlist_finale id, not playlist_ads id.
        List<Playlistadscalendar> links = junctionRepo.findByCalendar_Id(calendarId);
        if (links.isEmpty()) {
            throw new EntityNotFoundException("Playlist item not found");
        }
        Optional<Playlistadscalendar> preferred = links.stream()
                .filter(x -> x.getPlaylist() != null && Objects.equals(x.getPlaylist().getId(), playlistId))
                .findFirst();
        List<Playlistadscalendar> targets = preferred.map(List::of).orElse(links);
        for (Playlistadscalendar target : targets) {
            target.setActionType(normalized);
            junctionRepo.save(target);
        }
        playlistFinaleService.setItemActionByCalendarId(calendarId, normalized);
    }

    private Playlistadresponsedto toDTO(Playlistad p) {
        List<Calendarsummarydto> entries = p.getPlaylistAdsCalendars().stream()
                .map(pac -> {
                    CalendarEntry c = pac.getCalendar();
                    Advertisement ad = c.getAdvertisement();
                    return Calendarsummarydto.builder()
                            .calendarId(c.getId())
                            .day(c.getDay())
                            .time(c.getTime())
                            .calendarStatus(c.getStatus())
                            .actionType(pac.getActionType() == null ? "run" : pac.getActionType())
                            .defaultInserted(false)
                            .adId(ad != null ? ad.getId() : c.getAdId())
                            .adName(ad != null ? ad.getName() : c.getName())
                            .adVideoUrl(ad != null ? ad.getVideoUrl() : null)
                            .adThumbnailUrl(ad != null ? ad.getThumbnailUrl() : null)
                            .build();
                })
                .sorted(Comparator.comparing(Calendarsummarydto::getDay, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Calendarsummarydto::getTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<Calendarsummarydto> withDefaults = injectDefaultGaps(entries);

        return Playlistadresponsedto.builder()
                .id(p.getId())
                .name(p.getName())
                .status(p.getStatus())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .screenId(p.getScreen().getId().toString())
                .screenName(p.getScreen().getNom())
                .screenAddress(p.getScreen().getAddress())
                .calendarEntries(withDefaults)
                .build();
    }

    private List<Calendarsummarydto> injectDefaultGaps(List<Calendarsummarydto> sorted) {
        if (sorted.size() < 2) return sorted;
        Optional<AdDefault> maybeDefault = adDefaultRepository.findFirstByOrderByIdAsc();
        if (maybeDefault.isEmpty()) return sorted;
        AdDefault adDefault = maybeDefault.get();
        if ((adDefault.getVideoUrl() == null || adDefault.getVideoUrl().isBlank())
                && (adDefault.getImageUrl() == null || adDefault.getImageUrl().isBlank())) {
            return sorted;
        }

        List<Calendarsummarydto> result = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            Calendarsummarydto current = sorted.get(i);
            result.add(current);
            if (i == sorted.size() - 1) break;
            Calendarsummarydto next = sorted.get(i + 1);
            if (current.getDay() == null || next.getDay() == null || !current.getDay().equals(next.getDay())) continue;
            if (current.getTime() == null || next.getTime() == null) continue;

            LocalTime probe = current.getTime().plusMinutes(SLOT_GAP_MINUTES);
            while (probe.isBefore(next.getTime())) {
                result.add(Calendarsummarydto.builder()
                        .calendarId(null)
                        .day(current.getDay())
                        .time(probe)
                        .calendarStatus("default")
                        .actionType("run")
                        .defaultInserted(true)
                        .adId(null)
                        .adName("Default ad")
                        .adVideoUrl(adDefault.getVideoUrl())
                        .adThumbnailUrl(adDefault.getImageUrl())
                        .build());
                probe = probe.plusMinutes(SLOT_GAP_MINUTES);
            }
        }
        return result;
    }
}
