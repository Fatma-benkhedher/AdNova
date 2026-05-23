package com.example.makerskills.Service;

import com.example.makerskills.dto.AdvertisementRequestDTO;
import com.example.makerskills.dto.AdvertisementResponseDTO;
import com.example.makerskills.entity.Advertisement;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.AdvertisementRepository;
import com.example.makerskills.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdvertisementService {

    private final AdvertisementRepository advertisementRepository;
    private final UserRepository userRepository;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private static final String VIDEO_BUCKET = "videos";
    private static final String PICTURE_BUCKET = "pictures";

    private static final String VIDEO_FOLDER = "adbot/zoneA/";
    private static final String PICTURE_FOLDER = "adbot/";

    // =========================================================================
    // CREATE
    // =========================================================================
    public AdvertisementResponseDTO createAdWithUpload(
            Long userId,
            String name,
            MultipartFile video,
            MultipartFile thumbnail
    ) throws IOException {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (video == null || video.isEmpty()) throw new IllegalArgumentException("Video file is required");
        if (!video.getContentType().startsWith("video/")) throw new IllegalArgumentException("Only video files are allowed");

        // ── Build structured filename: advertiserName_date_originalFilename ──
        String advertiserName = sanitize(user.getFirstName());
        String date = java.time.LocalDate.now().toString(); // "2025-01-30"

        String videoFileName  = advertiserName + "_" + date + "_" + sanitize(video.getOriginalFilename());
        String videoPath      = VIDEO_FOLDER + videoFileName;
        uploadToSupabase(VIDEO_BUCKET, videoPath, video);

        String thumbnailPath = null;
        if (thumbnail != null && !thumbnail.isEmpty()) {
            String thumbFileName = advertiserName + "_" + date + "_" + sanitize(thumbnail.getOriginalFilename());
            thumbnailPath        = PICTURE_FOLDER + thumbFileName;
            uploadToSupabase(PICTURE_BUCKET, thumbnailPath, thumbnail);
        }

        Advertisement ad = Advertisement.builder()
                .name(name)
                .videoUrl(videoPath)
                .thumbnailUrl(thumbnailPath)
                .status("Approved")
                .submittedAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .user(user)
                .build();

        advertisementRepository.save(ad);
        return mapToDTO(ad);
    }

    // =========================================================================
    // READ
    // =========================================================================
    public List<AdvertisementResponseDTO> getUserAds(Long userId) {
        return advertisementRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Optional<AdvertisementResponseDTO> findById(Long id) {
        return advertisementRepository.findById(id).map(this::mapToDTO);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================
    public AdvertisementResponseDTO updateAd(Long id, AdvertisementRequestDTO dto) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Advertisement not found"));

        if (dto.getName() != null) ad.setName(dto.getName());
        if (dto.getStatus() != null) ad.setStatus(dto.getStatus());
        ad.setUpdatedAt(OffsetDateTime.now());

        advertisementRepository.save(ad);
        return mapToDTO(ad);
    }

    // =========================================================================
    // DELETE
    // =========================================================================
    public void deleteAd(Long id) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Advertisement not found"));

        if (ad.getVideoUrl() != null) {
            deleteFromSupabase(VIDEO_BUCKET, ad.getVideoUrl());
        }
        if (ad.getThumbnailUrl() != null) {
            deleteFromSupabase(PICTURE_BUCKET, ad.getThumbnailUrl());
        }

        advertisementRepository.delete(ad);
    }

    // =========================================================================
    // SUPABASE HELPERS
    // =========================================================================
    private void uploadToSupabase(String bucket, String storagePath, MultipartFile file)
            throws IOException {

        String endpoint = supabaseUrl + "/storage/v1/object/" + bucket + "/" + storagePath;
        HttpURLConnection conn = openConnection(endpoint, "PUT");
        conn.setRequestProperty("Content-Type",
                file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        conn.setFixedLengthStreamingMode(file.getSize());

        try (InputStream is = file.getInputStream();
             OutputStream os = conn.getOutputStream()) {
            byte[] buf = new byte[8192];
            int read;
            while ((read = is.read(buf)) != -1) {
                os.write(buf, 0, read);
            }
            os.flush();
        }

        int code = conn.getResponseCode();
        if (code != 200 && code != 201) {
            String msg = conn.getResponseMessage();
            InputStream err = conn.getErrorStream();
            if (err != null) msg = new String(err.readAllBytes());
            throw new RuntimeException("Upload failed [" + code + "] " + bucket + "/" + storagePath + ": " + msg);
        }

        System.out.println("✅ Uploaded successfully: " + bucket + "/" + storagePath);
    }

    private void deleteFromSupabase(String bucket, String storagePath) {
        try {
            String endpoint = supabaseUrl + "/storage/v1/object/" + bucket + "/" + storagePath;
            HttpURLConnection conn = openConnection(endpoint, "DELETE");
            conn.getResponseCode();
        } catch (Exception e) {
            System.err.println("Warning: Failed to delete " + storagePath);
        }
    }

    private HttpURLConnection openConnection(String endpoint, String method) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(endpoint).openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("Authorization", "Bearer " + supabaseKey);
        conn.setDoOutput(!method.equals("DELETE"));
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(300_000);
        return conn;
    }

    // =========================================================================
    // DTO MAPPING
    // =========================================================================
    private AdvertisementResponseDTO mapToDTO(Advertisement ad) {
        AdvertisementResponseDTO dto = new AdvertisementResponseDTO();
        dto.setId(ad.getId());
        dto.setName(ad.getName());
        dto.setStatus(ad.getStatus());
        dto.setSubmittedAt(ad.getSubmittedAt());
        dto.setUpdatedAt(ad.getUpdatedAt());
        dto.setVideoUrl(toPublicUrl(VIDEO_BUCKET, ad.getVideoUrl()));
        dto.setThumbnailUrl(toPublicUrl(PICTURE_BUCKET, ad.getThumbnailUrl()));
        dto.setLikeCount(ad.getLikeCount());
        dto.setDislikeCount(ad.getDislikeCount());
        dto.setLoveCount(ad.getLoveCount());
        return dto;
    }

    private String toPublicUrl(String bucket, String path) {
        if (path == null) return null;
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
    }

    private String sanitize(String filename) {
        if (filename == null || filename.trim().isEmpty()) return "file";
        String safe = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        return safe.length() > 120 ? safe.substring(0, 120) : safe;
    }
}