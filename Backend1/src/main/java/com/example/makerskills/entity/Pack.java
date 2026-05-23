package com.example.makerskills.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "packs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_name", nullable = false, length = 255)
    private String packageName;

    @Column(nullable = false)
    private Integer duration; // duration in days

    @Column(name = "total_video_plays", nullable = false)
    private Integer totalVideoPlays;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Public URL of pack cover image (Supabase Storage: bucket pictures, path adbot/...). */
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @ManyToMany
    @JoinTable(
            name = "pack_advertisers",
            joinColumns = @JoinColumn(name = "pack_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> advertisers = new HashSet<>();
}


