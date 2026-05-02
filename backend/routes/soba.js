// routes/soba.js
// Handles all callbacks and webhooks FROM SOBA Network back to our server
const express = require('express');
const router = express.Router();
const db = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/soba/callback
// SOBA redirects the user's BROWSER here after face scan completes.
// Query params from SOBA (based on their dashboard):
//   ?status=verified OR failed
//   &email=<the driver email we passed>
//   &ref=<our ref>
//   &txid=<blockchain TX id>  ← the Registration TX shown in Event Users tab
// ─────────────────────────────────────────────────────────────────────────────
router.get('/callback', (req, res) => {
  const { status, email, ref, txid, type, nic } = req.query;

  console.log('[SOBA CALLBACK]', req.query);

  const verified = status === 'verified' || status === 'success' || status === '1';

  if (type === 'register' || !type) {
    // Registration callback — mark driver as enrolled
    // Find driver by email or nic
    const driver = nic
      ? db.getDriver(nic)
      : Object.values(db.getAllDrivers()).find(d => d.email === email);

    if (driver && verified) {
      db.markDriverEnrolled(driver.nic, txid || `soba_${Date.now()}`);
      console.log(`[SOBA CALLBACK] Driver ${driver.nic} enrolled. TX: ${txid}`);
    }

    const redirectUrl = verified
      ? `${process.env.FRONTEND_URL}/soba-callback?type=register&status=success&nic=${driver?.nic}`
      : `${process.env.FRONTEND_URL}/soba-callback?type=register&status=failed&nic=${driver?.nic}`;

    return res.redirect(redirectUrl);
  }

  if (type === 'verify') {
    // Verification callback — session will be started by frontend after this
    const redirectUrl = verified
      ? `${process.env.FRONTEND_URL}/soba-callback?type=verify&status=success&nic=${nic}`
      : `${process.env.FRONTEND_URL}/soba-callback?type=verify&status=failed&nic=${nic}`;

    return res.redirect(redirectUrl);
  }

  res.redirect(`${process.env.FRONTEND_URL}/soba-callback?status=${status}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/soba/webhook
// SOBA calls this server-to-server when a verification event happens.
// This is more reliable than the redirect callback.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', (req, res) => {
  const { status, email, txid, eventType } = req.body;
  console.log('[SOBA WEBHOOK]', req.body);

  const verified = status === 'verified' || status === 'success' || status === 1;

  if (verified && email) {
    const driver = db.getAllDrivers().find(d => d.email === email);
    if (driver) {
      db.markDriverEnrolled(driver.nic, txid);
      console.log(`[SOBA WEBHOOK] Auto-enrolled ${driver.nic} via webhook`);
    }
  }

  // Always respond 200 so SOBA doesn't retry
  res.json({ received: true, processed: true });
});

module.exports = router;
