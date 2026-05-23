package com.example.makerskills.Service;

import com.example.makerskills.dto.AdStatisticsDto;
import com.example.makerskills.dto.CameraAudienceIngestDTO;
import com.example.makerskills.entity.AdStatistics;
import com.example.makerskills.entity.Advertisement;
import com.example.makerskills.Service.AiAnalysisService;
import com.example.makerskills.repository.AdStatisticsRepository;
import com.example.makerskills.repository.AdvertisementRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdStatisticsService {

    private final AdStatisticsRepository  repository;
    private final AdvertisementRepository advertisementRepository;
    private final AiAnalysisService aiAnalysisService;

    // ─── Record / Upsert ─────────────────────────────────────────────────────

    @Transactional
    public AdStatisticsDto.Response recordStats(AdStatisticsDto.Request req) {
        int updated = repository.incrementStats(
                req.getAdId(), req.getDate(),
                req.getViews(), req.getImpressions(), req.getReach(),
                req.getAiredCount(), req.getSkippedCount(),
                req.getFemaleViews(), req.getMaleViews(), req.getOtherViews(),
                req.getAgeBand0(), req.getAgeBand1(), req.getAgeBand2(), req.getAgeBand3(), req.getAgeBand4(),
                req.getDwellTimeTotal(), req.getDwellTimeCount(),
                req.getInteractions()
        );

        if (updated == 0) {
            // No existing row — look up the Advertisement and insert fresh
            Advertisement advertisement = advertisementRepository.findById(req.getAdId())
                    .orElseThrow(() -> new RuntimeException(
                            "Advertisement not found with id=" + req.getAdId()));

            AdStatistics entity = AdStatistics.builder()
                    .advertisement(advertisement)   // ← @ManyToOne, not a raw Long
                    .date(req.getDate())
                    .views(req.getViews())
                    .impressions(req.getImpressions())
                    .reach(req.getReach())
                    .airedCount(req.getAiredCount())
                    .skippedCount(req.getSkippedCount())
                    .femaleViews(req.getFemaleViews())
                    .maleViews(req.getMaleViews())
                    .otherViews(req.getOtherViews())
                    .ageBand0(req.getAgeBand0())
                    .ageBand1(req.getAgeBand1())
                    .ageBand2(req.getAgeBand2())
                    .ageBand3(req.getAgeBand3())
                    .ageBand4(req.getAgeBand4())
                    .dwellTimeTotal(req.getDwellTimeTotal())
                    .dwellTimeCount(req.getDwellTimeCount())
                    .interactions(req.getInteractions())
                    .build();
            repository.save(entity);
        }

        return repository.findByAdIdAndDate(req.getAdId(), req.getDate())
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException(
                        "Failed to retrieve stats after upsert for adId=" + req.getAdId()));
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    public AdStatisticsDto.Response getByAdIdAndDate(Long adId, LocalDate date) {
        return repository.findByAdIdAndDate(adId, date)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException(
                        "No stats found for adId=" + adId + " on date=" + date));
    }

    public List<AdStatisticsDto.Response> getAllByAdId(Long adId) {
        return repository.findByAdId(adId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AdStatisticsDto.Response> getByAdIdAndDateRange(Long adId, LocalDate from, LocalDate to) {
        return repository.findByAdIdAndDateBetween(adId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AdStatisticsDto.RangeSummary getRangeSummary(Long adId, LocalDate from, LocalDate to) {
        long totalViews        = repository.sumViewsByAdIdAndDateRange(adId, from, to);
        long totalInteractions = repository.sumInteractionsByAdIdAndDateRange(adId, from, to);
        return AdStatisticsDto.RangeSummary.builder()
                .adId(adId).from(from).to(to)
                .totalViews(totalViews)
                .totalInteractions(totalInteractions)
                .build();
    }

    public AdStatisticsDto.GlobalDashboardSummary getGlobalSummary(LocalDate from, LocalDate to) {
        Object[] row = repository.sumGlobalDashboard(from, to);
        return AdStatisticsDto.GlobalDashboardSummary.builder()
                .from(from)
                .to(to)
                .totalViews(longVal(row[0]))
                .totalImpressions(longVal(row[1]))
                .totalReach(longVal(row[2]))
                .totalAired(longVal(row[3]))
                .totalSkipped(longVal(row[4]))
                .totalInteractions(longVal(row[5]))
                .build();
    }

    public List<AdStatisticsDto.Response> getGlobalRange(LocalDate from, LocalDate to) {
        return repository.findAllByDateBetween(from, to).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Genre + tranches d'âge (agrégées sur {@code ad_statistics.age_band_*}).
     */
    public AdStatisticsDto.DemographicsResponse getGlobalDemographics(LocalDate from, LocalDate to) {
        Object[] row = repository.sumGlobalDashboard(from, to);
        long female = longVal(row.length > 6 ? row[6] : 0);
        long male = longVal(row.length > 7 ? row[7] : 0);
        long other = longVal(row.length > 8 ? row[8] : 0);
        List<AdStatisticsDto.DemoBucket> gender = new ArrayList<>(3);
        gender.add(AdStatisticsDto.DemoBucket.builder().label("Female").count(female).build());
        gender.add(AdStatisticsDto.DemoBucket.builder().label("Male").count(male).build());
        gender.add(AdStatisticsDto.DemoBucket.builder().label("Other").count(other).build());
        String[] ageLabels = {"Child", "Teen", "Young Adult", "Adult", "Senior"};
        List<AdStatisticsDto.DemoBucket> ages = new ArrayList<>(5);
        for (int i = 0; i < 5; i++) {
            int idx = 9 + i;
            long cnt = row.length > idx ? longVal(row[idx]) : 0L;
            ages.add(AdStatisticsDto.DemoBucket.builder().label(ageLabels[i]).count(cnt).build());
        }
        return AdStatisticsDto.DemographicsResponse.builder()
                .ageGroups(ages)
                .genderSplit(gender)
                .build();
    }

    /**
     * Ingestion des agrégats caméra (Python / edge) dans la ligne du jour pour une annonce.
     */
    @Transactional
    public AdStatisticsDto.Response ingestCameraBatch(CameraAudienceIngestDTO body) {
        // Persist raw AI-analysis batch in dedicated table for IA dashboards.
        aiAnalysisService.recordBatch(body);

        Long adId = body.getAdId();
        if (adId == null) {
            adId = advertisementRepository.findFirstByOrderByIdAsc()
                    .map(Advertisement::getId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "No advertisement row in DB — create one or send adId."));
        }

        LocalDate date = body.getDate() != null ? body.getDate() : LocalDate.now();

        List<Integer> ac = body.getAgeBandCounts() != null ? body.getAgeBandCounts() : Collections.emptyList();
        int a0 = ac.size() > 0 ? Math.max(0, ac.get(0)) : 0;
        int a1 = ac.size() > 1 ? Math.max(0, ac.get(1)) : 0;
        int a2 = ac.size() > 2 ? Math.max(0, ac.get(2)) : 0;
        int a3 = ac.size() > 3 ? Math.max(0, ac.get(3)) : 0;
        int a4 = ac.size() > 4 ? Math.max(0, ac.get(4)) : 0;

        int det = Math.max(0, body.getDetectionEvents());
        int concurrent = Math.max(0, body.getConcurrentViewers());

        AdStatisticsDto.Request req = AdStatisticsDto.Request.builder()
                .adId(adId)
                .date(date)
                .views(det)
                .impressions(det)
                .reach(concurrent)
                .airedCount(det)
                .skippedCount(0)
                .femaleViews(Math.max(0, body.getFemaleCount()))
                .maleViews(Math.max(0, body.getMaleCount()))
                .otherViews(Math.max(0, body.getOtherGenderCount()))
                .ageBand0(a0).ageBand1(a1).ageBand2(a2).ageBand3(a3).ageBand4(a4)
                .dwellTimeTotal(Math.max(0L, body.getDwellSecondsTotal()))
                .dwellTimeCount(Math.max(0, body.getDwellSamples()))
                .interactions(0)
                .build();
        return recordStats(req);
    }

    private static long longVal(Object o) {
        if (o == null) {
            return 0L;
        }
        return ((Number) o).longValue();
    }

    // ─── Update (full replace) ────────────────────────────────────────────────

    @Transactional
    public AdStatisticsDto.Response updateStats(Long id, AdStatisticsDto.Request req) {
        AdStatistics entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("AdStatistics not found with id=" + id));

        entity.setViews(req.getViews());
        entity.setImpressions(req.getImpressions());
        entity.setReach(req.getReach());
        entity.setAiredCount(req.getAiredCount());
        entity.setSkippedCount(req.getSkippedCount());
        entity.setFemaleViews(req.getFemaleViews());
        entity.setMaleViews(req.getMaleViews());
        entity.setOtherViews(req.getOtherViews());
        entity.setAgeBand0(req.getAgeBand0());
        entity.setAgeBand1(req.getAgeBand1());
        entity.setAgeBand2(req.getAgeBand2());
        entity.setAgeBand3(req.getAgeBand3());
        entity.setAgeBand4(req.getAgeBand4());
        entity.setDwellTimeTotal(req.getDwellTimeTotal());
        entity.setDwellTimeCount(req.getDwellTimeCount());
        entity.setInteractions(req.getInteractions());

        return toResponse(repository.save(entity));
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    @Transactional
    public void deleteById(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("AdStatistics not found with id=" + id);
        }
        repository.deleteById(id);
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private AdStatisticsDto.Response toResponse(AdStatistics s) {
        // dwellTimeCount is a primitive int — never null, no != null check needed
        double avg = s.getDwellTimeCount() > 0
                ? (double) s.getDwellTimeTotal() / s.getDwellTimeCount()
                : 0.0;

        return AdStatisticsDto.Response.builder()
                .id(s.getId())
                .adId(s.getAdvertisement().getId())   // ← fixed: entity has no getAdId()
                .date(s.getDate())
                .views(s.getViews())
                .impressions(s.getImpressions())
                .reach(s.getReach())
                .airedCount(s.getAiredCount())
                .skippedCount(s.getSkippedCount())
                .femaleViews(s.getFemaleViews())
                .maleViews(s.getMaleViews())
                .otherViews(s.getOtherViews())
                .ageBand0(s.getAgeBand0())
                .ageBand1(s.getAgeBand1())
                .ageBand2(s.getAgeBand2())
                .ageBand3(s.getAgeBand3())
                .ageBand4(s.getAgeBand4())
                .dwellTimeTotal(s.getDwellTimeTotal())
                .dwellTimeCount(s.getDwellTimeCount())
                .avgDwellTimeSeconds(avg)
                .interactions(s.getInteractions())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
