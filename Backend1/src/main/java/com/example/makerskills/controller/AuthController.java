package com.example.makerskills.controller;

import com.example.makerskills.Service.AdvertiserDeletionService;
import com.example.makerskills.Service.EmailService;
import com.example.makerskills.Service.OperatorDeletionService;
import com.example.makerskills.dto.*;
import com.example.makerskills.entity.Pack;
import com.example.makerskills.entity.PasswordResetToken;
import com.example.makerskills.entity.SignupApprovalToken;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.PackRepository;
import com.example.makerskills.repository.PasswordResetTokenRepository;
import com.example.makerskills.repository.SignupApprovalTokenRepository;
import com.example.makerskills.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AdvertiserDeletionService advertiserDeletionService;
    private final OperatorDeletionService operatorDeletionService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PackRepository packRepository;
    private final EmailService emailService;
    private final SignupApprovalTokenRepository signupApprovalTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request == null || !StringUtils.hasText(request.getEmail()) || !StringUtils.hasText(request.getPassword())) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }
        if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() == null ? "advertiser" : request.getRole());
        user.setCompanyName(request.getCompanyName());
        // If admin approval is requested (operator signup), account starts disabled.
        user.setApproved(!request.isRequiresAdminApproval());
        userRepository.save(user);

        if ("advertiser".equalsIgnoreCase(user.getRole()) && request.getPackId() != null) {
            packRepository.findById(request.getPackId()).ifPresent(pack -> {
                pack.getAdvertisers().add(user);
                packRepository.save(pack);
            });
        }

        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " +
                (user.getLastName() == null ? "" : user.getLastName())).trim();
        if (fullName.isBlank()) fullName = user.getEmail();

        // For operator signups, only admin approval email matters (no email to the new operator yet).
        if (request.isRequiresAdminApproval()) {
            String rawToken = generateResetToken(); // reuse generator (url-safe)
            String hash = sha256(rawToken);
            SignupApprovalToken token = SignupApprovalToken.builder()
                    .user(user)
                    .tokenHash(hash)
                    .expiresAt(LocalDateTime.now().plusDays(2))
                    .build();
            signupApprovalTokenRepository.save(token);

            String approveUrl = "http://localhost:8081/api/auth/approvals/approve?token=" + rawToken;
            String rejectUrl = "http://localhost:8081/api/auth/approvals/reject?token=" + rawToken;
            emailService.sendAdminApprovalRequest(user.getEmail(), fullName, user.getRole(), approveUrl, rejectUrl);
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body("Account created. Waiting for admin approval.");
        }

        // For normal accounts (e.g. advertisers created by operator), send welcome email to the created user.
        if ("advertiser".equalsIgnoreCase(user.getRole())) {
            emailService.sendAdvertiserWelcomeWithCredentials(
                    user.getEmail(),
                    fullName,
                    user.getEmail(),
                    request.getPassword()
            );
        } else {
            emailService.sendWelcome(user.getEmail(), fullName, user.getRole());
        }

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmailIgnoreCase(request.getEmail())
                .map(user -> {
                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        if (!user.isApproved()) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                    .body("Account pending admin approval.");
                        }
                        return ResponseEntity.ok(new LoginResponse(
                                "Login successful",
                                user.getId(),
                                user.getFirstName(),
                                user.getLastName(),
                                user.getEmail(),
                                user.getRole()));
                    }
                    return ResponseEntity.badRequest().body("Invalid password");
                })
                .orElse(ResponseEntity.badRequest().body("User not found"));
    }

    // ---------------- ADMIN APPROVAL LINKS ----------------
    @GetMapping("/approvals/approve")
    @Transactional
    public ResponseEntity<String> approve(@RequestParam String token) {
        String hash = sha256(token.trim());
        SignupApprovalToken t = signupApprovalTokenRepository
                .findByTokenHashAndDecidedAtIsNullAndExpiresAtAfter(hash, LocalDateTime.now())
                .orElse(null);
        if (t == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token.");
        User u = t.getUser();
        u.setApproved(true);
        t.setDecision("approve");
        t.setDecidedAt(LocalDateTime.now());
        userRepository.save(u);
        signupApprovalTokenRepository.save(t);
        // Notify the user that their account is now active (best-effort).
        String fullName = ((u.getFirstName() == null ? "" : u.getFirstName()) + " " +
                (u.getLastName() == null ? "" : u.getLastName())).trim();
        if (fullName.isBlank()) fullName = u.getEmail();
        emailService.sendWelcome(u.getEmail(), fullName, u.getRole());
        return ResponseEntity.ok("Approved. User can now login.");
    }

    @GetMapping("/approvals/reject")
    @Transactional
    public ResponseEntity<String> reject(@RequestParam String token) {
        String hash = sha256(token.trim());
        SignupApprovalToken t = signupApprovalTokenRepository
                .findByTokenHashAndDecidedAtIsNullAndExpiresAtAfter(hash, LocalDateTime.now())
                .orElse(null);
        if (t == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token.");
        User u = t.getUser();
        u.setApproved(false);
        t.setDecision("reject");
        t.setDecidedAt(LocalDateTime.now());
        userRepository.save(u);
        signupApprovalTokenRepository.save(t);
        return ResponseEntity.ok("Rejected. User remains disabled.");
    }

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request == null || !StringUtils.hasText(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email is required.");
        }
        String normalizedEmail = request.getEmail().trim();
        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser_Id(user.getId());
            String otp = generatePasswordResetOtp();
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(sha256(otp));
            token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
            PasswordResetToken saved = passwordResetTokenRepository.save(token);
            if (!emailService.sendPasswordResetOtpEmail(user.getEmail(), otp)) {
                passwordResetTokenRepository.deleteById(saved.getId());
            }
        });
        return ResponseEntity.ok(Map.of("message", "If this email exists, reset instructions were generated."));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody ValidateResetCodeRequest body) {
        if (body == null || !StringUtils.hasText(body.getEmail()) || !StringUtils.hasText(body.getCode())) {
            return ResponseEntity.badRequest().body("Email and verification code are required.");
        }
        String code = body.getCode().trim().replaceAll("\\s+", "");
        if (!code.matches("\\d{6}")) {
            return ResponseEntity.badRequest().body("Enter the 6-digit code from your email.");
        }
        String hash = sha256(code);
        LocalDateTime now = LocalDateTime.now();
        String emailLower = body.getEmail().trim().toLowerCase(Locale.ROOT);
        Optional<PasswordResetToken> ot = passwordResetTokenRepository.findActiveByEmailLowerAndTokenHash(
                emailLower, hash, now);
        if (ot.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid code or expired. Request a new one.");
        }
        long expiresInMinutes = Math.max(0, java.time.Duration.between(now, ot.get().getExpiresAt()).toMinutes());
        return ResponseEntity.ok(Map.of("valid", true, "expiresInMinutes", expiresInMinutes));
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request == null || !StringUtils.hasText(request.getToken()) || !StringUtils.hasText(request.getNewPassword())) {
            return ResponseEntity.badRequest().body("Code (or token) and newPassword are required.");
        }
        if (StringUtils.hasText(request.getConfirmPassword())
                && !request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Password and confirmation do not match.");
        }
        if (request.getNewPassword().length() < 8) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters.");
        }

        String rawToken = request.getToken().trim().replaceAll("\\s+", "");
        String tokenHash = sha256(rawToken);
        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken resetToken;

        if (looksLikeSixDigitOtp(rawToken)) {
            if (!StringUtils.hasText(request.getEmail())) {
                return ResponseEntity.badRequest().body("Email is required with your 6-digit code.");
            }
            String emailLower = request.getEmail().trim().toLowerCase(Locale.ROOT);
            resetToken = passwordResetTokenRepository
                    .findActiveByEmailLowerAndTokenHash(emailLower, tokenHash, now)
                    .orElse(null);
        } else {
            resetToken = passwordResetTokenRepository
                    .findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(tokenHash, now)
                    .orElse(null);
        }

        if (resetToken == null) return ResponseEntity.badRequest().body("Invalid or expired reset code.");

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        resetToken.setUsedAt(LocalDateTime.now());
        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);
        passwordResetTokenRepository.deleteByUsedAtIsNotNullOrExpiresAtBefore(LocalDateTime.now());
        return ResponseEntity.ok("Password reset successful.");
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody ProfileUpdateRequest updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    if (updatedUser.getFirstName() != null) user.setFirstName(updatedUser.getFirstName());
                    if (updatedUser.getLastName() != null) user.setLastName(updatedUser.getLastName());
                    if (updatedUser.getEmail() != null) user.setEmail(updatedUser.getEmail());
                    if (updatedUser.getPhone() != null) user.setPhone(updatedUser.getPhone());
                    if (updatedUser.getCountryCode() != null) user.setCountryCode(updatedUser.getCountryCode());
                    if (updatedUser.getPostalCode() != null) user.setPostalCode(updatedUser.getPostalCode());
                    if (updatedUser.getCity() != null) user.setCity(updatedUser.getCity());
                    if (updatedUser.getCompanyName() != null) user.setCompanyName(updatedUser.getCompanyName());
                    if (updatedUser.getImageUrl() != null) user.setImageUrl(updatedUser.getImageUrl());
                    userRepository.save(user);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<User> getProfile(@PathVariable Long id) {
        return userRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/advertisers")
    public List<User> getAdvertisers() {
        return userRepository.findByRoleIgnoreCase("advertiser");
    }

    @DeleteMapping("/advertisers/{id}")
    public ResponseEntity<?> deleteAdvertiser(@PathVariable Long id) {
        advertiserDeletionService.deleteAdvertiserById(id);
        return ResponseEntity.ok("Advertiser deleted");
    }

    @DeleteMapping("/operator/{id}")
    public ResponseEntity<?> deleteOperator(@PathVariable Long id) {
        operatorDeletionService.deleteOperatorById(id);
        return ResponseEntity.ok("Operator deleted");
    }

    @PostMapping("/profile/{id}/image")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("Le fichier d'image est vide.");
        return userRepository.findById(id).map(user -> {
            try {
                String uploadDir = "uploads/profile-images";
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
                String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "image.png"));
                String ext = "";
                int dotIndex = originalFilename.lastIndexOf('.');
                if (dotIndex >= 0) ext = originalFilename.substring(dotIndex);
                String filename = "user-" + id + "-" + System.currentTimeMillis() + ext;
                Path target = uploadPath.resolve(filename);
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
                user.setImageUrl("/uploads/profile-images/" + filename);
                userRepository.save(user);
                return ResponseEntity.ok(user);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur lors de l'enregistrement de l'image de profil.");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    private String generateResetToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** 6-digit numeric OTP for password reset (distinct from signup URL tokens). */
    private String generatePasswordResetOtp() {
        int n = secureRandom.nextInt(900000) + 100000;
        return Integer.toString(n);
    }

    private static boolean looksLikeSixDigitOtp(String raw) {
        return raw.matches("\\d{6}");
    }

    private String sha256(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
