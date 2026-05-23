package com.example.makerskills.controller;

import com.example.makerskills.dto.NotificationDTO;
import com.example.makerskills.entity.Message;
import com.example.makerskills.entity.Notification;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<NotificationDTO> getAll(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role
    ) {
        if (userId != null) {
            boolean isOperator = role != null && role.equalsIgnoreCase("operator");
            if (isOperator) {
                return notificationRepository.findForOperatorOrderByCreatedAtDesc()
                        .stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());
            }
            return notificationRepository.findForUserRepliesOrderByCreatedAtDesc(userId)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        return notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private NotificationDTO convertToDTO(Notification n) {
        Message message = n.getMessage();
        User messageCreator = message.getUser();
        User fromUser = n.getFromUser();

        NotificationDTO.UserSummaryDTO creatorDTO = new NotificationDTO.UserSummaryDTO(
                messageCreator.getId(),
                messageCreator.getFirstName(),
                messageCreator.getLastName(),
                messageCreator.getEmail()
        );

        NotificationDTO.MessageSummaryDTO messageDTO = new NotificationDTO.MessageSummaryDTO(
                message.getId(),
                message.getSubject(),
                message.getContent(),
                message.getRequestType(),
                message.getCreatedAt(),
                creatorDTO
        );

        NotificationDTO.UserSummaryDTO fromUserDTO = new NotificationDTO.UserSummaryDTO(
                fromUser.getId(),
                fromUser.getFirstName(),
                fromUser.getLastName(),
                fromUser.getEmail()
        );

        return new NotificationDTO(
                n.getId(),
                messageDTO,
                fromUserDTO,
                n.getType(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setReadAt(LocalDateTime.now());
                    Notification saved = notificationRepository.save(n);
                    return ResponseEntity.ok(convertToDTO(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
