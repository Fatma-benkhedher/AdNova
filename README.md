# 🤖 Smart Advertising Robot – AI-Powered Interactive Mall Display

## 📌 Overview

The **Smart Advertising Robot** is an academic project developed at **ESPRIT University** in collaboration with **MakerSkills**.  
It is an autonomous robotic advertising system designed for shopping malls, capable of:

- Moving inside a mall environment
- Displaying targeted advertisements on a screen
- Interacting with users in real time
- Collecting behavioral analytics using AI vision
- Providing live statistics to a cloud dashboard

---

## 🎯 Key Features

### 🧭 Autonomous Robot Movement
- Navigates inside indoor environments (mall)
- Designed to position itself in high-traffic areas

### 📺 Dynamic Advertisement System
- Displays scheduled video ads
- Remote ad scheduling via backend (Supabase)
- Real-time ad switching

### 👥 User Interaction System
- Touch/Buttons:
  - 👍 Like
  - ❤️ Love
  - 👎 Dislike
- QR Code redirection to startup/website
- Instant feedback collection

### 📊 AI Audience Analytics
Using computer vision:

- Detects number of viewers
- Tracks dwell time (attention duration)
- Estimates:
  - Age group 👶🧑👨‍🦳
  - Gender
  - Emotion (happy, neutral, etc.)
- Real-time dataset generation

---

## 🧠 System Architecture
Robot (Raspberry Pi 5)
│
├── Camera Stream (OpenCV)
├── AI Processing (YOLO + DeepFace + InsightFace)
├── Flask Local Server
│
▼
Backend (Cloud)
│
├── Supabase Database (PostgreSQL)
├── Storage (Video Ads)
├── Scheduling System
│
▼
Frontend
├── React Web Dashboard
└── React Native Mobile App 

---

## 🔁 Communication Flow

- Robot pulls scheduled ads from Supabase
- Downloads and plays video locally
- Sends:
  - Frames → `/upload_frame`
  - System status → `/update_status`
  - User reactions → `/trigger_like`, `/trigger_dislike`, `/trigger_heart`
- Backend stores analytics in real time

---

## 🧪 AI Pipeline

1. Person Detection → YOLOv8 / YOLO11  
2. Multi-Object Tracking → ByteTrack  
3. Face Analysis → InsightFace  
4. Emotion Detection → DeepFace  
5. Data Storage → Supabase  

---

## 🛠️ Tech Stack

### 🧠 Embedded System
- Raspberry Pi 5
- Python 3
- OpenCV
- Flask
- psutil

### 🤖 AI / Computer Vision
- Ultralytics YOLO
- DeepFace
- InsightFace
- NumPy

### 🌐 Backend
- Flask API
- Supabase (PostgreSQL + Storage)
- REST APIs

### 📱 Frontend
- React.js (Web Dashboard)
- React Native (Mobile App)

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/video` | Stream current advertisement |
| `/camera_stream` | Live camera feed |
| `/upload_frame` | Send camera frames for AI analysis |
| `/update_status` | Send system health metrics |
| `/trigger_like` | Like interaction |
| `/trigger_dislike` | Dislike interaction |
| `/trigger_heart` | Love interaction |
| `/latest_video` | Current playing ad info |

---
