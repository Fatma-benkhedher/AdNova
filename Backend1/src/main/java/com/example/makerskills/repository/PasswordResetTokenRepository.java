package com.example.makerskills.repository;

import com.example.makerskills.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
            String tokenHash,
            LocalDateTime now
    );

    @Query("""
            SELECT t FROM PasswordResetToken t
            JOIN FETCH t.user u
            WHERE LOWER(u.email) = :emailLower
            AND t.tokenHash = :tokenHash
            AND t.usedAt IS NULL AND t.expiresAt > :now
            """)
    Optional<PasswordResetToken> findActiveByEmailLowerAndTokenHash(
            @Param("emailLower") String emailLower,
            @Param("tokenHash") String tokenHash,
            @Param("now") LocalDateTime now
    );

    @Modifying
    int deleteByUsedAtIsNotNullOrExpiresAtBefore(LocalDateTime now);

    @Modifying
    int deleteByUser_Id(Long userId);
}
