// server.js — TukVerify Backend Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/soba', require('./routes/soba'));

app.get('/api/stats', (req, res) => {
  const db = require('./db');
  res.json({ success: true, stats: db.getStats() });
});

app.get('/api/health', (req, res) => {
  const soba = require('./services/soba');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sobaConfigured: soba.isSobaConfigured(),
    sobaMode: soba.isSobaConfigured() ? 'LIVE' : 'DEMO'
  });
});

app.listen(PORT, () => {
  const soba = require('./services/soba');
  console.log(`\n✅ TukVerify backend → http://localhost:${PORT}`);
  console.log(`🔐 SOBA Mode: ${soba.isSobaConfigured() ? '🟢 LIVE' : '🟡 DEMO (simulated)'}`);
});
