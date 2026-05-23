package com.example.makerskills.repository;

import com.example.makerskills.entity.AdDefault;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdDefaultRepository extends JpaRepository<AdDefault, Long> {

    Optional<AdDefault> findFirstByOrderByIdAsc();

    List<AdDefault> findByUser_Id(Long userId);
}
