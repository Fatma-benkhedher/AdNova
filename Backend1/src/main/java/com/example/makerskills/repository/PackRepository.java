package com.example.makerskills.repository;

import com.example.makerskills.entity.Pack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PackRepository extends JpaRepository<Pack, Long> {
    @Query("SELECT p FROM Pack p JOIN p.advertisers a WHERE a.id = :userId")
    Optional<Pack> findByAdvertiserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT p FROM Pack p JOIN p.advertisers a WHERE a.id = :userId")
    List<Pack> findAllPacksByAdvertiserId(@Param("userId") Long userId);
}

