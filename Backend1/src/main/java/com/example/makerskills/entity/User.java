package com.example.makerskills.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    private String role;

    /**
     * Admin approval gate (used for operator signup security).
     * Defaults to false; admin must approve before the account can be used.
     */
    @Column(name = "approved", nullable = true)
    private Boolean approved;

    public boolean isApproved() {
        return Boolean.TRUE.equals(approved);
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    // --- Secondary / optional fields for profile ---
    private String phone;          // Phone number
    private String countryCode;    // Country code for phone
    private String postalCode;     // Postal code
    private String city;           // City
    private String companyName;    // Company name (for advertisers)
    private String imageUrl;       // Profile image URL
}