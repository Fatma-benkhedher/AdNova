package com.example.makerskills.controller;

import com.example.makerskills.Service.AiAnalysisService;
import com.example.makerskills.dto.AdStatisticsDto;
import com.example.makerskills.dto.AiSummaryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/ai-analysis")
@RequiredArgsConstructor
public class AiAnalysisController {

    private final AiAnalysisService aiAnalysisService;

    @GetMapping("/demographics")
    public ResponseEntity<AdStatisticsDto.DemographicsResponse> demographics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(aiAnalysisService.getDemographics(from, to));
    }

    @GetMapping("/summary")
    public ResponseEntity<AiSummaryDTO> summary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(aiAnalysisService.getSummary(from, to));
    }
}
