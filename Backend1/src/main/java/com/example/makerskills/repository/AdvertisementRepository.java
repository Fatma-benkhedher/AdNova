package com.example.makerskills.repository;

import com.example.makerskills.entity.Advertisement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdvertisementRepository
        extends JpaRepository<Advertisement, Long> {

    List<Advertisement> findByUserId(Long userId);

    Optional<Advertisement> findFirstByOrderByIdAsc();
}