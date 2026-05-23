package com.example.makerskills.controller;

import com.example.makerskills.dto.AdStatisticsDto;
import com.example.makerskills.dto.CameraAudienceIngestDTO;
import com.example.makerskills.Service.AdStatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ads")
@RequiredArgsConstructor
public class AdStatisticsController {

    private final AdStatisticsService service;

    /** Si défini (env AUDIENCE_INGEST_API_KEY), le header X-Audience-Ingest-Key doit correspondre. */
    @Value("${app.audience-ingest.api-key:}")
    private String audienceIngestApiKey;

    /**
     * POST /api/ads/statistics
     * Upsert daily stats — increments if row exists, inserts if not.
     *
     * Body: { adId, date, views, impressions, reach, airedCount, skippedCount,
     *         femaleViews, maleViews, otherViews,
     *         dwellTimeTotal, dwellTimeCount, interactions, ageBand0..ageBand4 }
     */
    @PostMapping("/statistics")
    public ResponseEntity<AdStatisticsDto.Response> record(
            @RequestBody AdStatisticsDto.Request req) {
        return ResponseEntity.ok(service.recordStats(req));
    }

    /**
     * POST /api/ads/statistics/camera-batch  
     * Agrégats envoi physique (caméra / script Python TF) pour une pub donnée ; incrémente la ligne du jour.
     */
    @PostMapping("/statistics/camera-batch")
    public ResponseEntity<AdStatisticsDto.Response> ingestCameraBatch(
            @RequestHeader(value = "X-Audience-Ingest-Key", required = false) String ingestKeyHeader,
            @Valid @RequestBody CameraAudienceIngestDTO body) {
        if (StringUtils.hasText(audienceIngestApiKey)
                && !audienceIngestApiKey.equals(ingestKeyHeader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid X-Audience-Ingest-Key");
        }
        return ResponseEntity.ok(service.ingestCameraBatch(body));
    }

    @GetMapping("/statistics/global/summary")
    public ResponseEntity<AdStatisticsDto.GlobalDashboardSummary> globalSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getGlobalSummary(from, to));
    }

    @GetMapping("/statistics/global/range")
    public ResponseEntity<List<AdStatisticsDto.Response>> globalRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getGlobalRange(from, to));
    }

    @GetMapping("/statistics/global/demographics")
    public ResponseEntity<AdStatisticsDto.DemographicsResponse> globalDemographics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getGlobalDemographics(from, to));
    }

    /**
     * GET /api/ads/{adId}/statistics?date=2025-06-01
     * Fetch stats for a single ad on a specific date.
     */
    @GetMapping("/{adId}/statistics")
    public ResponseEntity<AdStatisticsDto.Response> getByDate(
            @PathVariable Long adId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getByAdIdAndDate(adId, date));
    }

    /**
     * GET /api/ads/{adId}/statistics/all
     * Fetch all stat records ever recorded for an ad.
     */
    @GetMapping("/{adId}/statistics/all")
    public ResponseEntity<List<AdStatisticsDto.Response>> getAll(
            @PathVariable Long adId) {
        return ResponseEntity.ok(service.getAllByAdId(adId));
    }

    /**
     * GET /api/ads/{adId}/statistics/range?from=2025-06-01&to=2025-06-30
     * Fetch all stat rows within a date range.
     */
    @GetMapping("/{adId}/statistics/range")
    public ResponseEntity<List<AdStatisticsDto.Response>> getRange(
            @PathVariable Long adId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getByAdIdAndDateRange(adId, from, to));
    }

    /**
     * GET /api/ads/{adId}/statistics/summary?from=2025-06-01&to=2025-06-30
     * Returns aggregated totals (views + interactions) over a date range.
     */
    @GetMapping("/{adId}/statistics/summary")
    public ResponseEntity<AdStatisticsDto.RangeSummary> getSummary(
            @PathVariable Long adId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getRangeSummary(adId, from, to));
    }

    /**
     * PUT /api/ads/statistics/{id}
     * Fully replace all stat values for a specific record.
     */
    @PutMapping("/statistics/{id}")
    public ResponseEntity<AdStatisticsDto.Response> update(
            @PathVariable Long id,
            @RequestBody AdStatisticsDto.Request req) {
        return ResponseEntity.ok(service.updateStats(id, req));
    }

    /**
     * DELETE /api/ads/statistics/{id}
     */
    @DeleteMapping("/statistics/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}