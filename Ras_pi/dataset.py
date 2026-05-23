import os
import time
import threading
import queue
from datetime import datetime
from collections import Counter
import numpy as np
import cv2
from ultralytics import YOLO
from deepface import DeepFace
from dotenv import load_dotenv
from supabase import create_client
import insightface
from insightface.app import FaceAnalysis
# =========================
# CONFIG
# =========================
load_dotenv()

SUPABASE_URL        = "https://ucqwbfvlsstqyxssvwtl.supabase.co"
SUPABASE_KEY        = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcXdiZnZsc3N0cXl4c3N2d3RsIiwi"
    "cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTAwNTgxMSwiZXhwIjoyMDg2NT"
    "gxODExfQ._gPDIxqXx7ovCOAcbBkEj8l6F00kC09NCVhlwKMfVt8"
)
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL ou SUPABASE_KEY manquant dans .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

DATASET_TABLE = "audience_dataset"

SESSION_ID = datetime.utcnow().strftime("session_%Y%m%d_%H%M%S")
CAMERA_ID = "camera_01"
ROI_NAME = "central_zone"

OUTPUT_DIR = "dataset_output"
IMAGES_DIR = os.path.join(OUTPUT_DIR, "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

person_model = YOLO("yolo11n.pt")
face_analyzer = FaceAnalysis(allowed_modules=["detection", "genderage"])
face_analyzer.prepare(ctx_id=0, det_size=(640, 640))

MIN_DWELL_SECONDS = 3
MAX_ANALYSIS_SAMPLES = 6
ANALYSIS_INTERVAL = 0.5
DETECTOR_BACKEND = "mtcnn"
GENDER_CONF_THRESHOLD = 0.0
POST_SAVE_COOLDOWN_SECONDS = 2.0

active_tracks = {}
validated_people = 0
cooldown_until = 0.0

analysis_queue = queue.Queue(maxsize=32)
stop_event = threading.Event()


# =========================
# HELPERS
# =========================
def get_age_category(age: int) -> str:
    if age is None:
        return None
    if age <= 5:
        return "bebe"
    elif age <= 14:
        return "enfant"
    elif age <= 30:
        return "jeune"
    elif age <= 50:
        return "adulte"
    else:
        return "personne_agee"


def normalize_gender(gender: str) -> str:
    if not gender:
        return "Inconnu"

    g = str(gender).strip().lower()

    if g in ["man", "male", "homme"]:
        return "Homme"
    elif g in ["woman", "female", "femme"]:
        return "Femme"
    return "Inconnu"


def normalize_emotion(emotion: str) -> str:
    mapping = {
        "happy": "heureux",
        "sad": "triste",
        "angry": "en_colere",
        "surprise": "surpris",
        "fear": "peur",
        "disgust": "degout",
        "neutral": "neutre"
    }
    return mapping.get(str(emotion).lower(), emotion or "inconnu")


def safe_mean(values):
    vals = [v for v in values if v is not None]
    return int(round(sum(vals) / len(vals))) if vals else None


def most_common_or_none(values):
    vals = [v for v in values if v is not None]
    return Counter(vals).most_common(1)[0][0] if vals else None


def safe_mean_float(values):
    vals = [v for v in values if v is not None]
    return float(round(sum(vals) / len(vals), 4)) if vals else None


def extract_gender_confidence(raw_gender_scores: dict, normalized_gender: str):
    if not isinstance(raw_gender_scores, dict) or not raw_gender_scores:
        return None

    normalized_scores = {}
    for k, v in raw_gender_scores.items():
        try:
            key = str(k).strip().lower()
            normalized_scores[key] = float(v)
        except Exception:
            continue

    if normalized_gender == "Homme":
        possible_keys = ["man", "male", "homme"]
    elif normalized_gender == "Femme":
        possible_keys = ["woman", "female", "femme"]
    else:
        return None

    for key in possible_keys:
        if key in normalized_scores:
            value = normalized_scores[key]
            if value > 1.0:
                value = value / 100.0
            return float(value)

    return None


def save_face_image(face_img, track_id):
    try:
        if face_img is None or face_img.size == 0:
            return None

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"face_{track_id}_{timestamp}.jpg"
        image_path = os.path.join(IMAGES_DIR, filename)

        ok = cv2.imwrite(image_path, face_img)
        if ok:
            print(f"Image saved: {filename}")
            return filename
        else:
            print("Image save failed")
            return None

    except Exception as e:
        print("Image save error:", repr(e))
        return None


def save_to_dataset(
    track_id,
    dwell,
    age_estimated=None,
    age_range=None,
    gender=None,
    gender_confidence=None,
    emotion=None,
    validated=True,
    image_name=None
):
    try:
        data = {
            "track_id": str(track_id),
            "dwell_seconds": float(round(dwell, 2)) if dwell is not None else None,
            "age_estimated": int(age_estimated) if age_estimated is not None else None,
            "age_range": age_range,
            "gender": gender if gender is not None else "Inconnu",
            "gender_confidence": float(gender_confidence) if gender_confidence is not None else None,
            "emotion_estimated": emotion if emotion is not None else "inconnu",
            "created_at": datetime.utcnow().isoformat(),
            "validated": bool(validated),
            "session_id": SESSION_ID,
            "camera_id": CAMERA_ID,
            "roi_name": ROI_NAME,
            "image_name": image_name
        }

        print("DATASET ENVOYEE :", data)
        supabase.table(DATASET_TABLE).insert(data).execute()
        print("Saved to audience_dataset OK")

    except Exception as e:
        print("DATASET DB ERROR:", repr(e))
def preprocess_face_img(img):
    # Increase brightness and contrast
    img = cv2.convertScaleAbs(img, alpha=1.3, beta=20)
    # Sharpen
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    img = cv2.filter2D(img, -1, kernel)
    return img
def analyze_with_deepface(face_img):
    try:
        # Resize keeping aspect ratio with padding
        h, w = face_img.shape[:2]
        scale = 640 / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(face_img, (new_w, new_h))
        canvas = np.zeros((640, 640, 3), dtype=np.uint8)
        canvas[:new_h, :new_w] = resized
        canvas = preprocess_face_img(canvas)

        faces = face_analyzer.get(canvas)

        if not faces:
            print(f"[InsightFace] No face detected — img shape: {canvas.shape}")
            return {"age_estimated": None, "gender": None, "gender_confidence": None, "emotion": None}

        face = faces[0]
        raw_age = int(face.age)
        if raw_age < 30:
            age = max(0, raw_age - 5)
        elif raw_age < 50:
            age = max(0, raw_age - 15)
        else:
            age = max(0, raw_age - 10)
        gender = "Homme" if face.gender >= 0.5 else "Femme"
        gender_confidence = round(float(face.gender) if face.gender >= 0.5 else 1.0 - float(face.gender), 4)

        try:
            face_img_small = cv2.resize(face_img, (224, 224))
            result = DeepFace.analyze(
                img_path=face_img_small,
                actions=["emotion"],
                enforce_detection=False,
                detector_backend="opencv",
                silent=True
            )
            r = result[0] if isinstance(result, list) else result
            emotion = normalize_emotion(r.get("dominant_emotion", "neutre"))
        except Exception:
            emotion = "neutre"

        print(f"[InsightFace] gender={gender} | age={age} | conf={gender_confidence} | emotion={emotion}")

        return {
            "age_estimated": age,
            "gender": gender,
            "gender_confidence": gender_confidence,
            "emotion": emotion
        }

    except Exception as e:
        print("Analysis error:", repr(e))
        return {"age_estimated": None, "gender": None, "gender_confidence": None, "emotion": None}

# =========================
# WORKER THREAD
# =========================
def analysis_worker():
    while not stop_event.is_set():
        try:
            item = analysis_queue.get(timeout=0.2)
        except queue.Empty:
            continue

        if item is None:
            break

        track_id = item["track_id"]
        crop = item["crop"]

        result = analyze_with_deepface(crop)

        track = active_tracks.get(track_id)
        if track is not None:
            if result["age_estimated"] is not None:
                track["age_votes"].append(result["age_estimated"])

            if result["gender"] is not None:
                track["gender_votes"].append(result["gender"])

            if result["gender_confidence"] is not None:
                track["gender_conf_votes"].append(result["gender_confidence"])

            if result["emotion"] is not None:
                track["emotion_votes"].append(result["emotion"])

            final_age = safe_mean(track["age_votes"])
            final_gender = most_common_or_none(track["gender_votes"])
            final_gender_conf = safe_mean_float(track["gender_conf_votes"])
            final_emotion = most_common_or_none(track["emotion_votes"])
            final_age_range = get_age_category(final_age)

            if final_gender in ["Homme", "Femme"]:
                if final_gender_conf is None:
                    final_gender_conf = 0.70
                if final_gender_conf < GENDER_CONF_THRESHOLD:
                    final_gender = "Inconnu"
            else:
                final_gender = "Inconnu"

            track["age_estimated"] = final_age
            track["age_range"] = final_age_range
            track["gender"] = final_gender
            track["gender_confidence"] = final_gender_conf
            track["emotion"] = final_emotion
            track["pending_analysis"] = False

            print(
                f"[Track {track_id}] Votes={len(track['age_votes'])}/{MAX_ANALYSIS_SAMPLES} | "
                f"Age={final_age} | AgeRange={final_age_range} | "
                f"Gender={final_gender} | GenderConf={final_gender_conf} | "
                f"Emotion={final_emotion}"
            )

        analysis_queue.task_done()


worker = threading.Thread(target=analysis_worker, daemon=True)
worker.start()


# =========================
# MAIN LOOP
# =========================
def process_frame(frame):
    global validated_people, cooldown_until, active_tracks

    if frame is None:
        return

    h, w = frame.shape[:2]
    roi_x1 = int(w * 0.3); roi_y1 = int(h * 0.2)
    roi_x2 = int(w * 0.7); roi_y2 = int(h * 0.9)
    now = time.time()

    if now < cooldown_until:
        active_tracks.clear()
        return

    try:
        results = person_model.track(
            source=frame, persist=True, tracker="bytetrack.yaml",
            classes=[0], conf=0.4, verbose=False
        )
    except Exception as e:
        print("YOLO ERROR:", repr(e))
        return

    if not (results and results[0].boxes is not None and results[0].boxes.id is not None):
        return

    boxes = results[0].boxes
    ids   = boxes.id.cpu().numpy().astype(int)
    xyxy  = boxes.xyxy.cpu().numpy()

    for track_id, box in zip(ids, xyxy):
        x1, y1, x2, y2 = map(int, box)
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2

        if not (roi_x1 <= cx <= roi_x2 and roi_y1 <= cy <= roi_y2):
            continue

        if track_id not in active_tracks:
            active_tracks[track_id] = {
                "first_seen": now, "last_seen": now,
                "counted": False, "saved_to_db": False,
                "last_analysis_time": 0.0, "pending_analysis": False,
                "age_votes": [], "gender_votes": [],
                "gender_conf_votes": [], "emotion_votes": [],
                "age_estimated": None, "age_range": None,
                "gender": None, "gender_confidence": None,
                "emotion": None, "last_face_crop": None
            }
        else:
            active_tracks[track_id]["last_seen"] = now

        track = active_tracks[track_id]
        dwell = track["last_seen"] - track["first_seen"]

        # Clean up ghost tracks
        stale_ids = [
            tid for tid, t in active_tracks.items()
            if tid != track_id
            and len(t["age_votes"]) == 0
            and (now - t["first_seen"]) > 8
        ]
        for tid in stale_ids:
            del active_tracks[tid]

        if dwell >= MIN_DWELL_SECONDS and not track["counted"]:
            track["counted"] = True
            validated_people += 1

        enough_time_passed = (now - track["last_analysis_time"]) >= ANALYSIS_INTERVAL
        votes_count = len(track["age_votes"])

        if (track["counted"] and votes_count < MAX_ANALYSIS_SAMPLES
                and enough_time_passed and not track["pending_analysis"]):
            box_w = x2 - x1; box_h = y2 - y1
            head_x1 = max(0, x1 - int(box_w * 0.20))
            head_x2 = min(w, x2 + int(box_w * 0.20))
            head_y1 = max(0, y1 - int(box_h * 0.05))
            head_y2 = min(h, y1 + int(box_h * 0.55))
            head_crop = frame[head_y1:head_y2, head_x1:head_x2]

            if head_crop.size > 0 and head_crop.shape[0] >= 80 and head_crop.shape[1] >= 80:
                track["last_face_crop"] = head_crop.copy()
                try:
                    analysis_queue.put_nowait({"track_id": track_id, "crop": head_crop.copy()})
                    track["pending_analysis"] = True
                    track["last_analysis_time"] = now
                except queue.Full:
                    pass

        if len(track["age_votes"]) >= MAX_ANALYSIS_SAMPLES and not track["saved_to_db"]:
            track["saved_to_db"] = True
            image_name = save_face_image(track["last_face_crop"], track_id)
            save_to_dataset(
                track_id=track_id, dwell=dwell,
                age_estimated=track["age_estimated"], age_range=track["age_range"],
                gender=track["gender"], gender_confidence=track["gender_confidence"],
                emotion=track["emotion"], validated=track["counted"],
                image_name=image_name
            )
            cooldown_until = time.time() + POST_SAVE_COOLDOWN_SECONDS
            active_tracks.clear()
            person_model.predictor = None
            break