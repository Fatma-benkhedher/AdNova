package com.example.makerskills.dto;

public class LoginResponse {

    private String message;
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;

    public LoginResponse(String message, Long id, String firstName,
                         String lastName, String email, String role) {
        this.message = message;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
    }

    public String getMessage() { return message; }
    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}