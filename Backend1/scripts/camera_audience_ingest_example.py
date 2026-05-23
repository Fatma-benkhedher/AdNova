# -*- coding: utf-8 -*-
"""
Complément à ton script OpenCV / TensorFlow : envoie les agrégats (genre, âge, durée,
nombre de personnes…) vers la table PostgreSQL « ad_statistics » via le backend Spring.

Configurer :
  BACKEND=http://localhost:8081/api
  AD_ID=<id réel dans la base>   (GET /api/advertisements/user/{userId})
  AUDIENCE_INGEST_API_KEY=       (optionnel, si défini dans application.properties)

Dépendance : pip install requests
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import requests

BACKEND_ROOT = os.environ.get("BACKEND", "http://localhost:8081/api").rstrip("/")
POST_URL = f"{BACKEND_ROOT}/ads/statistics/camera-batch"
AD_ID = int(os.environ.get("AD_ID", "1"))
AUDIENCE_KEY = os.environ.get("AUDIENCE_INGEST_API_KEY", "").strip()


@dataclass
class BatchAccum:
    male: int = 0
    female: int = 0
    other_gender: int = 0
    age_band: List[int] = field(default_factory=lambda: [0, 0, 0, 0, 0])
    dwell_seconds_total: float = 0.0
    dwell_samples: int = 0
    detection_events: int = 0
    concurrent_peak: int = 0

    def reset(self) -> None:
        self.male = self.female = self.other_gender = 0
        self.age_band = [0, 0, 0, 0, 0]
        self.dwell_seconds_total = 0.0
        self.dwell_samples = 0
        self.detection_events = 0
        self.concurrent_peak = 0


def push_batch(acc: BatchAccum) -> None:
    payload: Dict[str, Any] = {
        "adId": AD_ID,
        "maleCount": acc.male,
        "femaleCount": acc.female,
        "otherGenderCount": acc.other_gender,
        "ageBandCounts": acc.age_band.copy(),
        "dwellSecondsTotal": int(acc.dwell_seconds_total),
        "dwellSamples": acc.dwell_samples,
        "detectionEvents": acc.detection_events,
        "concurrentViewers": max(acc.concurrent_peak, 0),
    }
    headers = {"Content-Type": "application/json"}
    if AUDIENCE_KEY:
        headers["X-Audience-Ingest-Key"] = AUDIENCE_KEY
    resp = requests.post(POST_URL, json=payload, headers=headers, timeout=15)
    if not resp.ok:
        raise RuntimeError(f"Ingest HTTP {resp.status_code}: {resp.text}")


def map_gender(gender_label: str) -> str:
    g = (gender_label or "").strip().lower()
    if g.startswith("homm") or g == "male" or g == "m":
        return "male"
    if g.startswith("femm") or g == "female" or g == "f":
        return "female"
    return "other"


# --- Intégration dans ta boucle : appeler acc.* à chaque face, puis flush périodique ---
#
# BATCH_INTERVAL_SEC = 5.0
# acc = BatchAccum()
# next_flush = time.time() + BATCH_INTERVAL_SEC
# while True:
#     ...
#     num_faces = len(faces)
#     acc.concurrent_peak = max(acc.concurrent_peak, num_faces)
#
#     for (x,y,w,h) in faces:
#         acc.detection_events += 1
#         ... preds ...
#         g = map_gender(gender)
#         if g == "male": acc.male += 1
#         elif g == "female": acc.female += 1
#         else: acc.other_gender += 1
#         ai = correct_age_bias(age_pred)
#         if 0 <= ai < 5:
#             acc.age_band[ai] += 1
#         acc.dwell_seconds_total += float(duration_seconds)
#         acc.dwell_samples += 1
#
#     if time.time() >= next_flush:
#         push_batch(acc)
#         acc.reset()
#         next_flush = time.time() + BATCH_INTERVAL_SEC

if __name__ == "__main__":
    demo = BatchAccum()
    demo.male, demo.female = 2, 1
    demo.age_band = [0, 1, 3, 0, 0]
    demo.detection_events = 12
    demo.dwell_seconds_total = 45
    demo.dwell_samples = 3
    demo.concurrent_peak = 2
    print("POST →", POST_URL, "payload test")
    push_batch(demo)
    print("OK")
