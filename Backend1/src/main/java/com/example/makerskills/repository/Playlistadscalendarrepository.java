package com.example.makerskills.repository;

import com.example.makerskills.entity.Playlistadscalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface Playlistadscalendarrepository extends JpaRepository<Playlistadscalendar, Long> {
    List<Playlistadscalendar> findByPlaylist_Id(Long playlistId);
    List<Playlistadscalendar> findByCalendar_Id(Long calendarId);
    boolean existsByPlaylist_IdAndCalendar_Id(Long playlistId, Long calendarId);
    void deleteByPlaylist_IdAndCalendar_Id(Long playlistId, Long calendarId);
    void deleteByCalendar_Id(Long calendarId);
}
