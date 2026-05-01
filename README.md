# 🛺 TukVerify — Biometric Ride-Hailing Security

> A middleware SaaS layer that closes the identity gap between registered drivers and every ride they take — for any platform, anywhere.

Powered by the **SOBA Network** (Zero-Knowledge Biometric Proofs), TukVerify integrates with existing ride-hailing platforms (PickMe, Uber, inDrive) to enforce continuous, privacy-preserving identity verification.

---

## 📋 Table of Contents

- [Features](#-key-features)
- [Architecture](#️-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Demo Walkthrough](#-interactive-demo-walkthrough)
- [SOBA Network Integration](#-soba-network-integration)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **ZK Biometric Enrollment** | Drivers enroll their face via SOBA. No raw face data is ever stored on TukVerify servers — full PDPA 2022 compliance. |
| **Pre-Shift Liveness Detection** | Before accepting rides, drivers must pass a 3-second liveness face scan. |
| **Decentralized Identity (DID) Binding** | Every driver is issued a unique DID linked to their National Identity Card (NIC). |
| **Passenger Trust Badge** | Passengers see a real-time cryptographic timestamp proving the driver was biometrically verified for that specific shift. |
| **Immutable Incident Accountability** | Complaints are bound to a verified human via a ZK Proof, preventing bad actors from switching accounts. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TUKVERIFY PLATFORM                      │
├──────────────────┬──────────────────┬───────────────────────┤
│  React Frontend  │  Node.js Backend │     SOBA Network       │
│  (Vite + React   │  (Express API)   │   (ZK Biometric)       │
│   Router)        │                  │                        │
│                  │  /api/drivers    │  • Face enrollment     │
│  • Dashboard     │  /api/sessions   │  • Face verification   │
│  • Enroll Driver │  /api/stats      │  • ZK proof generation │
│  • Driver Login  │                  │  • Liveness detection  │
│  • Passenger View│  In-memory DB    │                        │
│  • Admin View    │  (→ Firebase/    │  Zero raw data stored  │
│                  │     MongoDB)     │    on any server       │
└──────────────────┴──────────────────┴───────────────────────┘
```

**Registration Flow (`/verifyHuman`):** When a driver enrolls, the backend generates a secure redirect to SOBA. SOBA scans the driver's face, generates a unique DID, and returns a Zero-Knowledge Proof to TukVerify.

**Verification Flow (`/verify`):** When a driver goes online, TukVerify passes their DID to SOBA. SOBA forces a live camera scan to confirm the face matches the enrolled DID before authorizing the session.

---

## 📁 Project Structure

```
tukverify/
├── backend/
│   ├── server.js           # Express API + all route handlers
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx             # Routing
        ├── api.js              # API helper / fetch wrapper
        ├── index.css           # Design system / global styles
        ├── components/
        │   └── Sidebar.jsx
        └── pages/
            ├── Dashboard.jsx       # Overview + platform stats
            ├── EnrollPage.jsx      # Driver enrollment + SOBA redirect
            ├── DriverPage.jsx      # Session start ("Go Online")
            ├── PassengerPage.jsx   # Passenger trust badge view
            └── AdminPage.jsx       # Platform admin oversight
```

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), React Router
- **Backend:** Node.js, Express.js
- **Biometrics:** SOBA Network — ZK Proofs & Liveness Detection
- **Database:** In-memory (prototype) → replace with Firebase or MongoDB for production

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- A device with a **webcam**

### 1. Install Dependencies

Run these in two separate terminals:

```bash
# Terminal 1 — Backend
cd backend
npm install

# Terminal 2 — Frontend
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file inside the `/backend` folder:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# SOBA Network Credentials
SOBA_EVENT_ID=2760001
SOBA_API_KEY=your_provided_api_key_here
SOBA_BASE_URL=https://api.soba.network

# SOBA Redirect URLs (update when event credentials change)
SOBA_REDIRECT_URL=https://poh.soba.network/verifyHuman?sid=MTE0MDAwMXwyNzYwMDAxfDx1c2VyX2VtYWlsPg%3D%3D&email=test@tukverify.com
SOBA_VERIFY_URL=https://poh.soba.network/verify?sid=MTE0MDAwMXwyNzYwMDAx
```

### 3. Start the Servers

```bash
# Terminal 1 — Backend
cd backend
npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### 4. Open the App

Visit **[http://localhost:5173](http://localhost:5173)**

---

## 🧪 Interactive Demo Walkthrough

### Phase 1 — Biometric Enrollment (First Scan)

1. Open the app at `http://localhost:5173`
2. Navigate to **+ Enroll Driver**
3. Fill out the form with any dummy data (e.g. Name: `John Doe`, NIC: `9999`)
4. Click **Continue to SOBA Verification**, then **Launch SOBA Face Verification**
5. You'll be redirected to the live SOBA network — allow camera access and complete the face scan
6. Once done, manually navigate back to `http://localhost:5173/driver`

### Phase 2 — Daily Shift (Liveness Check)

1. On the Driver Session page, enter the NIC you registered (e.g. `9999`)
2. Click **Start SOBA Verification & Go Online**
3. SOBA briefly redirects you to verify your face matches the enrolled DID
4. On success, the dashboard shows a **Live, Verified Session**

### Phase 3 — Passenger Experience

1. From the active driver dashboard, click **Open Passenger View**
2. This simulates the passenger's mobile view — showing the green trust badge, driver details, and a ZK Proof reference confirming a verified human is driving

### Phase 4 — Admin Oversight

1. Click **Admin View** in the sidebar
2. View platform-wide stats, active sessions, and the cryptographic proofs flowing through the system

---

## 🧠 SOBA Network Integration

TukVerify uses the SOBA Network API for all facial biometrics via Zero-Knowledge proofs. No raw facial data is ever transmitted to or stored on TukVerify servers — only a cryptographic DID reference confirming a successful liveness check.

### ⚠️ Localhost Testing Note

In production, SOBA uses server-to-server webhooks to silently update a driver's enrollment status. Because `localhost` cannot receive external webhooks, this prototype includes a temporary **auto-enroll bypass** that fires right before the SOBA redirect — letting evaluators test the full camera flow and business logic without needing to configure tunneling tools like `ngrok`.

---

## 📄 License

This project is a prototype built for demonstration purposes.
