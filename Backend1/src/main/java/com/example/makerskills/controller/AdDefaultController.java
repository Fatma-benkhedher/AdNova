package com.example.makerskills.controller;

import com.example.makerskills.Service.AdDefaultService;
import com.example.makerskills.dto.AdDefaultDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/ad-defaults")
@RequiredArgsConstructor
public class AdDefaultController {

    private final AdDefaultService adDefaultService;

    @GetMapping("/current")
    public ResponseEntity<AdDefaultDTO> getCurrent() {
        return adDefaultService.getCurrent()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Multipart: userId (required), optional image + video files from PC,
     * optional imageUrl / videoUrl strings, clearImage / clearVideo (true to remove).
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<AdDefaultDTO> saveMultipart(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false) MultipartFile video,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String videoUrl,
            @RequestParam(required = false, defaultValue = "false") boolean clearImage,
            @RequestParam(required = false, defaultValue = "false") boolean clearVideo
    ) throws IOException {
        AdDefaultDTO dto = adDefaultService.saveOrUpdate(
                userId, image, video, imageUrl, videoUrl, clearImage, clearVideo);
        return ResponseEntity.ok(dto);
    }
}
