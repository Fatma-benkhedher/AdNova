package com.example.makerskills.repository;

import com.example.makerskills.entity.PlaylistFinale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaylistFinaleRepository extends JpaRepository<PlaylistFinale, Long> {

    void deleteByDayAndScreen_Id(LocalDate day, UUID screenId);

    void deleteByDayAndScreenIsNull(LocalDate day);

    @Query("""
            SELECT DISTINCT pf FROM PlaylistFinale pf
            LEFT JOIN FETCH pf.screen
            JOIN FETCH pf.items it
            JOIN FETCH it.calendarEntry c
            LEFT JOIN FETCH c.advertisement
            WHERE pf.day = :day
            """)
    List<PlaylistFinale> findByDayWithItems(@Param("day") LocalDate day);

    @Query("""
            SELECT DISTINCT pf FROM PlaylistFinale pf
            LEFT JOIN FETCH pf.screen
            JOIN FETCH pf.items it
            JOIN FETCH it.calendarEntry c
            LEFT JOIN FETCH c.advertisement
            WHERE pf.day = :day AND pf.screen.id = :screenId
            """)
    Optional<PlaylistFinale> findByDayAndScreen_IdWithItems(@Param("day") LocalDate day, @Param("screenId") UUID screenId);

    @Query("""
            SELECT DISTINCT pf FROM PlaylistFinale pf
            LEFT JOIN FETCH pf.screen
            JOIN FETCH pf.items it
            JOIN FETCH it.calendarEntry c
            LEFT JOIN FETCH c.advertisement
            WHERE pf.day = :day AND pf.screen IS NULL
            """)
    Optional<PlaylistFinale> findByDayAndScreenIsNullWithItems(@Param("day") LocalDate day);

    Optional<PlaylistFinale> findByDayAndScreen_Id(LocalDate day, UUID screenId);

    Optional<PlaylistFinale> findByDayAndScreenIsNull(LocalDate day);
}
