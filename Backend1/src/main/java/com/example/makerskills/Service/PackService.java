package com.example.makerskills.Service;

import com.example.makerskills.entity.Pack;
import com.example.makerskills.repository.PackRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class PackService {

    private static final String PACK_IMAGE_BUCKET = "pictures";
    /** Folder inside bucket: Storage → pictures → adbot/ */
    private static final String PACK_IMAGE_PREFIX = "adbot/";
    private static final long MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    private final PackRepository packRepository;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    public PackService(PackRepository packRepository) {
        this.packRepository = packRepository;
    }

    public List<Pack> getAllPacks() {
        return packRepository.findAll();
    }

    public Optional<Pack> getPackByUser(Long userId) {
        return packRepository.findByAdvertiserId(userId);
    }

    /**
     * Uploads an image to Supabase Storage ({@code pictures} bucket, path {@code adbot/...})
     * and returns the public object URL.
     */
    public String uploadPackImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Image must be at most 5 MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        String original = file.getOriginalFilename();
        String safe = original != null
                ? original.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "image";
        if (safe.isBlank()) {
            safe = "image";
        }
        String objectPath = PACK_IMAGE_PREFIX + UUID.randomUUID() + "_" + safe;

        URL url = new URL(supabaseUrl + "/storage/v1/object/" + PACK_IMAGE_BUCKET + "/" + objectPath);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setDoOutput(true);
        conn.setRequestMethod("PUT");
        conn.setRequestProperty("Authorization", "Bearer " + supabaseKey);
        conn.setRequestProperty("Content-Type", contentType);
        conn.setFixedLengthStreamingMode(file.getSize());
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(120_000);

        try (InputStream is = file.getInputStream();
             OutputStream os = conn.getOutputStream()) {
            byte[] buffer = new byte[8192];
            int n;
            while ((n = is.read(buffer)) != -1) {
                os.write(buffer, 0, n);
            }
        }

        int code = conn.getResponseCode();
        if (code != 200 && code != 201) {
            InputStream err = conn.getErrorStream();
            String msg = err != null ? new String(err.readAllBytes()) : conn.getResponseMessage();
            throw new IOException("Supabase upload failed (" + code + "): " + msg);
        }

        String base = supabaseUrl.endsWith("/") ? supabaseUrl.substring(0, supabaseUrl.length() - 1) : supabaseUrl;
        return base + "/storage/v1/object/public/" + PACK_IMAGE_BUCKET + "/" + objectPath;
    }
}
