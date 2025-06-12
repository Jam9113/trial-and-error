const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, default: 'Pending' }
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
