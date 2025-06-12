const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employeeName: String,
  employeeId: String,
  department: String,
  leaveType: String,      
  startDate: Date,
  endDate: Date,
  reason: String,
  status: { type: String, default: 'Pending' } 
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
