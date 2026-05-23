package com.example.makerskills.dto;

import java.time.LocalDateTime;

public class NotificationDTO {
    private Long id;
    private MessageSummaryDTO message;
    private UserSummaryDTO fromUser;
    private String type;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    public NotificationDTO(Long id, MessageSummaryDTO message, UserSummaryDTO fromUser, 
                          String type, LocalDateTime createdAt, LocalDateTime readAt) {
        this.id = id;
        this.message = message;
        this.fromUser = fromUser;
        this.type = type;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MessageSummaryDTO getMessage() { return message; }
    public void setMessage(MessageSummaryDTO message) { this.message = message; }

    public UserSummaryDTO getFromUser() { return fromUser; }
    public void setFromUser(UserSummaryDTO fromUser) { this.fromUser = fromUser; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    // Nested DTO Classes
    public static class MessageSummaryDTO {
        private Long id;
        private String subject;
        private String content;
        private String requestType;
        private LocalDateTime createdAt;
        private UserSummaryDTO user;

        public MessageSummaryDTO(Long id, String subject, String content, String requestType, 
                                LocalDateTime createdAt, UserSummaryDTO user) {
            this.id = id;
            this.subject = subject;
            this.content = content;
            this.requestType = requestType;
            this.createdAt = createdAt;
            this.user = user;
        }

        public Long getId() { return id; }
        public String getSubject() { return subject; }
        public String getContent() { return content; }
        public String getRequestType() { return requestType; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public UserSummaryDTO getUser() { return user; }
    }

    public static class UserSummaryDTO {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;

        public UserSummaryDTO(Long id, String firstName, String lastName, String email) {
            this.id = id;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
        }

        public Long getId() { return id; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getEmail() { return email; }
    }
}
