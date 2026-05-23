package com.example.makerskills.repository;

import com.example.makerskills.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    void deleteByUser_Id(Long userId);
    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.user WHERE m.user.id = :userId ORDER BY m.createdAt DESC")
    List<Message> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.user ORDER BY m.createdAt DESC")
    List<Message> findAllWithUser();

    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.user WHERE m.id = :id")
    Optional<Message> findByIdWithUser(Long id);
}

