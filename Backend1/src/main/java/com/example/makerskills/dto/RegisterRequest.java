package com.example.makerskills.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String role;
    private String companyName;
    private Long packId;
    private boolean requiresAdminApproval;
}
