#!/usr/bin/env python3
"""
Ad Player Server — Flask backend
Optimisé pour Android 16 (client) + Windows/Linux (serveur)
"""
 
import os
import time
import threading
import numpy as np
import psutil
import cv2
import requests
import dataset
from datetime import datetime, timedelta
from flask import Flask, jsonify, send_file, request, Response
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
 
# ── Config ───────────────────────────────────────────────────────────────────
SUPABASE_URL        = "https://ucqwbfvlsstqyxssvwtl.supabase.co"
SUPABASE_KEY        = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjcXdiZnZsc3N0cXl4c3N2d3RsIiwi"
    "cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTAwNTgxMSwiZXhwIjoyMDg2NT"
    "gxODExfQ._gPDIxqXx7ovCOAcbBkEj8l6F00kC09NCVhlwKMfVt8"
)
BUCKET_NAME         = "videos"
SCREEN_UUID         = "41a1c070-ec0f-46d4-9191-e8cc6160fff7"
LOCAL_PATH          = r"C:\ads\current_ad.mp4"
PLAY_DURATION_SEC   = 120   # 2 minutes
POLL_INTERVAL_SEC   = 5
STATUS_INTERVAL_SEC = 60
FRAME_RATE_SEC      = 0.05  # camera stream ~20 fps
 
HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}
 
# ── App & shared state ────────────────────────────────────────────────────────
app         = Flask(__name__)
state_lock  = threading.Lock()
frame_lock  = threading.Lock()
 
last_video   = None          # filename currently cached
play_until   = None          # datetime when the ad window expires
latest_frame = None          # most recent camera frame (numpy array)
 
# ── HTTP session with retry ───────────────────────────────────────────────────
_session = requests.Session()
_retry   = Retry(
    total=5,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504],
    allowed_methods=["GET", "PATCH"],
)
_session.mount("https://", HTTPAdapter(max_retries=_retry))
_session.mount("http://",  HTTPAdapter(max_retries=_retry))
 
 
# ── Supabase helpers ─────────────────────────────────────────────────────────
 
def _patch_calendar(calendar_id: str, status: str) -> None:
    """PATCH a single calendar row's status field."""
    try:
        r = _session.patch(
            f"{SUPABASE_URL}/rest/v1/calendar?id=eq.{calendar_id}",
            headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
            json={"status": status},
            timeout=10,
        )
        print(f"[CALENDAR] {calendar_id} → {status} ({r.status_code})")
    except Exception as exc:
        print(f"[CALENDAR ERROR] {exc}")
 
 
def mark_calendar_airing(calendar_id: str) -> None:
    _patch_calendar(calendar_id, "airing")
 
 
def mark_calendar_aired(calendar_id: str) -> None:
    _patch_calendar(calendar_id, "aired")
 
 
def get_current_scheduled_video():
    """
    Return (video_url, calendar_id) for the ad scheduled right now,
    or (None, None) if nothing matches.
    """
    now          = datetime.now()
    today        = now.strftime("%Y-%m-%d")
    time_now     = now.strftime("%H:%M:%S")
    window_start = (now - timedelta(minutes=2)).strftime("%H:%M:%S")
 
    query = (
        f"{SUPABASE_URL}/rest/v1/calendar"
        f"?select=id,day,time,status,ad_id,advertisements!inner(id,video_url)"
        f"&screen_id=eq.{SCREEN_UUID}"
        f"&day=eq.{today}"
        f"&time=gte.{window_start}"
        f"&time=lte.{time_now}"
        f"&status=in.(scheduled,airing)"
        f"&order=time.desc"
        f"&limit=1"
    )
    try:
        r = _session.get(query, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data:
                row       = data[0]
                video_url = row.get("advertisements", {}).get("video_url")
                cal_id    = row.get("id")
                print(f"[SCHEDULER] Matched id={cal_id} day={row['day']} time={row['time']} now={time_now}")
                return video_url, cal_id
            print(f"[SCHEDULER] No match — screen={SCREEN_UUID} day={today} time={time_now}")
        else:
            print(f"[SCHEDULER ERROR] {r.status_code}: {r.text}")
    except Exception as exc:
        print(f"[SCHEDULER EXCEPTION] {exc}")
 
    return None, None
 
 
# ── Video download ────────────────────────────────────────────────────────────
 
def download_video(video_name: str) -> bool:
    url = (
        f"{SUPABASE_URL}/storage/v1/object/public"
        f"/{BUCKET_NAME}/adbot/zoneA/{video_name}"
    )
    try:
        r = _session.get(url, timeout=60)
        if r.status_code != 200:
            print(f"[DOWNLOAD ERROR] HTTP {r.status_code}")
            return False
        os.makedirs(os.path.dirname(LOCAL_PATH), exist_ok=True)
        tmp = LOCAL_PATH + ".tmp"
        with open(tmp, "wb") as f:
            f.write(r.content)
        os.replace(tmp, LOCAL_PATH)
        print(f"[DOWNLOAD] Saved → {LOCAL_PATH}")
        return True
    except Exception as exc:
        print(f"[DOWNLOAD EXCEPTION] {exc}")
        return False
 
 
# ── Scheduler threads ─────────────────────────────────────────────────────────
 
def _apply_new_video(video_name: str, calendar_id: str, old_calendar_id) -> str:
    """Download the video, update state, update Supabase. Returns new calendar_id."""
    if download_video(video_name):
        if old_calendar_id and old_calendar_id != calendar_id:
            mark_calendar_aired(old_calendar_id)
        with state_lock:
            global last_video, play_until
            last_video = video_name
            play_until = datetime.now() + timedelta(seconds=PLAY_DURATION_SEC)
        mark_calendar_airing(calendar_id)
        print(f"[PLAYER] Now playing: {video_name}  until {play_until.strftime('%H:%M:%S')}")
        return calendar_id
    return old_calendar_id
 
 
def check_loop_once() -> None:
    """Called once at startup to load any currently-scheduled ad."""
    video_url, calendar_id = get_current_scheduled_video()
    if video_url:
        video_name = os.path.basename(video_url)
        _apply_new_video(video_name, calendar_id, None)
    else:
        print("[INIT] No ad scheduled right now.")
 
 
def check_loop() -> None:
    """Background thread: polls Supabase every POLL_INTERVAL_SEC seconds."""
    global last_video, play_until
    last_calendar_id = None
 
    while True:
        try:
            video_url, calendar_id = get_current_scheduled_video()
 
            if video_url:
                video_name = os.path.basename(video_url)
 
                if video_name != last_video:
                    last_calendar_id = _apply_new_video(video_name, calendar_id, last_calendar_id)
                else:
                    with state_lock:
                        expired = play_until and datetime.now() > play_until
 
                    if expired:
                        print(f"[SCHEDULER] Window expired for {video_name} → marking aired")
                        if last_calendar_id:
                            mark_calendar_aired(last_calendar_id)
                            last_calendar_id = None
                    else:
                        print(f"[SCHEDULER] Still playing: {video_name}")
            else:
                print(f"[SCHEDULER] No ad at {datetime.now().strftime('%H:%M:%S')}")
 
        except Exception as exc:
            print(f"[LOOP ERROR] {exc}")
            time.sleep(10)
 
        time.sleep(POLL_INTERVAL_SEC)
 
 
# ── CPU / temperature status sender ──────────────────────────────────────────
 
def send_laptop_status() -> None:
    while True:
        try:
            cpu    = psutil.cpu_percent(interval=1)
            temp   = round(40 + (cpu / 100) * 50, 1)
            r = requests.patch(
                f"{SUPABASE_URL}/rest/v1/screens?id=eq.{SCREEN_UUID}",
                headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
                json={"temperature-carte": temp},
                timeout=10,
            )
            print(f"[CPU] {cpu:.0f}% → ~{temp}°C → Supabase {r.status_code}")
        except Exception as exc:
            print(f"[TEMP ERROR] {exc}")
        time.sleep(STATUS_INTERVAL_SEC)
 
 
# ── Flask routes ──────────────────────────────────────────────────────────────
 
@app.route("/")
def home():
    return open("player.html", encoding="utf-8").read()
 
 
@app.route("/video")
def serve_video():
    if not os.path.exists(LOCAL_PATH):
        return "No video", 404
    resp = send_file(LOCAL_PATH, mimetype="video/mp4", conditional=True)
    resp.headers.update({
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma":        "no-cache",
        "Expires":       "0",
        # Android 16: allow range requests for seeking
        "Accept-Ranges": "bytes",
    })
    return resp
 
 
@app.route("/latest_video")
def latest_video_route():
    with state_lock:
        video   = last_video
        p_until = play_until
 
    now = datetime.now()
 
    if not video or not os.path.exists(LOCAL_PATH):
        return jsonify({"status": "no_video"})
 
    if p_until and now > p_until:
        return jsonify({"status": "stop"})
 
    seconds_left = int((p_until - now).total_seconds()) if p_until else 0
    return jsonify({
        "status":      "ok",
        "video":       video,
        "play_until":  p_until.isoformat() if p_until else None,
        "seconds_left": seconds_left,
    })
 
 
@app.route("/upload_frame", methods=["POST"])
def upload_frame():
    global latest_frame
    try:
        file  = request.files["frame"]
        npimg = np.frombuffer(file.read(), np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        with frame_lock:
            latest_frame = frame

        # Feed frame to audience analysis (non-blocking)
        threading.Thread(target=dataset.process_frame, args=(frame.copy(),), daemon=True).start()

        return "ok"
    except Exception as exc:
        print(f"[FRAME ERROR] {exc}")
        return "error", 500
 
emoji_until = None
emoji_lock = threading.Lock()

import uuid

heart_event = {"id": None, "until": None}
smile_event = {"id": None, "until": None}
dislike_event = {"id": None, "until": None}
@app.route("/trigger_smile", methods=["POST"])
def trigger_smile():
    global smile_event
    smile_event["id"] = str(uuid.uuid4())
    smile_event["until"] = datetime.now() + timedelta(seconds=10)
    return jsonify({"ok": True})

@app.route("/smile_status")
def smile_status():
    global smile_event
    if smile_event["until"] and datetime.now() < smile_event["until"]:
        return jsonify({"active": True, "id": smile_event["id"]})
    return jsonify({"active": False})

@app.route("/trigger_dislike", methods=["POST"])
def trigger_dislike():
    global dislike_event
    dislike_event["id"] = str(uuid.uuid4())
    dislike_event["until"] = datetime.now() + timedelta(seconds=10)
    return jsonify({"ok": True})

@app.route("/dislike_status")
def dislike_status():
    global dislike_event
    if dislike_event["until"] and datetime.now() < dislike_event["until"]:
        return jsonify({"active": True, "id": dislike_event["id"]})
    return jsonify({"active": False})
@app.route("/trigger_heart", methods=["POST"])
def trigger_heart():
    global heart_event
    heart_event["id"] = str(uuid.uuid4())
    heart_event["until"] = datetime.now() + timedelta(seconds=10)
    return jsonify({"ok": True})

@app.route("/heart_status")
def heart_status():
    global heart_event
    if heart_event["until"] and datetime.now() < heart_event["until"]:
        return jsonify({
            "active": True,
            "id": heart_event["id"]
        })
    return jsonify({"active": False})
def _generate_stream():
    blank = np.zeros((480, 640, 3), dtype=np.uint8)  # black frame
    cv2.putText(blank, "Waiting for camera...", (150, 240),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255,255,255), 2)
    
    while True:
        with frame_lock:
            frame = latest_frame.copy() if latest_frame is not None else blank

        ret, buf = cv2.imencode(".jpg", frame)
        if ret:
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n"
        time.sleep(FRAME_RATE_SEC)
 
 
@app.route("/camera_stream")
def camera_stream():
    return Response(_generate_stream(), mimetype="multipart/x-mixed-replace; boundary=frame")
 
 
@app.route("/update_status", methods=["POST"])
def update_status():
    try:
        data = request.get_json(force=True)
        print(f"[STATUS] {data}")
        payload = {
            k: data.get(k)
            for k in ("pourcentage_batterie", "temperature-carte")
        }
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/screens?id=eq.{SCREEN_UUID}",
            headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
            json=payload,
            timeout=10,
        )
        print(f"[SUPABASE] {r.status_code}")
        return jsonify({"ok": True})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
 

@app.route("/debug_calendar")
def debug_calendar():
    now   = datetime.now()
    today = now.strftime("%Y-%m-%d")
 
    all_today = _session.get(
        f"{SUPABASE_URL}/rest/v1/calendar"
        f"?select=id,day,time,status,screen_id,ad_id,advertisements!inner(id,video_url)"
        f"&day=eq.{today}&order=time.asc&limit=20",
        headers=HEADERS, timeout=10,
    ).json()
 
    screen_rows = _session.get(
        f"{SUPABASE_URL}/rest/v1/calendar"
        f"?select=id,day,time,status,screen_id,ad_id"
        f"&day=eq.{today}&screen_id=eq.{SCREEN_UUID}&order=time.asc&limit=20",
        headers=HEADERS, timeout=10,
    ).json()
 
    return jsonify({
        "server_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "screen_uuid": SCREEN_UUID,
        "all_today":   all_today,
        "screen_rows": screen_rows,
    })
 
 
@app.route("/set_video/<video_name>")
def set_video(video_name):
    ok = download_video(video_name)
    return jsonify({"status": "ok" if ok else "error"})
 
 
@app.route("/manifest.json")
def manifest():
    return send_file("manifest.json", mimetype="application/manifest+json")
 
@app.route('/videodefault.mp4')
def serve_default_video():
    return send_file('videodefault.mp4', mimetype='video/mp4')
@app.route("/icon.png")
def icon():
    if os.path.exists("icon.png"):
        return send_file("icon.png", mimetype="image/png")
    return "", 204
@app.route("/default.jpg")
def default_image():
    return send_file("default.jpg", mimetype="image/jpg")
@app.route("/sw.js")
def sw():
    js = "self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));"
    return js, 200, {"Content-Type": "application/javascript"}
@app.route("/cert.crt")
def serve_cert():
    return send_file("cert.crt", mimetype="application/x-x509-ca-cert")
 
 
# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    check_loop_once()
    threading.Thread(target=check_loop,          daemon=True).start()
    threading.Thread(target=send_laptop_status,  daemon=True).start()
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False,
        threaded=True,
        ssl_context=("cert.pem", "key.pem"),
    )