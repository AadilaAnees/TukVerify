// db.js — Central in-memory store (replace with MongoDB/Firebase in production)
const { v4: uuidv4 } = require('uuid');

const db = {
  drivers: {},   // keyed by NIC
  sessions: {},  // keyed by sessionId
};

// ─── SEED DEMO DRIVERS ────────────────────────────────────────────────────────
// These have real SOBA-registered emails so judges can test immediately
db.drivers['9X1234567V'] = {
  name: 'Kasun Perera',
  nic: '9X1234567V',
  license: 'B1234567',
  email: 'kasun@tukverify.com',   // ← email used in SOBA registration URL
  phone: '+94771234567',
  vehicle: 'Three-Wheeler',
  enrolled: true,
  enrolledAt: new Date(Date.now() - 86400000).toISOString(),
  sobaRegistrationId: '1925523630',  // ← blockchain TX ID from SOBA Event Users tab
  rating: 4.8,
  totalRides: 142
};

db.drivers['1234'] = {
  name: 'Test Driver',
  nic: '1234',
  license: 'A123456',
  email: 'test@tukverify.com',
  phone: '+94770000000',
  vehicle: 'Three-Wheeler',
  enrolled: true,
  enrolledAt: new Date().toISOString(),
  sobaRegistrationId: '1925523630',
  rating: 5.0,
  totalRides: 0
};

db.drivers['12345678V'] = {
  name: 'adlyn',
  nic: '12345678V',
  license: '1234',
  email: 'adlynlk04@gmail.com', 
  phone: '',
  vehicle: 'Three-Wheeler',
  enrolled: true,               
  enrolledAt: new Date().toISOString(),
  sobaRegistrationId: '988137438', 
  rating: 5.0,
  totalRides: 0
};

// ─── DRIVER HELPERS ───────────────────────────────────────────────────────────

function getDriver(nic) {
  return db.drivers[nic] || null;
}

function getAllDrivers() {
  return Object.values(db.drivers);
}

function createDriver({ name, nic, license, email, phone, vehicle }) {
  if (db.drivers[nic]) return { error: 'Driver already enrolled' };
  db.drivers[nic] = {
    name, nic, license,
    email: email || `${nic.toLowerCase()}@tukverify.com`,
    phone: phone || '',
    vehicle: vehicle || 'Three-Wheeler',
    enrolled: false,
    enrolledAt: null,
    sobaRegistrationId: null,
    rating: 5.0,
    totalRides: 0,
    createdAt: new Date().toISOString()
  };
  return db.drivers[nic];
}

function markDriverEnrolled(nic, sobaRegistrationId) {
  const driver = db.drivers[nic];
  if (!driver) return null;
  driver.enrolled = true;
  driver.enrolledAt = new Date().toISOString();
  driver.sobaRegistrationId = sobaRegistrationId || `soba_${Date.now()}`;
  return driver;
}

// ─── SESSION HELPERS ──────────────────────────────────────────────────────────

function getSession(sessionId) {
  return db.sessions[sessionId] || null;
}

function getAllSessions() {
  return Object.values(db.sessions).map(s => ({
    ...s,
    driver: db.drivers[s.driverId]
  }));
}

function getActiveSession(nic) {
  return Object.values(db.sessions).find(s => s.driverId === nic && s.active) || null;
}

function createSession(nic, zkProof, confidence) {
  const sessionId = uuidv4();
  db.sessions[sessionId] = {
    sessionId,
    driverId: nic,
    startedAt: new Date().toISOString(),
    endedAt: null,
    verified: true,
    zkProof,
    confidence,
    active: true,
    flagged: false,
    flagReason: null,
    rides: [],
    reVerifications: []
  };
  return db.sessions[sessionId];
}

function endSession(sessionId) {
  const s = db.sessions[sessionId];
  if (!s) return null;
  s.active = false;
  s.endedAt = new Date().toISOString();
  return s;
}

function addReVerification(sessionId, verified, zkProof) {
  const s = db.sessions[sessionId];
  if (!s) return null;
  const rv = { timestamp: new Date().toISOString(), verified, zkProof };
  s.reVerifications.push(rv);
  if (!verified) {
    s.active = false;
    s.flagged = true;
    s.flagReason = 'Mid-shift re-verification failed — identity mismatch detected';
  }
  return rv;
}

function addRide(sessionId, pickup, dropoff) {
  const s = db.sessions[sessionId];
  if (!s || !s.active) return null;
  const { v4 } = require('uuid');
  const ride = {
    rideId: v4(),
    pickup: pickup || 'Colombo Fort',
    dropoff: dropoff || 'Nugegoda',
    timestamp: new Date().toISOString()
  };
  s.rides.push(ride);
  const driver = db.drivers[s.driverId];
  if (driver) driver.totalRides = (driver.totalRides || 0) + 1;
  return ride;
}

function getStats() {
  const drivers = getAllDrivers();
  const sessions = Object.values(db.sessions);
  return {
    totalDrivers: drivers.length,
    enrolledDrivers: drivers.filter(d => d.enrolled).length,
    activeSessions: sessions.filter(s => s.active).length,
    totalSessions: sessions.length,
    flaggedSessions: sessions.filter(s => s.flagged).length,
    totalRides: sessions.reduce((a, s) => a + s.rides.length, 0),
    totalReVerifications: sessions.reduce((a, s) => a + s.reVerifications.length, 0)
  };
}

module.exports = {
  db,
  getDriver, getAllDrivers, createDriver, markDriverEnrolled,
  getSession, getAllSessions, getActiveSession,
  createSession, endSession, addReVerification, addRide,
  getStats
};
