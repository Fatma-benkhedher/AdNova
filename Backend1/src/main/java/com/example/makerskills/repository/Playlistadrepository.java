package com.example.makerskills.repository;

import com.example.makerskills.entity.Playlistad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface Playlistadrepository extends JpaRepository<Playlistad, Long> {
    List<Playlistad> findByScreen_Id(UUID screenId);
    List<Playlistad> findByUser_Id(Long userId);
    List<Playlistad> findByStartDate(LocalDate day);
    Optional<Playlistad> findFirstByScreen_IdAndStartDate(UUID screenId, LocalDate day);

    @Query("""
        SELECT DISTINCT pa FROM Playlistad pa
        LEFT JOIN FETCH pa.screen s
        LEFT JOIN FETCH pa.playlistAdsCalendars pac
        LEFT JOIN FETCH pac.calendar c
        LEFT JOIN FETCH c.advertisement
        WHERE pa.id = :id
    """)
    Optional<Playlistad> findByIdWithDetails(@Param("id") Long id);

    @Query("""
        SELECT DISTINCT pa FROM Playlistad pa
        LEFT JOIN FETCH pa.screen s
        LEFT JOIN FETCH pa.playlistAdsCalendars pac
        LEFT JOIN FETCH pac.calendar c
        LEFT JOIN FETCH c.advertisement
        WHERE s.id = :screenId
    """)
    List<Playlistad> findByScreenIdWithDetails(@Param("screenId") UUID screenId);

    @Query("""
        SELECT DISTINCT pa FROM Playlistad pa
        LEFT JOIN FETCH pa.screen s
        LEFT JOIN FETCH pa.playlistAdsCalendars pac
        LEFT JOIN FETCH pac.calendar c
        LEFT JOIN FETCH c.advertisement
        WHERE pa.startDate = :day
    """)
    List<Playlistad> findByDayWithDetails(@Param("day") LocalDate day);
}
