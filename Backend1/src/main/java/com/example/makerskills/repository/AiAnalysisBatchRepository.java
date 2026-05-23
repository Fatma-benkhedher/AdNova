package com.example.makerskills.repository;

import com.example.makerskills.entity.AiAnalysisBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AiAnalysisBatchRepository extends JpaRepository<AiAnalysisBatch, Long> {

    @Query("""
        SELECT
            COALESCE(SUM(a.femaleCount), 0L),
            COALESCE(SUM(a.maleCount), 0L),
            COALESCE(SUM(a.otherGenderCount), 0L),
            COALESCE(SUM(a.ageBand0), 0L),
            COALESCE(SUM(a.ageBand1), 0L),
            COALESCE(SUM(a.ageBand2), 0L),
            COALESCE(SUM(a.ageBand3), 0L),
            COALESCE(SUM(a.ageBand4), 0L)
        FROM AiAnalysisBatch a
        WHERE a.capturedAt >= :fromTs AND a.capturedAt <= :toTs
    """)
    Object[] sumDemographics(@Param("fromTs") LocalDateTime fromTs, @Param("toTs") LocalDateTime toTs);

    @Query("""
        SELECT
            COALESCE(SUM(a.dwellSecondsTotal), 0L),
            COALESCE(SUM(a.dwellSamples), 0L),
            COALESCE(SUM(a.concurrentViewers), 0L)
        FROM AiAnalysisBatch a
        WHERE a.capturedAt >= :fromTs AND a.capturedAt <= :toTs
    """)
    Object[] sumCoreMetrics(@Param("fromTs") LocalDateTime fromTs, @Param("toTs") LocalDateTime toTs);

    @Query("""
        SELECT
            COALESCE(SUM(a.detectionEvents), 0L),
            COALESCE(SUM(a.detectionEvents), 0L),
            COALESCE(SUM(a.concurrentViewers), 0L),
            COALESCE(SUM(a.dwellSecondsTotal), 0L),
            COALESCE(SUM(a.dwellSamples), 0L)
        FROM AiAnalysisBatch a
        WHERE a.capturedAt >= :fromTs AND a.capturedAt <= :toTs
    """)
    Object[] sumSummary(@Param("fromTs") LocalDateTime fromTs, @Param("toTs") LocalDateTime toTs);
}
