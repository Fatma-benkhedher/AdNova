package com.example.makerskills.Service;

import com.example.makerskills.dto.AdStatisticsDto;
import com.example.makerskills.dto.AiSummaryDTO;
import com.example.makerskills.dto.CameraAudienceIngestDTO;
import com.example.makerskills.entity.AiAnalysisBatch;
import com.example.makerskills.repository.AiAnalysisBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiAnalysisService {

    private final AiAnalysisBatchRepository repository;

    public void recordBatch(CameraAudienceIngestDTO body) {
        List<Integer> ac = body.getAgeBandCounts() != null ? body.getAgeBandCounts() : Collections.emptyList();
        int a0 = ac.size() > 0 ? Math.max(0, ac.get(0)) : 0;
        int a1 = ac.size() > 1 ? Math.max(0, ac.get(1)) : 0;
        int a2 = ac.size() > 2 ? Math.max(0, ac.get(2)) : 0;
        int a3 = ac.size() > 3 ? Math.max(0, ac.get(3)) : 0;
        int a4 = ac.size() > 4 ? Math.max(0, ac.get(4)) : 0;
        int m = Math.max(0, body.getMaleCount());
        int f = Math.max(0, body.getFemaleCount());
        int o = Math.max(0, body.getOtherGenderCount());
        int sumGender = m + f + o;
        int sumAges = a0 + a1 + a2 + a3 + a4;
        int personCount = Math.max(sumGender, sumAges);
        if (personCount <= 0) {
            personCount = Math.max(1, Math.max(0, body.getConcurrentViewers()));
        }

        List<String> genders = new ArrayList<>();
        for (int i = 0; i < f; i++) genders.add("F");
        for (int i = 0; i < m; i++) genders.add("M");
        for (int i = 0; i < o; i++) genders.add("O");

        List<Integer> ages = new ArrayList<>();
        for (int i = 0; i < a0; i++) ages.add(0);
        for (int i = 0; i < a1; i++) ages.add(1);
        for (int i = 0; i < a2; i++) ages.add(2);
        for (int i = 0; i < a3; i++) ages.add(3);
        for (int i = 0; i < a4; i++) ages.add(4);

        long dwellTotal = Math.max(0L, body.getDwellSecondsTotal());
        int det = Math.max(0, body.getDetectionEvents());
        int concurrent = Math.max(0, body.getConcurrentViewers());

        for (int i = 0; i < personCount; i++) {
            String g = i < genders.size() ? genders.get(i) : "O";
            int age = i < ages.size() ? ages.get(i) : 2; // default Young Adult if unknown
            AiAnalysisBatch row = AiAnalysisBatch.builder()
                    .adId(body.getAdId())
                    .maleCount("M".equals(g) ? 1 : 0)
                    .femaleCount("F".equals(g) ? 1 : 0)
                    .otherGenderCount("O".equals(g) ? 1 : 0)
                    .ageBand0(age == 0 ? 1 : 0)
                    .ageBand1(age == 1 ? 1 : 0)
                    .ageBand2(age == 2 ? 1 : 0)
                    .ageBand3(age == 3 ? 1 : 0)
                    .ageBand4(age == 4 ? 1 : 0)
                    .dwellSecondsTotal(personCount > 0 ? Math.max(0L, dwellTotal / personCount) : dwellTotal)
                    .dwellSamples(1)
                    .detectionEvents(det > 0 ? 1 : 0)
                    .concurrentViewers(Math.max(1, concurrent))
                    .build();
            repository.save(row);
        }
    }

    public AdStatisticsDto.DemographicsResponse getDemographics(LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = LocalDateTime.of(to, LocalTime.MAX);
        Object[] row = normalizeRow(repository.sumDemographics(fromTs, toTs));

        long female = longVal(row[0]);
        long male = longVal(row[1]);
        long other = longVal(row[2]);

        List<AdStatisticsDto.DemoBucket> gender = new ArrayList<>(3);
        gender.add(AdStatisticsDto.DemoBucket.builder().label("Female").count(female).build());
        gender.add(AdStatisticsDto.DemoBucket.builder().label("Male").count(male).build());
        gender.add(AdStatisticsDto.DemoBucket.builder().label("Other").count(other).build());

        String[] ageLabels = {"Child", "Teen", "Young Adult", "Adult", "Senior"};
        List<AdStatisticsDto.DemoBucket> ages = new ArrayList<>(5);
        for (int i = 0; i < 5; i++) {
            ages.add(AdStatisticsDto.DemoBucket.builder().label(ageLabels[i]).count(longVal(row[3 + i])).build());
        }

        return AdStatisticsDto.DemographicsResponse.builder()
                .ageGroups(ages)
                .genderSplit(gender)
                .build();
    }

    public Object[] getCoreMetrics(LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = LocalDateTime.of(to, LocalTime.MAX);
        return normalizeRow(repository.sumCoreMetrics(fromTs, toTs));
    }

    public AiSummaryDTO getSummary(LocalDate from, LocalDate to) {
        LocalDateTime fromTs = from.atStartOfDay();
        LocalDateTime toTs = LocalDateTime.of(to, LocalTime.MAX);
        Object[] row = normalizeRow(repository.sumSummary(fromTs, toTs));
        return AiSummaryDTO.builder()
                .totalViews(longVal(row.length > 0 ? row[0] : 0))
                .totalImpressions(longVal(row.length > 1 ? row[1] : 0))
                .totalReach(longVal(row.length > 2 ? row[2] : 0))
                .dwellSecondsTotal(longVal(row.length > 3 ? row[3] : 0))
                .dwellSamples(longVal(row.length > 4 ? row[4] : 0))
                .build();
    }

    /** Some JPA drivers wrap tuple result in an outer Object[1] containing Object[]. */
    private static Object[] normalizeRow(Object[] raw) {
        if (raw != null && raw.length == 1 && raw[0] instanceof Object[]) {
            return (Object[]) raw[0];
        }
        return raw != null ? raw : new Object[0];
    }

    private static long longVal(Object o) {
        if (o == null) return 0L;
        return ((Number) o).longValue();
    }
}
