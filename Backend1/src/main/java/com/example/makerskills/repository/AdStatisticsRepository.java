package com.example.makerskills.repository;

import com.example.makerskills.entity.AdStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdStatisticsRepository extends JpaRepository<AdStatistics, Long> {

    @Modifying
    @Query("DELETE FROM AdStatistics s WHERE s.advertisement.id IN :adIds")
    void deleteByAdvertisement_IdIn(@Param("adIds") Collection<Long> adIds);

    @Query("SELECT s FROM AdStatistics s WHERE s.advertisement.id = :adId AND s.date = :date")
    Optional<AdStatistics> findByAdIdAndDate(
            @Param("adId") Long adId,
            @Param("date") LocalDate date
    );

    @Query("SELECT s FROM AdStatistics s WHERE s.advertisement.id = :adId")
    List<AdStatistics> findByAdId(@Param("adId") Long adId);

    @Query("SELECT s FROM AdStatistics s WHERE s.advertisement.id = :adId AND s.date BETWEEN :from AND :to")
    List<AdStatistics> findByAdIdAndDateBetween(
            @Param("adId") Long adId,
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to
    );

    @Modifying
    @Query("""
        UPDATE AdStatistics s SET
            s.views          = s.views          + :views,
            s.impressions    = s.impressions    + :impressions,
            s.reach          = s.reach          + :reach,
            s.airedCount     = s.airedCount     + :airedCount,
            s.skippedCount   = s.skippedCount   + :skippedCount,
            s.femaleViews    = s.femaleViews    + :femaleViews,
            s.maleViews      = s.maleViews      + :maleViews,
            s.otherViews     = s.otherViews     + :otherViews,
            s.ageBand0       = s.ageBand0       + :ageBand0,
            s.ageBand1       = s.ageBand1       + :ageBand1,
            s.ageBand2       = s.ageBand2       + :ageBand2,
            s.ageBand3       = s.ageBand3       + :ageBand3,
            s.ageBand4       = s.ageBand4       + :ageBand4,
            s.dwellTimeTotal = s.dwellTimeTotal + :dwellTimeTotal,
            s.dwellTimeCount = s.dwellTimeCount + :dwellTimeCount,
            s.interactions   = s.interactions   + :interactions
        WHERE s.advertisement.id = :adId AND s.date = :date
    """)
    int incrementStats(
            @Param("adId")           Long adId,
            @Param("date")           LocalDate date,
            @Param("views")          int views,
            @Param("impressions")    int impressions,
            @Param("reach")          int reach,
            @Param("airedCount")     int airedCount,
            @Param("skippedCount")   int skippedCount,
            @Param("femaleViews")    int femaleViews,
            @Param("maleViews")      int maleViews,
            @Param("otherViews")     int otherViews,
            @Param("ageBand0")       int ageBand0,
            @Param("ageBand1")       int ageBand1,
            @Param("ageBand2")       int ageBand2,
            @Param("ageBand3")       int ageBand3,
            @Param("ageBand4")       int ageBand4,
            @Param("dwellTimeTotal") long dwellTimeTotal,
            @Param("dwellTimeCount") int dwellTimeCount,
            @Param("interactions")   int interactions
    );

    @Query("""
        SELECT COALESCE(SUM(s.views), 0) FROM AdStatistics s
        WHERE s.advertisement.id = :adId AND s.date BETWEEN :from AND :to
    """)
    long sumViewsByAdIdAndDateRange(
            @Param("adId") Long adId,
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to
    );

    @Query("""
        SELECT COALESCE(SUM(s.interactions), 0) FROM AdStatistics s
        WHERE s.advertisement.id = :adId AND s.date BETWEEN :from AND :to
    """)
    long sumInteractionsByAdIdAndDateRange(
            @Param("adId") Long adId,
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to
    );

    @Query("""
        SELECT
            COALESCE(SUM(s.views), 0L),
            COALESCE(SUM(s.impressions), 0L),
            COALESCE(SUM(s.reach), 0L),
            COALESCE(SUM(s.airedCount), 0L),
            COALESCE(SUM(s.skippedCount), 0L),
            COALESCE(SUM(s.interactions), 0L),
            COALESCE(SUM(s.femaleViews), 0L),
            COALESCE(SUM(s.maleViews), 0L),
            COALESCE(SUM(s.otherViews), 0L),
            COALESCE(SUM(s.ageBand0), 0L),
            COALESCE(SUM(s.ageBand1), 0L),
            COALESCE(SUM(s.ageBand2), 0L),
            COALESCE(SUM(s.ageBand3), 0L),
            COALESCE(SUM(s.ageBand4), 0L)
        FROM AdStatistics s
        WHERE s.date BETWEEN :from AND :to
    """)
    Object[] sumGlobalDashboard(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT s FROM AdStatistics s WHERE s.date BETWEEN :from AND :to ORDER BY s.date DESC, s.id DESC")
    List<AdStatistics> findAllByDateBetween(
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to
    );
}