// server.js — TukVerify Backend Entry Point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const Driver = require('./models/Driver');
const Session = require('./models/Session');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/soba', require('./routes/soba'));

app.get('/api/stats', async (req, res) => {
  try {
    const totalDrivers = await Driver.countDocuments();
    const enrolledDrivers = await Driver.countDocuments({ enrolled: true });
    
    const sessions = await Session.find();
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.active).length;
    const flaggedSessions = sessions.filter(s => s.flagged).length;
    const totalRides = sessions.reduce((a, s) => a + s.rides.length, 0);
    const totalReVerifications = sessions.reduce((a, s) => a + s.reVerifications.length, 0);

    res.json({ 
      success: true, 
      stats: { 
        totalDrivers, 
        enrolledDrivers, 
        activeSessions, 
        totalSessions, 
        flaggedSessions, 
        totalRides, 
        totalReVerifications 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
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

// Export the Express API for Vercel serverless deployment
module.exports = app;
