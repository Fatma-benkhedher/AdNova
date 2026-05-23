package com.example.makerskills.repository;

import com.example.makerskills.entity.PlaylistFinaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaylistFinaleItemRepository extends JpaRepository<PlaylistFinaleItem, Long> {
    List<PlaylistFinaleItem> findByCalendarEntry_Id(Long calendarId);
}
