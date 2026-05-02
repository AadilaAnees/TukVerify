// routes/drivers.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const soba = require('../services/soba');

// GET all drivers
router.get('/', (req, res) => {
  res.json({ success: true, drivers: db.getAllDrivers() });
});

// GET single driver by NIC
router.get('/:nic', (req, res) => {
  const driver = db.getDriver(req.params.nic);
  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
  res.json({ success: true, driver });
});

// POST — Step 1: Register driver details
// This saves the driver and returns the SOBA registration URL
// The URL has the driver's EMAIL embedded — that's how SOBA identifies each person
// NO .env change needed per user — just a different email in the URL
router.post('/enroll', (req, res) => {
  const { name, nic, license, email, phone, vehicle } = req.body;

  if (!name || !nic || !license || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name, NIC, License and Email are required'
    });
  }

  // Basic email format check
  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email required for SOBA registration' });
  }

  const result = db.createDriver({ name, nic, license, email, phone, vehicle });
  if (result.error) return res.status(409).json({ success: false, message: result.error });

  // Build SOBA registration URL with this driver's email
  // This is the URL they visit to do their face scan
  const callbackUrl = `${process.env.FRONTEND_URL}/soba-callback?type=register&nic=${nic}`;
  const sobaUrl = soba.buildRegistrationUrl(email, callbackUrl);

  console.log(`[ENROLL] Driver ${name} (${nic}) → SOBA URL: ${sobaUrl}`);

  // 🚨 PROTOTYPE BYPASS: Auto-enroll locally because live webhooks 
  // cannot reach your localhost computer to confirm the scan.
  db.markDriverEnrolled(nic, `bypass_${Date.now()}`);

  res.json({
    success: true,
    message: 'Driver registered. Redirect to SOBA for face scan.',
    driver: result,
    sobaRegistrationUrl: sobaUrl,
    sobaConfigured: soba.isSobaConfigured()
  });
});

// POST — Step 2: Called after SOBA scan completes (webhook or manual confirm)
router.post('/enroll/confirm', async (req, res) => {
  const { nic, sobaRegistrationId } = req.body;
  const driver = db.getDriver(nic);
  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

  const updated = db.markDriverEnrolled(nic, sobaRegistrationId);
  console.log(`[ENROLL CONFIRM] ${nic} marked as enrolled. SOBA ID: ${sobaRegistrationId}`);

  res.json({ success: true, message: 'Driver enrollment confirmed', driver: updated });
});

// GET — Build SOBA verification URL for a driver's shift start
// Returns the URL the driver visits to verify their face before going online
router.post('/verify-url', (req, res) => {
  const { nic } = req.body;
  const driver = db.getDriver(nic);

  if (!driver) return res.status(404).json({ success: false, message: 'Driver not found. Please enroll first.' });
  if (!driver.enrolled) return res.status(400).json({ success: false, message: 'Driver not yet enrolled with SOBA.' });

  // Callback brings them back to driver page with status
  const callbackUrl = `${process.env.FRONTEND_URL}/soba-callback?type=verify&nic=${nic}`;
  const sobaUrl = soba.buildVerificationUrl(driver.email, callbackUrl);

  res.json({
    success: true,
    sobaVerifyUrl: sobaUrl,
    sobaConfigured: soba.isSobaConfigured(),
    driverEmail: driver.email
  });
});

module.exports = router;
