const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rideId: { type: String, required: true },
  pickup: { type: String, required: true },
  dropoff: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const reVerificationSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  verified: { type: Boolean, required: true },
  zkProof: { type: String }
});

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  driverId: { type: String, required: true }, // NIC
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  verified: { type: Boolean, default: true },
  zkProof: { type: String },
  confidence: { type: Number },
  active: { type: Boolean, default: true },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: null },
  rides: [rideSchema],
  reVerifications: [reVerificationSchema]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
