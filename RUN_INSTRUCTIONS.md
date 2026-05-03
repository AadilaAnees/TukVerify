# 🚀 TukVerify — Run Instructions

Welcome to the TukVerify demo! You have two ways to evaluate this project: using our live hosted version (easiest) or running it locally.

## Option 1: Live Demo (Recommended)

We have fully deployed the project to Vercel and MongoDB Atlas. You do not need to install anything.

1. **Visit the Live App:** `[Insert Your Vercel Link Here - e.g., https://tuk-verify.vercel.app]`
2. **Navigate to `+ Enroll Driver`** and register a new identity.
3. **Important:** You *must* enter a real email address you have access to, as the SOBA Network requires email verification during the face scan.
4. Follow the SOBA face-scan prompts. 
5. Return to the Driver Session page, enter your NIC, and verify your face to go online!

---

## Option 2: Run Locally

If you prefer to run the code on your own machine, follow these simple steps.

### Prerequisites
- Node.js installed
- A webcam (for the SOBA liveness check)

### 1. Install & Start

Open two separate terminals in the project folder:

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

### 2. View the App
Open your browser and navigate to: **http://localhost:5173**

*(Note: The `.env` variables for our MongoDB Atlas and SOBA Network are already included in the repository for your convenience. You do not need to configure any databases or API keys to test the local build.)*
