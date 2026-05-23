package com.example.makerskills.controller;

import com.example.makerskills.Service.PackService;
import com.example.makerskills.entity.Pack;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.PackRepository;
import com.example.makerskills.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/packs")
public class PackController {
    private final PackService packService;
    private final PackRepository packRepository;
    private final UserRepository userRepository;

    public PackController(PackService packService, PackRepository packRepository, UserRepository userRepository) {
        this.packService = packService;
        this.packRepository = packRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Pack> getAllPacks() {
        return packRepository.findAll();
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPackImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = packService.uploadPackImage(file);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<Pack> createPack(@Valid @RequestBody CreatePackRequest request) {
        Pack pack = new Pack();
        pack.setPackageName(request.packageName());
        pack.setDuration(request.duration());
        pack.setTotalVideoPlays(request.totalVideoPlays());
        pack.setDescription(request.description());
        pack.setImageUrl(request.imageUrl());

        Pack saved = packRepository.save(pack);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pack> updatePack(@PathVariable Long id,
                                           @Valid @RequestBody CreatePackRequest request) {
        return packRepository.findById(id)
                .map(existing -> {
                    existing.setPackageName(request.packageName());
                    existing.setDuration(request.duration());
                    existing.setTotalVideoPlays(request.totalVideoPlays());
                    existing.setDescription(request.description());
                    existing.setImageUrl(request.imageUrl());
                    Pack saved = packRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.badRequest().build());
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<Pack> getPackByUser(@PathVariable Long userId) {
        return packService.getPackByUser(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePack(@PathVariable Long id) {
        try {
            packRepository.deleteById(id);
        } catch (Exception ignored) {
            // On ignore si l'ID n'existe pas déjà
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{packId}/assign/{userId}")
    public ResponseEntity<Pack> assignAdvertiserToPack(@PathVariable Long packId,
                                                       @PathVariable Long userId) {
        Pack pack = packRepository.findById(packId).orElse(null);
        if (pack == null) {
            return ResponseEntity.badRequest().build();
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        if (!"advertiser".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.badRequest().build();
        }

        pack.getAdvertisers().add(user);
        Pack saved = packRepository.save(pack);
        return ResponseEntity.ok(saved);
    }

    public record CreatePackRequest(
            @NotBlank String packageName,
            @NotNull @Min(1) Integer duration,
            @NotNull @Min(0) Integer totalVideoPlays,
            String description,
            String imageUrl
    ) {}
}

