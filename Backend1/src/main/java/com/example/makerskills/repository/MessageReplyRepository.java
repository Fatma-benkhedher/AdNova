package com.example.makerskills.repository;

import com.example.makerskills.entity.MessageReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.Modifying;

import java.util.Collection;
import java.util.List;

public interface MessageReplyRepository extends JpaRepository<MessageReply, Long> {
    @Query("SELECT r FROM MessageReply r JOIN FETCH r.responder WHERE r.message.id = :messageId ORDER BY r.createdAt ASC")
    List<MessageReply> findByMessage_IdOrderByCreatedAtAsc(@Param("messageId") Long messageId);

    @Modifying
    void deleteByMessage_IdIn(Collection<Long> messageIds);

    @Modifying
    void deleteByResponder_Id(Long responderId);
}
