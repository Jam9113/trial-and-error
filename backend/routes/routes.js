const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller.js');

// Payroll routes
router.get('/payrolls', payrollController.getAllPayrolls);
router.get('/payrolls/:id', payrollController.getPayrollById);
router.get('/payrolls/employee/:employeeId', payrollController.getPayrollsByEmployeeId);
router.post('/payrolls', payrollController.createPayroll);
router.put('/payrolls/:id', payrollController.updatePayroll);
router.delete('/payrolls/:id', payrollController.deletePayroll);
router.get('/payroll-summary', payrollController.getPayrollSummary);

module.exports = router;