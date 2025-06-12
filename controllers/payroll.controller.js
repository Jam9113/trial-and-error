const Payroll = require('../models/payroll.model.js');
const axios = require('axios');

// Get all payrolls
exports.getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find().sort({ createdAt: -1 });
    
    // Check if detailed employee info is requested
    if (req.query.includeEmployeeDetails === 'true') {
      // For payrolls with employeeId, fetch employee details
      const payrollsWithEmployeeDetails = await Promise.all(payrolls.map(async (payroll) => {
        const payrollObj = payroll.toObject();
        
        if (payrollObj.employeeId) {
          try {
            const employeeResponse = await axios.get(`http://localhost:3001/api/employees/${payrollObj.employeeId}`);
            if (employeeResponse.data) {
              payrollObj.employeeDetails = employeeResponse.data;
            }
          } catch (employeeError) {
            console.error(`Error fetching employee details for ID ${payrollObj.employeeId}:`, employeeError.message);
          }
        }
        
        return payrollObj;
      }));
      
      return res.status(200).json(payrollsWithEmployeeDetails);
    }
    
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payroll by ID
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }
    
    // Check if we should include employee details
    if (req.query.includeEmployeeDetails === 'true' && payroll.employeeId) {
      try {
        const employeeResponse = await axios.get(`http://localhost:3001/api/employees/${payroll.employeeId}`);
        if (employeeResponse.data) {
          const payrollObj = payroll.toObject();
          payrollObj.employeeDetails = employeeResponse.data;
          return res.status(200).json(payrollObj);
        }
      } catch (employeeError) {
        console.error(`Error fetching employee details for ID ${payroll.employeeId}:`, employeeError.message);
        // Continue without employee details if there's an error
      }
    }
    
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payrolls by employee ID
exports.getPayrollsByEmployeeId = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employeeId: req.params.employeeId }).sort({ payday: -1 });
    
    // Check if we should include employee details
    if (req.query.includeEmployeeDetails === 'true' && payrolls.length > 0) {
      try {
        const employeeResponse = await axios.get(`http://localhost:3001/api/employees/${req.params.employeeId}`);
        if (employeeResponse.data) {
          const payrollsWithEmployee = payrolls.map(payroll => {
            const payrollObj = payroll.toObject();
            payrollObj.employeeDetails = employeeResponse.data;
            return payrollObj;
          });
          return res.status(200).json(payrollsWithEmployee);
        }
      } catch (employeeError) {
        console.error(`Error fetching employee details for ID ${req.params.employeeId}:`, employeeError.message);
        // Continue without employee details if there's an error
      }
    }
    
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new payroll
exports.createPayroll = async (req, res) => {
  try {
    const payrollData = req.body;
    
    // If employeeName is provided but not employeeId, try to find the employee
    if (payrollData.employeeName && !payrollData.employeeId) {
      try {
        // Try to find employee by name
        const employeeResponse = await axios.get(`http://localhost:3001/api/employees?name=${encodeURIComponent(payrollData.employeeName)}`);
        
        if (employeeResponse.data && employeeResponse.data.length > 0) {
          // If employee found, add the employeeId to payroll data
          payrollData.employeeId = employeeResponse.data[0]._id;
        }
      } catch (employeeError) {
        console.error('Error fetching employee data:', employeeError.message);
        // Continue without employee ID if there's an error
      }
    }
    
    const payroll = new Payroll(payrollData);
    const savedPayroll = await payroll.save();
    res.status(201).json(savedPayroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update payroll
exports.updatePayroll = async (req, res) => {
  try {
    const updatedPayroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedPayroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }
    
    res.status(200).json(updatedPayroll);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete payroll
exports.deletePayroll = async (req, res) => {
  try {
    const deletedPayroll = await Payroll.findByIdAndDelete(req.params.id);
    
    if (!deletedPayroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }
    
    res.status(200).json({ message: 'Payroll deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payroll summary by date range
exports.getPayrollSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const query = {
      payday: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    const payrolls = await Payroll.find(query);
    
    // Calculate summary statistics
    const summary = {
      totalPayrolls: payrolls.length,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalTax: 0,
      totalPhilhealth: 0,
      totalSSS: 0,
      totalDeductions: 0,
      departments: {}
    };
    
    payrolls.forEach(payroll => {
      summary.totalGrossSalary += Number(payroll.GrossSalary);
      summary.totalNetSalary += Number(payroll.NetSalary);
      summary.totalTax += Number(payroll.Tax);
      summary.totalPhilhealth += Number(payroll.Philhealth);
      summary.totalSSS += Number(payroll.SSS);
      summary.totalDeductions += Number(payroll.TotalDeductions);
      
      // Group by department
      if (payroll.department) {
        if (!summary.departments[payroll.department]) {
          summary.departments[payroll.department] = {
            count: 0,
            totalGrossSalary: 0,
            totalNetSalary: 0
          };
        }
        
        summary.departments[payroll.department].count++;
        summary.departments[payroll.department].totalGrossSalary += Number(payroll.GrossSalary);
        summary.departments[payroll.department].totalNetSalary += Number(payroll.NetSalary);
      }
    });
    
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};