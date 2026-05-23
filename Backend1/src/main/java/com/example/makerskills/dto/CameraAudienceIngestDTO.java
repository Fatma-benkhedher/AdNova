package com.example.makerskills.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/**
 * Batch payload from edge camera / IA script (genre, âge, durées, volumétrie) vers {@code ad_statistics}
 * pour l'annonce {@link #adId} — même famille de métriques que les likes (agrégées par jour).
 * Si {@link #adId} est absent : la première publicité ({@code MIN(id)}) est utilisée (mode test rapide).
 */
@Getter
@Setter
public class CameraAudienceIngestDTO {

    private Long adId;

    /** Si absent : date du jour côté serveur. */
    private LocalDate date;

    /** Compteur « Homme » à ajouter (fenêtre depuis le dernier envoi). */
    private int maleCount;

    /** Compteur « Femme ». */
    private int femaleCount;

    /** Genre inconnu / autre. */
    private int otherGenderCount;

    /**
     * 5 valeurs correspondant aux classes âge du modèle (0=Enfant … 4=Senior).
     * Une liste vide ou null = rien à ajouter.
     */
    private List<Integer> ageBandCounts;

    /** Somme des durées de visionnage observées en secondes. */
    private long dwellSecondsTotal;

    /** Nombre d'échantillons de durée (pour la moyenne). */
    private int dwellSamples;

    /**
     * Nombre cumulé d'événements classification (faces × frames ou équivalent).
     * Alimente {@code views} / {@code impressions}.
     */
    private int detectionEvents;

    /**
     * Pic ou moyenne de personnes visibles pendant la fenêtre — alimente typiquement
     * {@code reach} ou {@code airedCount}; ici nous incrémente {@code airedCount}.
     */
    private int concurrentViewers;
}
