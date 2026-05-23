package com.example.makerskills.repository;

import com.example.makerskills.entity.Screen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ScreenRepository extends JpaRepository<Screen, UUID> {

    @Query("SELECT DISTINCT s FROM Screen s JOIN FETCH s.robot LEFT JOIN FETCH s.createdBy")
    List<Screen> findAllWithRobot();

    List<Screen> findByCreatedBy_Id(Long userId);
}
