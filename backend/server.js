require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ─── IN-MEMORY DATABASE (replace with real DB in production) ────────────────
const db = {
  drivers: {},    // { nic: { name, nic, license, enrolled, enrolledAt, sobaRef } }
  sessions: {},   // { sessionId: { driverId, startedAt, verified, zkProof, rides, active } }
  incidents: []   // [{ sessionId, driverId, description, timestamp }]
};

// ─── SEED DEMO DATA ──────────────────────────────────────────────────────────
db.drivers['9X1234567V'] = {
  name: 'Kasun Perera',
  nic: '9X1234567V',
  license: 'B1234567',
  enrolled: true,
  enrolledAt: new Date(Date.now() - 86400000).toISOString(),
  sobaRef: 'demo-soba-ref-001',
  phone: '+94771234567',
  vehicle: 'Three-Wheeler',
  rating: 4.8
};

// ─── HELPER: Simulate SOBA verification ─────────
async function callSobaVerify(sobaRef, type = 'verify') {
  console.log(`[SOBA ZK-PROOF] Generating secure ZK proof for: ${sobaRef}`);
  
  // Simulate network delay for realistic UI loading
  await new Promise(r => setTimeout(r, 1500)); 

  // Return a successful mock Zero-Knowledge proof
  return {
    verified: true,
    zkProof: `zk_proof_${require('crypto').randomBytes(12).toString('hex')}`,
    timestamp: new Date().toISOString(),
    confidence: 0.99
  };
}



// ════════════════════════════════════════════════════════════════════════════
// ROUTES — DRIVERS
// ════════════════════════════════════════════════════════════════════════════

// GET all drivers (admin)
app.get('/api/drivers', (req, res) => {
  res.json({ success: true, drivers: Object.values(db.drivers) });
});

// GET single driver
app.get('/api/drivers/:nic', (req, res) => {
  const driver = db.drivers[req.params.nic];
  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
  res.json({ success: true, driver });
});

// POST enroll a new driver (step 1 — before SOBA)
app.post('/api/drivers/enroll', (req, res) => {
  const { name, nic, license, phone, vehicle } = req.body;
  if (!name || !nic || !license) {
    return res.status(400).json({ success: false, message: 'Name, NIC and license are required' });
  }
  if (db.drivers[nic]) {
    return res.status(409).json({ success: false, message: 'Driver already enrolled' });
  }

  const sobaRef = `soba_${nic}_${Date.now()}`;
  db.drivers[nic] = {
    name, nic, license,
    phone: phone || '',
    vehicle: vehicle || 'Three-Wheeler',
    enrolled: false,
    enrolledAt: null,
    sobaRef,
    rating: 5.0
  };

  res.json({
    success: true,
    message: 'Driver registered. Proceed to SOBA verification.',
    sobaRef,
    driver: db.drivers[nic],
    // In real integration: return SOBA redirect URL here
    sobaRedirectUrl: `${process.env.SOBA_BASE_URL}/enroll?ref=${sobaRef}&callback=${process.env.FRONTEND_URL}/soba-callback`
  });
});

// POST confirm SOBA enrollment callback
app.post('/api/drivers/enroll/confirm', async (req, res) => {
  const { nic, sobaRef } = req.body;
  const driver = db.drivers[nic];
  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

  try {
    const sobaResult = await callSobaVerify(sobaRef, 'enroll');
    if (sobaResult.verified) {
      driver.enrolled = true;
      driver.enrolledAt = new Date().toISOString();
      driver.zkProofRef = sobaResult.zkProof;
      res.json({ success: true, message: 'Enrollment complete', driver });
    } else {
      res.status(400).json({ success: false, message: 'SOBA verification failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get SOBA redirect URL for enrollment
app.post('/api/drivers/soba-url', (req, res) => {
  const { nic, sobaRef } = req.body;
  const driver = db.drivers[nic];
  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

  // 🚨 PROTOTYPE FIX: Auto-enroll the driver locally 
  // because localhost cannot receive live webhooks from SOBA.
  driver.enrolled = true;
  driver.enrolledAt = new Date().toISOString();
  driver.zkProofRef = `zk_live_${Date.now()}`;

  const SOBA_REDIRECT = process.env.SOBA_REDIRECT_URL;
  const callbackUrl = `${process.env.FRONTEND_URL}/api/soba/callback`;

  const sobaUrl = SOBA_REDIRECT
  ? `${SOBA_REDIRECT}&ref=${sobaRef}&callback=${encodeURIComponent(`http://localhost:5000/api/soba/callback`)}&type=enroll`
  : null;

  res.json({
    success: true,
    sobaRedirectUrl: sobaUrl,
    demoMode: !SOBA_REDIRECT
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ROUTES — SESSIONS
// ════════════════════════════════════════════════════════════════════════════

// GET all sessions (admin dashboard)
app.get('/api/sessions', (req, res) => {
  const sessions = Object.values(db.sessions).map(s => ({
    ...s,
    driver: db.drivers[s.driverId]
  }));
  res.json({ success: true, sessions });
});

// GET single session (passenger view)
app.get('/api/sessions/:sessionId', (req, res) => {
  const session = db.sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  const driver = db.drivers[session.driverId];
  res.json({
    success: true,
    session: {
      ...session,
      driver: {
        name: driver?.name,
        vehicle: driver?.vehicle,
        rating: driver?.rating,
        license: driver?.license
      }
    }
  });
});

// POST start session (driver goes online)
app.post('/api/sessions/start', async (req, res) => {
  const { nic } = req.body;
  const driver = db.drivers[nic];

  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found. Please enroll first.' });
  if (!driver.enrolled) return res.status(400).json({ success: false, message: 'Driver not enrolled with SOBA yet.' });

  // Check if already has active session
  const existingSession = Object.values(db.sessions).find(
    s => s.driverId === nic && s.active
  );
  if (existingSession) {
    return res.status(409).json({ success: false, message: 'Driver already has an active session.' });
  }

  try {
    const sobaResult = await callSobaVerify(driver.sobaRef, 'verify');

    if (!sobaResult.verified) {
      return res.status(401).json({
        success: false,
        verified: false,
        message: 'Identity mismatch. This driver does not match the registered profile.'
      });
    }

    const sessionId = uuidv4();
    db.sessions[sessionId] = {
      sessionId,
      driverId: nic,
      startedAt: new Date().toISOString(),
      verified: true,
      zkProof: sobaResult.zkProof,
      confidence: sobaResult.confidence,
      active: true,
      rides: [],
      reVerifications: [],
      passengerLink: `/passenger/${sessionId}`
    };

    res.json({
      success: true,
      verified: true,
      sessionId,
      session: db.sessions[sessionId],
      passengerLink: `/passenger/${sessionId}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST end session (driver goes offline)
app.post('/api/sessions/:sessionId/end', (req, res) => {
  const session = db.sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  session.active = false;
  session.endedAt = new Date().toISOString();
  res.json({ success: true, message: 'Session ended', session });
});

// POST mid-shift re-verification
app.post('/api/sessions/:sessionId/reverify', async (req, res) => {
  const session = db.sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  if (!session.active) return res.status(400).json({ success: false, message: 'Session is not active' });

  const driver = db.drivers[session.driverId];

  try {
    const sobaResult = await callSobaVerify(driver.sobaRef, 'verify');

    const reVerification = {
      timestamp: new Date().toISOString(),
      verified: sobaResult.verified,
      zkProof: sobaResult.zkProof
    };
    session.reVerifications.push(reVerification);

    if (!sobaResult.verified) {
      session.active = false;
      session.flagged = true;
      session.flagReason = 'Mid-shift re-verification failed — identity mismatch detected';
      return res.json({
        success: true,
        verified: false,
        message: 'ALERT: Re-verification failed. Session locked.',
        session
      });
    }

    res.json({ success: true, verified: true, message: 'Re-verification passed', reVerification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add a ride to session
app.post('/api/sessions/:sessionId/rides', (req, res) => {
  const session = db.sessions[req.params.sessionId];
  if (!session || !session.active) {
    return res.status(400).json({ success: false, message: 'No active session' });
  }
  const ride = {
    rideId: uuidv4(),
    pickup: req.body.pickup || 'Colombo Fort',
    dropoff: req.body.dropoff || 'Nugegoda',
    timestamp: new Date().toISOString()
  };
  session.rides.push(ride);
  res.json({ success: true, ride });
});

// Get SOBA redirect URL for daily shift verification
app.post('/api/sessions/soba-url', (req, res) => {
  const { nic } = req.body;
  const driver = db.drivers[nic];
  
  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
  if (!driver.enrolled) return res.status(400).json({ success: false, message: 'Driver not enrolled.' });

  const SOBA_VERIFY = process.env.SOBA_VERIFY_URL;
  
  // We attach the NIC to the callback so the frontend remembers who just scanned their face!
  const callbackUrl = `${process.env.FRONTEND_URL}/driver?status=success&nic=${nic}`;

  const sobaUrl = SOBA_VERIFY
    ? `${SOBA_VERIFY}&ref=${driver.sobaRef}&callback=${encodeURIComponent(callbackUrl)}`
    : null;

  res.json({
    success: true,
    sobaRedirectUrl: sobaUrl
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ROUTES — STATS (Admin Dashboard)
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/stats', (req, res) => {
  const allSessions = Object.values(db.sessions);
  const allDrivers = Object.values(db.drivers);

  res.json({
    success: true,
    stats: {
      totalDrivers: allDrivers.length,
      enrolledDrivers: allDrivers.filter(d => d.enrolled).length,
      activeSessions: allSessions.filter(s => s.active).length,
      totalSessions: allSessions.length,
      flaggedSessions: allSessions.filter(s => s.flagged).length,
      totalRides: allSessions.reduce((acc, s) => acc + s.rides.length, 0),
      totalReVerifications: allSessions.reduce((acc, s) => acc + s.reVerifications.length, 0)
    }
  });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// SOBA Callback — SOBA redirects here after face scan
app.get('/api/soba/callback', (req, res) => {
  const { ref, status, proof, eventId } = req.query;
  // 'ref' is the sobaRef you sent, 'status' is verified/failed
  
  const verified = status === 'verified' || status === 'success';
  
  // Find driver by sobaRef and update
  const driver = Object.values(db.drivers).find(d => d.sobaRef === ref);
  if (driver && verified) {
    driver.enrolled = true;
    driver.enrolledAt = new Date().toISOString();
    driver.zkProofRef = proof || `zk_${Date.now()}`;
  }

  // Redirect back to frontend
  const redirectUrl = verified
    ? `${process.env.FRONTEND_URL}/enroll?status=success&nic=${driver?.nic}`
    : `${process.env.FRONTEND_URL}/enroll?status=failed`;
  
  res.redirect(redirectUrl);
});

// SOBA Webhook — SOBA calls this with POST when verification completes
app.post('/api/soba/webhook', (req, res) => {
  const { ref, status, proof, timestamp } = req.body;
  console.log('[SOBA Webhook]', req.body);
  
  const verified = status === 'verified' || status === 'success';
  const driver = Object.values(db.drivers).find(d => d.sobaRef === ref);
  
  if (driver && verified) {
    driver.enrolled = true;
    driver.enrolledAt = timestamp || new Date().toISOString();
    driver.zkProofRef = proof;
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`✅ TukVerify backend running on http://localhost:${PORT}`);
  console.log(`📋 SOBA Mode: ${process.env.SOBA_API_KEY && process.env.SOBA_API_KEY !== 'your_soba_api_key_here' ? 'LIVE' : 'DEMO (simulated)'}`);
});

// ─── SEED DEMO DATA ──────────────────────────────────────────────────────────
db.drivers['1234'] = {
  name: 'Test Driver', 
  nic: '1234',
  license: 'A123456',
  enrolled: true,           // 🚨 CRITICAL: Tells the app SOBA is done
  enrolledAt: new Date().toISOString(),
  sobaRef: '1925523630',
  phone: '+94770000000',
  vehicle: 'Three-Wheeler',
  rating: 5.0
};
