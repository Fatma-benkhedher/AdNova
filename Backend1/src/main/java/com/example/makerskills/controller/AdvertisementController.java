package com.example.makerskills.controller;

import com.example.makerskills.Service.AdvertisementService;
import com.example.makerskills.dto.AdvertisementRequestDTO;
import com.example.makerskills.dto.AdvertisementResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/advertisements")
@RequiredArgsConstructor
public class AdvertisementController {

    private final AdvertisementService advertisementService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AdvertisementResponseDTO>> getUserAds(@PathVariable Long userId) {
        return ResponseEntity.ok(advertisementService.getUserAds(userId));
    }

    // FIXED: Better way to handle optional thumbnail
    @PostMapping(value = "/user/{userId}", consumes = "multipart/form-data")
    public ResponseEntity<AdvertisementResponseDTO> createAd(
            @PathVariable Long userId,
            @RequestParam String name,
            @RequestParam MultipartFile video,
            @RequestParam(required = false) MultipartFile thumbnail
    ) throws IOException {

        System.out.println("Received request - Name: " + name);
        System.out.println("Video received: " + (video != null ? video.getOriginalFilename() : "null"));
        System.out.println("Thumbnail received: " + (thumbnail != null ? thumbnail.getOriginalFilename() + " (" + thumbnail.getSize() + " bytes)" : "null or empty"));

        return ResponseEntity.ok(
                advertisementService.createAdWithUpload(userId, name, video, thumbnail)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdvertisementResponseDTO> getAdvertisement(@PathVariable Long id) {
        return advertisementService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdvertisementResponseDTO> updateAd(
            @PathVariable Long id,
            @RequestBody AdvertisementRequestDTO dto) {
        return ResponseEntity.ok(advertisementService.updateAd(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id) {
        advertisementService.deleteAd(id);
        return ResponseEntity.noContent().build();
    }
}