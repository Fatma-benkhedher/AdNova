package com.example.makerskills.repository;

import com.example.makerskills.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Collection;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("SELECT DISTINCT n FROM Notification n JOIN FETCH n.message m JOIN FETCH m.user JOIN FETCH n.fromUser ORDER BY n.createdAt DESC")
    List<Notification> findAllByOrderByCreatedAtDesc();

    // Operator notifications: only new messages (target_user_id IS NULL)
    @Query("SELECT DISTINCT n FROM Notification n JOIN FETCH n.message m JOIN FETCH m.user JOIN FETCH n.fromUser WHERE n.targetUserId IS NULL AND n.type = 'new_message' ORDER BY n.createdAt DESC")
    List<Notification> findForOperatorOrderByCreatedAtDesc();

    // Advertiser notifications: only replies targeted to them
    @Query("SELECT DISTINCT n FROM Notification n JOIN FETCH n.message m JOIN FETCH m.user JOIN FETCH n.fromUser WHERE n.targetUserId = :userId AND n.type = 'reply' ORDER BY n.createdAt DESC")
    List<Notification> findForUserRepliesOrderByCreatedAtDesc(Long userId);

    @Modifying
    void deleteByMessage_IdIn(Collection<Long> messageIds);

    @Modifying
    void deleteByTargetUserId(Long targetUserId);

    @Modifying
    void deleteByFromUser_Id(Long userId);
}
