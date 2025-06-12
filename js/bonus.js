document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://employee-service-gec9.onrender.com/api';

  const employeeSelect = document.getElementById('employeeSelect');
  const resultDiv = document.getElementById('result');
  const messageDiv = document.getElementById('message');
  const historyTable = document.getElementById('historyTable');
  const historyTbody = historyTable.querySelector('tbody');
  const noHistoryMsg = document.getElementById('noHistoryMsg');
  const addEmployeeBtn = document.getElementById('addEmployeeBtn');
  const newNameInput = document.getElementById('newName');
  const newSalaryInput = document.getElementById('newSalary');
  const calculateBtn = document.getElementById('calculateBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');

  function formatCurrency(num) {
    return num.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
  }

  async function loadEmployees() {
    try {
      const res = await fetch(`${API_BASE_URL}/employees`);
      if (!res.ok) throw new Error('Failed to fetch employees');
      const employees = await res.json();
      employeeSelect.innerHTML = '<option value="">-- Select --</option>';
      employees.forEach(emp => {
        // Use consistent property casing for salary
        const salary = emp.Monthlysalary !== undefined ? emp.Monthlysalary : emp.monthlySalary || 0;
        const option = document.createElement('option');
        option.value = emp._id || emp.id || '';
        option.textContent = `${emp.name} (${formatCurrency(salary)})`;
        employeeSelect.appendChild(option);
      });
    } catch (err) {
      showMessage('Error loading employees.', true);
      console.error(err);
    }
  }

  async function loadHistory(employeeId) {
    try {
      let history = [];
      
      if (employeeId) {
        const res = await fetch(`${API_BASE_URL}/history/${employeeId}`);
        if (res.ok) {
          history = await res.json();
        }
      }
      
      historyTbody.innerHTML = '';

      if (!employeeId || history.length === 0) {
        historyTable.style.display = 'none';
        noHistoryMsg.textContent = employeeId ? 'No calculation history yet.' : 'Select an employee to see history';
        noHistoryMsg.style.display = 'block';
        return;
      }

      noHistoryMsg.style.display = 'none';
      historyTable.style.display = 'table';

      history.forEach(entry => {
        const tr = document.createElement('tr');
        // Get employee name from select dropdown
        let employeeName = 'Unknown';
        if (employeeSelect.selectedIndex >= 0) {
          employeeName = employeeSelect.options[employeeSelect.selectedIndex].text.split(' (')[0];
        }
        
        tr.innerHTML = `
            <td>${employeeName}</td>
            <td>${formatCurrency(entry.pay)}</td>
            <td>${new Date(entry.createdAt).toLocaleString()}</td>
          `;
        historyTbody.appendChild(tr);
      });
    } catch (err) {
      showMessage('Error loading history.', true);
      console.error(err);
    }
  }

  function showMessage(msg, isError = false) {
    messageDiv.textContent = msg;
    messageDiv.style.color = isError ? '#ff8080' : '#b4fbbb';
    messageDiv.style.display = msg ? 'block' : 'none';
  }
  addEmployeeBtn.addEventListener('click', async () => {
    const name = newNameInput.value.trim();
    const salary = parseFloat(newSalaryInput.value);

    if (!name || name.length > 50 || isNaN(salary) || salary < 0) {
      alert('Please provide valid name and salary.');
      return;
    }

    addEmployeeBtn.disabled = true;
    showMessage('');
    try {

      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          position: 'Employee',
          department: 'General',
          monthlySalary: salary
        })
      });

      if (!res.ok) throw new Error('Failed to add employee');
      newNameInput.value = '';
      newSalaryInput.value = '';
      await loadEmployees();
      showMessage('Employee added successfully!');
    } catch (err) {
      showMessage('Error adding employee.', true);
      console.error(err);
    }
    addEmployeeBtn.disabled = false;
  });


  calculateBtn.addEventListener('click', async () => {
    const employeeId = employeeSelect.value;
    if (!employeeId) {
      alert('Please select an employee');
      return;
    }

    calculateBtn.disabled = true;
    showMessage('');
    resultDiv.textContent = '';
    document.getElementById('calculationInfo').style.display = 'none';
    
    try {
      // First get the employee details to get their monthly salary
      const empRes = await fetch(`${API_BASE_URL}/employees/${employeeId}`);
      if (!empRes.ok) throw new Error('Failed to fetch employee details');
      const employee = await empRes.json();
      
      // Get payroll records to calculate based on actual payments
      const payrollRes = await fetch(`https://payroll-service-bnci.onrender.com/api/payrolls/employee/${employeeId}`);
      let payrollRecords = [];
      
      if (payrollRes.ok) {
        payrollRecords = await payrollRes.json();
      }
      
      // Calculate 13th month pay
      let thirteenthMonthPay = 0;
      let calculationMethod = '';
      let calculationBreakdown = '';
      
      if (payrollRecords.length > 0) {
        // Calculate based on actual payroll records
        // 13th month pay = (Total basic salary for the year) / 12
        const totalBasicSalary = payrollRecords.reduce((sum, record) => {
          // Use GrossSalary from payroll records
          return sum + Number(record.GrossSalary || 0);
        }, 0);
        
        thirteenthMonthPay = totalBasicSalary / 12;
        
        // Set calculation details
        calculationMethod = `<p>Calculation based on <strong>${payrollRecords.length}</strong> payroll records found.</p>`;
        calculationMethod += `<p>Formula: Total Basic Salary for the year ÷ 12</p>`;
        
        calculationBreakdown = `<p>Total Basic Salary: ${formatCurrency(totalBasicSalary)}</p>`;
        calculationBreakdown += `<p>Total Basic Salary ÷ 12 = ${formatCurrency(totalBasicSalary)} ÷ 12 = ${formatCurrency(thirteenthMonthPay)}</p>`;
        
        // Add payroll record details
        calculationBreakdown += `<div style="margin-top: 10px;"><strong>Payroll Records Used:</strong></div>`;
        calculationBreakdown += `<ul style="margin-top: 5px; list-style: none; ">`;
        
        payrollRecords.forEach((record, index) => {
          const date = new Date(record.payday).toLocaleDateString();
          calculationBreakdown += `<li>Record #${index + 1}: ${date} - ${formatCurrency(Number(record.GrossSalary || 0))}</li>`;
        });
        
        calculationBreakdown += `</ul>`;
      } else {
        // If no payroll records, use monthly salary * 1
        const monthlySalary = employee.monthlySalary || 0;
        thirteenthMonthPay = monthlySalary;
        
        // Set calculation details
        calculationMethod = `<p>No payroll records found. Calculation based on current monthly salary.</p>`;
        calculationMethod += `<p>Formula: Monthly Salary × 1</p>`;
        
        calculationBreakdown = `<p>Monthly Salary: ${formatCurrency(monthlySalary)}</p>`;
        calculationBreakdown += `<p>Monthly Salary × 1 = ${formatCurrency(monthlySalary)} × 1 = ${formatCurrency(thirteenthMonthPay)}</p>`;
      }
      
      // Save the calculation to history
      const historyRes = await fetch(`${API_BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          pay: thirteenthMonthPay
        })
      });
      
      if (!historyRes.ok) throw new Error('Failed to save calculation history');
      
      // Display results
      resultDiv.textContent = `13th Month Pay: ${formatCurrency(thirteenthMonthPay)}`;
      document.getElementById('calculationMethod').innerHTML = calculationMethod;
      document.getElementById('calculationBreakdown').innerHTML = calculationBreakdown;
      document.getElementById('calculationInfo').style.display = 'block';
      
      await loadHistory(employeeId);
      showMessage('Calculation successful!');
    } catch (err) {
      showMessage('Error during calculation.', true);
      console.error(err);
    }
    calculateBtn.disabled = false;
  });

  downloadPdfBtn.addEventListener('click', () => {
    if (!resultDiv.textContent) {
      alert('Please calculate 13th month pay first.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text('13th Month Pay Calculation', 105, 20, { align: 'center' });
    
    // Add company info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('PIKIFI Company', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 35, { align: 'center' });
    
    // Add horizontal line
    doc.setDrawColor(0, 51, 102);
    doc.line(20, 40, 190, 40);
    
    // Add employee info
    doc.setFontSize(12);
    const employeeName = employeeSelect.options[employeeSelect.selectedIndex].text.split(' (')[0];
    doc.text(`Employee: ${employeeName}`, 20, 50);
    
    // Add result with bold styling
    doc.setFont(undefined, 'bold');
    doc.text(resultDiv.textContent, 20, 60);
    doc.setFont(undefined, 'normal');
    
    // Add calculation method
    const calculationMethodEl = document.getElementById('calculationMethod');
    if (calculationMethodEl && calculationMethodEl.textContent) {
      doc.text('Calculation Method:', 20, 75);
      
      // Get text content without HTML tags
      const methodText = calculationMethodEl.textContent.replace(/\s+/g, ' ').trim();
      const methodLines = doc.splitTextToSize(methodText, 170);
      doc.text(methodLines, 20, 85);
    }
    
    // Add calculation breakdown
    const breakdownEl = document.getElementById('calculationBreakdown');
    if (breakdownEl && breakdownEl.textContent) {
      doc.text('Calculation Breakdown:', 20, 105);
      
      // Get text content without HTML tags
      const breakdownText = breakdownEl.textContent.replace(/\s+/g, ' ').trim();
      const breakdownLines = doc.splitTextToSize(breakdownText, 170);
      doc.text(breakdownLines, 20, 115);
    }
    
    // Add footer
    doc.setDrawColor(0, 51, 102);
    doc.line(20, 270, 190, 270);
    doc.setFontSize(8);
    doc.text('This is an official document for 13th month pay calculation.', 105, 275, { align: 'center' });
    doc.text('PIKIFI Payroll System', 105, 280, { align: 'center' });
    
    doc.save('13th-month-pay.pdf');
  });

  employeeSelect.addEventListener('change', () => {
    const selectedId = employeeSelect.value;
    if (selectedId) {
      loadHistory(selectedId);
    } else {
      historyTbody.innerHTML = '';
      resultDiv.textContent = '';
      historyTable.style.display = 'none';
      noHistoryMsg.textContent = 'Select an employee to see history';
      noHistoryMsg.style.display = 'block';
    }
  });

  // Initial load
  loadEmployees();
  loadHistory();
});