package com.example.makerskills.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    // Champs principaux modifiables dans le profil (après inscription)
    private String firstName;
    private String lastName;
    private String email;

    // Champs secondaires modifiables après connexion
    private String phone;
    private String countryCode;
    private String postalCode;
    private String city;
    private String companyName;
    private String imageUrl;
}

