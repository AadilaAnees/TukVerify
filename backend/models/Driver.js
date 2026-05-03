const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nic: { type: String, required: true, unique: true },
  license: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  vehicle: { type: String, default: 'Three-Wheeler' },
  enrolled: { type: Boolean, default: false },
  enrolledAt: { type: Date, default: null },
  sobaRegistrationId: { type: String, default: null },
  rating: { type: Number, default: 5.0 },
  totalRides: { type: Number, default: 0 }
}, { 
  timestamps: true,
  collection: 'tukData' // As specified by user
});

module.exports = mongoose.model('Driver', driverSchema);
