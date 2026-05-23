package com.example.makerskills.repository;

import com.example.makerskills.entity.CalendarEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarRepository extends JpaRepository<CalendarEntry, Long> {
    List<CalendarEntry> findByUserId(Long userId);
    void deleteByUserId(Long userId);
    List<CalendarEntry> findByStatus(String status);
    int countByUserIdAndDay(Long userId, LocalDate day);
    List<CalendarEntry> findByDay(LocalDate day);
    List<CalendarEntry> findByDayAndScreen_Id(LocalDate day, UUID screenId);

    @Query("""
            SELECT DISTINCT c FROM CalendarEntry c
            LEFT JOIN FETCH c.screen
            LEFT JOIN FETCH c.advertisement
            WHERE c.day = :day AND (
              (:screenId IS NOT NULL AND c.screen IS NOT NULL AND c.screen.id = :screenId)
              OR (:screenId IS NULL AND c.screen IS NULL)
            )
            """)
    List<CalendarEntry> findByDayAndOptionalScreen(@Param("day") LocalDate day, @Param("screenId") UUID screenId);
}
