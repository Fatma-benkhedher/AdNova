package com.example.makerskills.repository;

import com.example.makerskills.entity.Robot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RobotRepository extends JpaRepository<Robot, UUID> {

    Optional<Robot> findByNom(String nom);
}
