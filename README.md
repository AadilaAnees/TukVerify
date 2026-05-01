# 🛺 TukVerify: Biometric Ride-Hailing Security
**Powered by the SOBA Network (Zero-Knowledge Biometric Proofs)**

Closing the identity gap between registered drivers and every ride they take — for any platform, anywhere. 

## 🧠 SOBA Network Integration Architecture
This prototype heavily leverages the **SOBA Network API** to handle all biometric verification and privacy-preserving proofs. 

1. **The Registration Flow (`/verifyHuman`):** When a new driver is added to the system, the backend generates a secure redirect link. SOBA scans the driver's face, generates a unique DID, and returns a Zero-Knowledge (ZK) Proof to the TukVerify backend.
2. **The Verification Flow (`/verify`):** When a returning driver attempts to start a shift ("Go Online"), TukVerify passes their DID to SOBA. SOBA forces a live camera scan to ensure the face matches the DID on file before authorizing the session.
3. **Localhost Webhook Bypass:** *Note for Evaluators:* Because SOBA's production webhooks cannot reach a local development server (`localhost`), this prototype utilizes an auto-enroll bypass right before redirecting to SOBA. This allows the local database to simulate receiving the webhook success signal without requiring ngrok tunneling.

---

## 🚀 Getting Started

To run this demo, you need [Node.js](https://nodejs.org/) installed and a device with a webcam.

### 1. Installation
Clone the repository and install the dependencies for both the frontend and backend.
```bash
# Terminal 1: Backend
cd backend
npm install

# Terminal 2: Frontend
cd frontend
npm install


### 2. Environment Configuration
Create a .env file in the /backend folder. Add the following SOBA Network credentials:

Code snippet
PORT=5000
FRONTEND_URL=http://localhost:5173

# SOBA Network Configurations
SOBA_EVENT_ID=2760001
SOBA_API_KEY=your_provided_api_key_here
SOBA_BASE_URL=https://api.soba.network

# Live SOBA Redirect URLs (changes with the new event credentials)
# (Crucial for the live camera scan)
SOBA_REDIRECT_URL=https://poh.soba.network/verifyHuman?sid=MTE0MDAwMXwyNzYwMDAxfDx1c2VyX2VtYWlsPg%3D%3D&email=test@tukverify.com
SOBA_VERIFY_URL=https://poh.soba.network/verify?sid=MTE0MDAwMXwyNzYwMDAx

### 3. Run the Servers
Start both servers in their respective terminals:

Bash
# Terminal 1
cd backend
npm start

# Terminal 2
cd frontend
npm run dev


🧪 Interactive Demo Flow
Follow these exact steps to test the biometric integration from start to finish.

Phase 1: Biometric Enrollment (The First Scan)

Open the web app at http://localhost:5173.

Navigate to + Enroll Driver.

Fill out the form with dummy data (e.g., Name: John Doe, NIC: 9999).

Click Continue to SOBA Verification, then click Launch SOBA Face Verification.

You will be redirected to the live SOBA network. Allow camera access and complete the face scan.

Once completed, manually navigate back to http://localhost:5173/driver.



Phase 2: The Daily Shift (The Liveness Check)

On the Driver Session page, enter the NIC you just registered (9999).

Click Start SOBA Verification & Go Online.

You will be briefly redirected to SOBA to verify your face matches the enrolled DID.

Upon success, you will instantly return to the TukVerify dashboard showing a Live, Verified Session.

Phase 3: The Passenger Experience
On the active driver dashboard, click the Open Passenger View button.

This simulates the passenger's mobile view. You will see the green trust badge, the driver's details, and the raw ZK Proof reference confirming a human was verified.

Phase 4: Admin Oversight
Click Admin View in the sidebar.

View platform-wide statistics, active sessions, and the cryptographic proofs flowing through the system.

### 4. Open the app
Visit `http://localhost:5173`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  TUKVERIFY PLATFORM                     │
├──────────────────┬──────────────────┬───────────────────┤
│  React Frontend  │  Node.js Backend │  SOBA Network     │
│  (Vite + React   │  (Express API)   │  (ZK Biometric)   │
│   Router)        │                  │                   │
│                  │  /api/drivers    │  Face enrollment  │
│  - Dashboard     │  /api/sessions   │  Face verify      │
│  - Enroll        │  /api/stats      │  ZK proof gen     │
│  - Driver Login  │                  │  Liveness check   │
│  - Passenger     │  In-memory DB    │                   │
│  - Admin         │  (→ replace with │  Zero data stored │
│                  │   Firebase/Mongo)│  on any server    │
└──────────────────┴──────────────────┴───────────────────┘
```


## 📁 Project Structure

```
tukverify/
├── backend/
│   ├── server.js          # Express API + all routes
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx         # Routing
    │   ├── api.js          # API helper
    │   ├── index.css       # Design system
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   └── pages/
    │       ├── Dashboard.jsx    # Overview + stats
    │       ├── EnrollPage.jsx   # Driver enrollment + SOBA
    │       ├── DriverPage.jsx   # Session start (Go Online)
    │       ├── PassengerPage.jsx # Passenger trust badge
    │       └── AdminPage.jsx    # Platform admin view
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 💡 Key Features

TukVerify is a middleware SaaS layer designed to integrate with existing ride-hailing platforms (PickMe, Uber, inDrive) to enforce continuous identity verification.

**Zero-Knowledge Biometric Enrollment:** Drivers enroll their face using SOBA. No raw face data is ever stored on TukVerify or platform servers, ensuring full PDPA 2022 compliance.

**Pre-Shift Liveness Detection:** Before accepting rides, drivers must pass a 3-second liveness face scan.

**Decentralized Identity (DID) Binding:** Every driver is issued a unique DID linked to their National Identity Card (NIC).

**Real-Time Passenger Trust Badge:** Passengers receive a live link displaying a cryptographic timestamp proving the driver was biometrically verified for that specific shift.

**Immutable Incident Accountability:** Complaints and incidents are bound to a verified human via a ZK Proof, preventing bad actors from simply switching accounts.

---


## 🛠️ Tech Stack
*   **Frontend:** React.js (Vite), React Router
*   **Backend:** Node.js, Express.js
*   **Biometrics:** SOBA Network (ZK Proofs, Liveness Detection)
*   **Database:** In-memory local storage (Prototype phase)


🧠 Developer Note: SOBA ZK-Biometric Integration
TukVerify leverages the SOBA Network API to handle all facial biometrics via Zero-Knowledge (ZK) proofs. This architecture ensures that no raw facial data is ever transmitted to or stored on our servers—we only store a cryptographic reference (DID) confirming a successful liveness check and identity match.

⚠️ Localhost Testing Caveat:
In a full production environment, SOBA utilizes secure server-to-server Webhooks to silently update a driver's enrollment status in our database. Because this prototype runs on a local development server (localhost) that cannot receive external webhooks, the codebase includes a temporary "auto-enroll bypass" right before the SOBA redirect. This allows evaluators to test the live camera flow and application business logic end-to-end without needing to configure tunneling tools like ngrok.