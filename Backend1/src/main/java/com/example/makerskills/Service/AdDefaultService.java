package com.example.makerskills.Service;

import com.example.makerskills.dto.AdDefaultDTO;
import com.example.makerskills.entity.AdDefault;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.AdDefaultRepository;
import com.example.makerskills.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdDefaultService {

    /** Supabase bucket {@code videos} — same tree as other ads: {@code adbot/addefault/…}. */
    private static final String VIDEO_PREFIX = "adbot/addefault/";
    /** Soft cap only; avoids accidental huge uploads. */
    private static final long MAX_VIDEO_BYTES = 500L * 1024 * 1024;

    private final AdDefaultRepository repository;
    private final UserRepository userRepository;
    private final PackService packService;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    public Optional<AdDefaultDTO> getCurrent() {
        return repository.findFirstByOrderByIdAsc().map(this::toDto);
    }

    @Transactional
    public AdDefaultDTO saveOrUpdate(
            Long userId,
            MultipartFile imageFile,
            MultipartFile videoFile,
            String imageUrlParam,
            String videoUrlParam,
            boolean clearImage,
            boolean clearVideo
    ) throws IOException {
        AdDefault entity = repository.findFirstByOrderByIdAsc().orElseGet(() ->
                AdDefault.builder()
                        .day(AdDefault.GLOBAL_PLACEHOLDER_DAY)
                        .slotTime(AdDefault.GLOBAL_PLACEHOLDER_TIME)
                        .build());

        if (entity.getDay() == null) {
            entity.setDay(AdDefault.GLOBAL_PLACEHOLDER_DAY);
        }
        if (entity.getSlotTime() == null) {
            entity.setSlotTime(AdDefault.GLOBAL_PLACEHOLDER_TIME);
        }

        if (clearImage) {
            entity.setImageUrl(null);
        } else if (imageFile != null && !imageFile.isEmpty()) {
            entity.setImageUrl(packService.uploadPackImage(imageFile));
        } else if (imageUrlParam != null && !imageUrlParam.isBlank()) {
            entity.setImageUrl(imageUrlParam.trim());
        }

        if (clearVideo) {
            entity.setVideoUrl(null);
        } else if (videoFile != null && !videoFile.isEmpty()) {
            entity.setVideoUrl(uploadVideoToSupabase(videoFile));
        } else if (videoUrlParam != null && !videoUrlParam.isBlank()) {
            entity.setVideoUrl(videoUrlParam.trim());
        }

        if (userId != null) {
            entity.setUser(userRepository.findById(userId).orElse(null));
        }
        return toDto(repository.save(entity));
    }

    private String uploadVideoToSupabase(MultipartFile video) throws IOException {
        if (video.getSize() > MAX_VIDEO_BYTES) {
            throw new IllegalArgumentException("File is too large (max 500 MB).");
        }
        String ct = video.getContentType();
        if (ct == null || ct.isBlank()) {
            ct = "application/octet-stream";
        }

        String original = video.getOriginalFilename();
        String safe = original != null ? original.replaceAll("[^a-zA-Z0-9._-]", "_") : "clip";
        if (safe.isBlank()) {
            safe = "clip";
        }
        String fileName = VIDEO_PREFIX + System.currentTimeMillis() + "_" + safe;

        URL url = new URL(supabaseUrl + "/storage/v1/object/videos/" + fileName);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setDoOutput(true);
        conn.setRequestMethod("PUT");
        conn.setRequestProperty("Authorization", "Bearer " + supabaseKey);
        conn.setRequestProperty("Content-Type", ct);
        conn.setFixedLengthStreamingMode(video.getSize());
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(300_000);

        try (InputStream is = video.getInputStream();
             OutputStream os = conn.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int n;
            while ((n = is.read(buffer)) != -1) {
                os.write(buffer, 0, n);
            }
        }

        int responseCode = conn.getResponseCode();
        if (responseCode != 200 && responseCode != 201) {
            InputStream err = conn.getErrorStream();
            String msg = err != null ? new String(err.readAllBytes()) : conn.getResponseMessage();
            throw new IOException("Video upload failed (" + responseCode + "): " + msg);
        }

        String base = supabaseUrl.endsWith("/") ? supabaseUrl.substring(0, supabaseUrl.length() - 1) : supabaseUrl;
        return base + "/storage/v1/object/public/videos/" + fileName;
    }

    private AdDefaultDTO toDto(AdDefault e) {
        String display = null;
        Long uid = null;
        if (e.getUser() != null) {
            uid = e.getUser().getId();
            User u = e.getUser();
            if (u.getFirstName() != null || u.getLastName() != null) {
                display = ((u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
            }
            if (display == null || display.isBlank()) {
                display = u.getEmail();
            }
        }
        return AdDefaultDTO.builder()
                .id(e.getId())
                .imageUrl(e.getImageUrl())
                .videoUrl(e.getVideoUrl())
                .userId(uid)
                .userDisplayName(display)
                .build();
    }
}
