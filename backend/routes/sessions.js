const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Session = require('../models/Session');
const soba = require('../services/soba');
const { v4: uuidv4 } = require('uuid');

// GET all sessions (admin)
router.get('/', async (req, res) => {
  try {
    // Populate driver info by matching driverId (which is nic) to the Driver model's nic field
    // Mongoose populate usually uses _id, but here driverId stores the string 'nic'
    // To keep it simple, we fetch all drivers and map them
    const sessions = await Session.find().sort({ startedAt: -1 }).lean();
    const driverNics = sessions.map(s => s.driverId);
    const drivers = await Driver.find({ nic: { $in: driverNics } }).lean();
    
    const driverMap = {};
    drivers.forEach(d => driverMap[d.nic] = d);
    
    const sessionsWithDrivers = sessions.map(s => ({
      ...s,
      driver: driverMap[s.driverId] || null
    }));

    res.json({ success: true, sessions: sessionsWithDrivers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single session (passenger view)
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId }).lean();
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const driver = await Driver.findOne({ nic: session.driverId }).lean();
    res.json({
      success: true,
      session: {
        ...session,
        driver: driver ? {
          name: driver.name,
          vehicle: driver.vehicle,
          rating: driver.rating,
          license: driver.license,
          totalRides: driver.totalRides
        } : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Start a session after SOBA verification
router.post('/start', async (req, res) => {
  try {
    const { nic, sobaVerified } = req.body;
    const driver = await Driver.findOne({ nic });

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found. Please enroll first.' });
    if (!driver.enrolled) return res.status(400).json({ success: false, message: 'Driver not enrolled with SOBA yet.' });

    const existing = await Session.findOne({ driverId: nic, active: true });
    if (existing) return res.status(409).json({ success: false, message: 'Driver already has an active session.' });

    const zkResult = soba.generateMockZkProof();

    if (soba.isSobaConfigured() && sobaVerified === false) {
      return res.status(401).json({
        success: false,
        verified: false,
        message: 'SOBA identity check failed. Face did not match registered profile.'
      });
    }

    const sessionId = uuidv4();
    const session = await Session.create({
      sessionId,
      driverId: nic,
      zkProof: zkResult.zkProof,
      confidence: zkResult.confidence,
      active: true,
      verified: true
    });

    console.log(`[SESSION START] Driver ${nic} → Session ${session.sessionId}`);

    res.json({
      success: true,
      verified: true,
      sessionId: session.sessionId,
      session,
      passengerLink: `/passenger/${session.sessionId}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — End session
router.post('/:sessionId/end', async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { sessionId: req.params.sessionId, active: true },
      { active: false, endedAt: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Active session not found' });
    res.json({ success: true, message: 'Session ended', session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Mid-shift re-verification
router.post('/:sessionId/reverify', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (!session.active) return res.status(400).json({ success: false, message: 'Session not active' });

    const zkResult = soba.generateMockZkProof();
    const rv = { timestamp: new Date(), verified: zkResult.verified, zkProof: zkResult.zkProof };
    
    session.reVerifications.push(rv);
    
    if (!zkResult.verified) {
      session.active = false;
      session.flagged = true;
      session.flagReason = 'Mid-shift re-verification failed — identity mismatch detected';
    }
    
    await session.save();

    res.json({
      success: true,
      verified: zkResult.verified,
      message: zkResult.verified ? 'Re-verification passed ✅' : '🚨 ALERT: Identity mismatch! Session locked.',
      reVerification: rv
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Add a ride to session
router.post('/:sessionId/rides', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId, active: true });
    if (!session) return res.status(400).json({ success: false, message: 'No active session found' });
    
    const ride = {
      rideId: uuidv4(),
      pickup: req.body.pickup || 'Colombo Fort',
      dropoff: req.body.dropoff || 'Nugegoda',
      timestamp: new Date()
    };
    
    session.rides.push(ride);
    await session.save();
    
    // Also increment driver's total rides
    await Driver.findOneAndUpdate(
      { nic: session.driverId },
      { $inc: { totalRides: 1 } }
    );

    res.json({ success: true, ride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
