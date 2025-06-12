const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false // Can be null if employee is not in the system
  },
  employeeName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  RateperHour: {
    type: Number,
    required: true, 
    min: 0
  },
  HoursperDay: {
    type: Number,
    required: true, 
    min: 0
  },
  NumbersofDaysWorked: {
    type: Number,
    required: true,
    min: 0
  },
  GrossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  Tax: {
    type: Number,
    required: true,
    min: 0
  },
  Philhealth: {
    type: Number,
    required: true,
    min: 0
  },
  SSS: {
    type: Number,
    required: true,
    min: 0
  },
  TotalDeductions: {
    type: Number,
    required: true,
    min: 0
  },
  NetSalary: {
    type: Number,
    required: true,
    min: 0
  },
  payday: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Payroll", payrollSchema);