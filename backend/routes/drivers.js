const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const soba = require('../services/soba');

// GET all drivers
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json({ success: true, drivers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single driver by NIC
router.get('/:nic', async (req, res) => {
  try {
    const driver = await Driver.findOne({ nic: req.params.nic });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Step 1: Register driver details
router.post('/enroll', async (req, res) => {
  try {
    const { name, nic, license, email, phone, vehicle } = req.body;

    if (!name || !nic || !license || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, NIC, License and Email are required'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email required for SOBA registration' });
    }

    let driver = await Driver.findOne({ nic });
    if (driver) {
      return res.status(409).json({ success: false, message: 'Driver already enrolled' });
    }

    driver = await Driver.create({
      name, nic, license, email, phone, vehicle,
      enrolled: false
    });

    const callbackUrl = `${process.env.FRONTEND_URL}/soba-callback?type=register&nic=${nic}`;
    const sobaUrl = soba.buildRegistrationUrl(email, callbackUrl);

    console.log(`[ENROLL] Driver ${name} (${nic}) → SOBA URL: ${sobaUrl}`);

    // 🚨 PROTOTYPE BYPASS: Auto-enroll locally because live webhooks 
    // cannot reach your localhost computer to confirm the scan.
    driver.enrolled = true;
    driver.enrolledAt = new Date();
    driver.sobaRegistrationId = `bypass_${Date.now()}`;
    await driver.save();

    res.json({
      success: true,
      message: 'Driver registered. Redirect to SOBA for face scan.',
      driver,
      sobaRegistrationUrl: sobaUrl,
      sobaConfigured: soba.isSobaConfigured()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — Step 2: Called after SOBA scan completes (webhook or manual confirm)
router.post('/enroll/confirm', async (req, res) => {
  try {
    const { nic, sobaRegistrationId } = req.body;
    let driver = await Driver.findOne({ nic });
    
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    driver.enrolled = true;
    driver.enrolledAt = new Date();
    driver.sobaRegistrationId = sobaRegistrationId || `soba_${Date.now()}`;
    await driver.save();

    console.log(`[ENROLL CONFIRM] ${nic} marked as enrolled. SOBA ID: ${driver.sobaRegistrationId}`);

    res.json({ success: true, message: 'Driver enrollment confirmed', driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET — Build SOBA verification URL for a driver's shift start
router.post('/verify-url', async (req, res) => {
  try {
    const { nic } = req.body;
    const driver = await Driver.findOne({ nic });

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found. Please enroll first.' });
    if (!driver.enrolled) return res.status(400).json({ success: false, message: 'Driver not yet enrolled with SOBA.' });

    const callbackUrl = `${process.env.FRONTEND_URL}/soba-callback?type=verify&nic=${nic}`;
    const sobaUrl = soba.buildVerificationUrl(driver.email, callbackUrl);

    res.json({
      success: true,
      sobaVerifyUrl: sobaUrl,
      sobaConfigured: soba.isSobaConfigured(),
      driverEmail: driver.email
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
