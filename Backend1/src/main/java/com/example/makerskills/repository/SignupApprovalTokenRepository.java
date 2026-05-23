package com.example.makerskills.repository;

import com.example.makerskills.entity.SignupApprovalToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface SignupApprovalTokenRepository extends JpaRepository<SignupApprovalToken, Long> {
    Optional<SignupApprovalToken> findByTokenHashAndDecidedAtIsNullAndExpiresAtAfter(String tokenHash, LocalDateTime now);

    void deleteByUser_Id(Long userId);
}
