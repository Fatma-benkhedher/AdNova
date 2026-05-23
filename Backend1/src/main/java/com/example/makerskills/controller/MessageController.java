package com.example.makerskills.controller;

import com.example.makerskills.entity.Message;
import com.example.makerskills.entity.MessageReply;
import com.example.makerskills.entity.Notification;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.MessageReplyRepository;
import com.example.makerskills.repository.MessageRepository;
import com.example.makerskills.repository.NotificationRepository;
import com.example.makerskills.repository.UserRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final MessageReplyRepository messageReplyRepository;

    public MessageController(MessageRepository messageRepository, UserRepository userRepository,
                            NotificationRepository notificationRepository,
                            MessageReplyRepository messageReplyRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.messageReplyRepository = messageReplyRepository;
    }

    @PostMapping
    public ResponseEntity<?> createMessage(@RequestBody CreateMessageRequest request) {
        if (request.userId() == null) {
            return ResponseEntity.badRequest().body("User ID required");
        }
        User user = userRepository.findById(request.userId()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        Message message = new Message();
        message.setRequestType(request.requestType());
        message.setSubject(request.subject());
        message.setContent(request.message());
        message.setUser(user);
        Message saved = messageRepository.save(message);
        // Notify operators: create notification for new support message
        Notification notif = new Notification();
        notif.setMessage(saved);
        notif.setFromUser(user);
        notif.setType("new_message");
        notificationRepository.save(notif);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Message> getMessages(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return messageRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        }
        return messageRepository.findAllWithUser();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Message> getMessage(@PathVariable Long id) {
        return messageRepository.findByIdWithUser(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/replies")
    public List<MessageReply> getReplies(@PathVariable Long id) {
        return messageReplyRepository.findByMessage_IdOrderByCreatedAtAsc(id);
    }

    @PostMapping("/{id}/replies")
    public ResponseEntity<?> addReply(@PathVariable Long id, @RequestBody ReplyRequest body) {
        Message message = messageRepository.findByIdWithUser(id).orElse(null);
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        User responder = userRepository.findById(body.responderId()).orElse(null);
        if (responder == null) {
            return ResponseEntity.badRequest().body("Responder user not found");
        }
        MessageReply reply = new MessageReply();
        reply.setMessage(message);
        reply.setResponder(responder);
        reply.setContent(body.content());
        messageReplyRepository.save(reply);
        // Notify the advertiser (message author) that they received a reply
        User messageAuthor = message.getUser();
        if (messageAuthor != null) {
            Notification notif = new Notification();
            notif.setMessage(message);
            notif.setFromUser(responder);
            notif.setType("reply");
            notif.setTargetUserId(messageAuthor.getId());
            notificationRepository.save(notif);
        }
        return ResponseEntity.ok(reply);
    }

    public record CreateMessageRequest(
            @NotBlank String requestType,
            @NotBlank String subject,
            @NotBlank String message,
            java.lang.Long userId
    ) {}

    public record ReplyRequest(String content, Long responderId) {}
}

