const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

router.get('/callback', async (req, res) => {
  try {
    const { status, email, ref, txid, type, nic } = req.query;
    console.log('[SOBA CALLBACK]', req.query);

    const verified = status === 'verified' || status === 'success' || status === '1';

    if (type === 'register' || !type) {
      let driver;
      if (nic) {
        driver = await Driver.findOne({ nic });
      } else {
        driver = await Driver.findOne({ email });
      }

      if (driver && verified) {
        driver.enrolled = true;
        driver.enrolledAt = new Date();
        driver.sobaRegistrationId = txid || `soba_${Date.now()}`;
        await driver.save();
        console.log(`[SOBA CALLBACK] Driver ${driver.nic} enrolled. TX: ${driver.sobaRegistrationId}`);
      }

      const redirectUrl = verified
        ? `${process.env.FRONTEND_URL}/soba-callback?type=register&status=success&nic=${driver?.nic || ''}`
        : `${process.env.FRONTEND_URL}/soba-callback?type=register&status=failed&nic=${driver?.nic || ''}`;

      return res.redirect(redirectUrl);
    }

    if (type === 'verify') {
      const redirectUrl = verified
        ? `${process.env.FRONTEND_URL}/soba-callback?type=verify&status=success&nic=${nic}`
        : `${process.env.FRONTEND_URL}/soba-callback?type=verify&status=failed&nic=${nic}`;

      return res.redirect(redirectUrl);
    }

    res.redirect(`${process.env.FRONTEND_URL}/soba-callback?status=${status}`);
  } catch (err) {
    console.error('[SOBA CALLBACK ERROR]', err);
    res.redirect(`${process.env.FRONTEND_URL}/soba-callback?status=error`);
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { status, email, txid, eventType } = req.body;
    console.log('[SOBA WEBHOOK]', req.body);

    const verified = status === 'verified' || status === 'success' || status === 1;

    if (verified && email) {
      const driver = await Driver.findOne({ email });
      if (driver) {
        driver.enrolled = true;
        driver.enrolledAt = new Date();
        driver.sobaRegistrationId = txid || `soba_${Date.now()}`;
        await driver.save();
        console.log(`[SOBA WEBHOOK] Auto-enrolled ${driver.nic} via webhook`);
      }
    }

    res.json({ received: true, processed: true });
  } catch (err) {
    console.error('[SOBA WEBHOOK ERROR]', err);
    res.json({ received: true, error: true }); // Still return 200 so SOBA doesn't retry
  }
});

module.exports = router;
