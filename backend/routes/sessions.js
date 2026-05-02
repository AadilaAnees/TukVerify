// routes/sessions.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const soba = require('../services/soba');

// GET all sessions (admin)
router.get('/', (req, res) => {
  res.json({ success: true, sessions: db.getAllSessions() });
});

// GET single session (passenger view)
router.get('/:sessionId', (req, res) => {
  const session = db.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  const driver = db.getDriver(session.driverId);
  res.json({
    success: true,
    session: {
      ...session,
      driver: {
        name: driver?.name,
        vehicle: driver?.vehicle,
        rating: driver?.rating,
        license: driver?.license,
        totalRides: driver?.totalRides
      }
    }
  });
});

// POST — Start a session after SOBA verification
// Called either:
//   (a) After SOBA redirects back (real mode) — frontend passes nic + sobaVerified=true
//   (b) Directly in demo mode — backend simulates ZK proof
router.post('/start', async (req, res) => {
  const { nic, sobaVerified } = req.body;
  const driver = db.getDriver(nic);

  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found. Please enroll first.' });
  if (!driver.enrolled) return res.status(400).json({ success: false, message: 'Driver not enrolled with SOBA yet.' });

  const existing = db.getActiveSession(nic);
  if (existing) return res.status(409).json({ success: false, message: 'Driver already has an active session.' });

  // If SOBA redirect confirmed identity (sobaVerified=true from callback),
  // OR in demo mode — generate ZK proof
  const zkResult = soba.generateMockZkProof();

  // In production with SOBA configured and sobaVerified is explicitly false, reject
  if (soba.isSobaConfigured() && sobaVerified === false) {
    return res.status(401).json({
      success: false,
      verified: false,
      message: 'SOBA identity check failed. Face did not match registered profile.'
    });
  }

  const session = db.createSession(nic, zkResult.zkProof, zkResult.confidence);
  console.log(`[SESSION START] Driver ${nic} → Session ${session.sessionId}`);

  res.json({
    success: true,
    verified: true,
    sessionId: session.sessionId,
    session,
    passengerLink: `/passenger/${session.sessionId}`
  });
});

// POST — End session
router.post('/:sessionId/end', (req, res) => {
  const session = db.endSession(req.params.sessionId);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  res.json({ success: true, message: 'Session ended', session });
});

// POST — Mid-shift re-verification
router.post('/:sessionId/reverify', async (req, res) => {
  const session = db.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  if (!session.active) return res.status(400).json({ success: false, message: 'Session not active' });

  // In demo mode — always passes. In production, check SOBA callback result.
  const zkResult = soba.generateMockZkProof();
  const rv = db.addReVerification(req.params.sessionId, zkResult.verified, zkResult.zkProof);

  res.json({
    success: true,
    verified: zkResult.verified,
    message: zkResult.verified ? 'Re-verification passed ✅' : '🚨 ALERT: Identity mismatch! Session locked.',
    reVerification: rv
  });
});

// POST — Add a ride to session
router.post('/:sessionId/rides', (req, res) => {
  const ride = db.addRide(req.params.sessionId, req.body.pickup, req.body.dropoff);
  if (!ride) return res.status(400).json({ success: false, message: 'No active session found' });
  res.json({ success: true, ride });
});

module.exports = router;
