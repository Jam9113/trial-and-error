document.addEventListener('DOMContentLoaded', () => {
  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const clockElem = document.getElementById('clock');
    if (clockElem) {
      clockElem.textContent = timeString;
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  // Payroll Chart - Fetch real data from API
  async function initializePayrollChart() {
    try {
      const ctx = document.getElementById('payrollChart').getContext('2d');
      const chartContainer = document.querySelector('.chart-container');
      
      // Show loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = '<p>Loading chart data...</p>';
      chartContainer.appendChild(loadingIndicator);
      
      // Fetch payroll data from the API
      const response = await fetch('https://payroll-service-bnci.onrender.com/api/payrolls');
      if (!response.ok) {
        throw new Error('Failed to fetch payroll data');
      }
      
      const payrollData = await response.json();
      
      // Remove loading indicator
      chartContainer.removeChild(loadingIndicator);
      
      if (payrollData.length === 0) {
        // No data available
        const noDataMessage = document.createElement('div');
        noDataMessage.className = 'no-data-message';
        noDataMessage.innerHTML = '<p>No payroll data available</p>';
        chartContainer.appendChild(noDataMessage);
        return;
      }
      
      // Process data by department
      const departmentTotals = {};
      
      payrollData.forEach(payroll => {
        const department = payroll.department || 'Unspecified';
        if (!departmentTotals[department]) {
          departmentTotals[department] = 0;
        }
        departmentTotals[department] += Number(payroll.GrossSalary || 0);
      });
      
      // Prepare chart data
      const departments = Object.keys(departmentTotals);
      const totals = Object.values(departmentTotals);
      
      // Generate colors for each department
      const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#009ddc', '#4BC0C0', '#9966FF',
        '#FF9F40', '#8BC34A', '#EA80FC', '#607D8B', '#E91E63', '#00BCD4'
      ];
      
      // Create the chart
      const payrollChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: departments,
          datasets: [{
            label: 'Payroll Distribution by Department',
            data: totals,
            backgroundColor: colors.slice(0, departments.length)
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                }
              }
            },
            title: {
              display: true,
              text: 'Payroll Distribution by Department',
              font: {
                size: 16
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initializing payroll chart:', error);
      const chartContainer = document.querySelector('.chart-container');
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.innerHTML = '<p>Failed to load payroll data</p>';
      chartContainer.appendChild(errorMessage);
    }
  }
  
  // Helper function to format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // Initialize the chart
  initializePayrollChart();

  // Schedule management logic
  const scheduleForm = document.getElementById('scheduleForm');
  const scheduleRows = document.getElementById('scheduleRows');

  function clearNoSchedulesRow() {
    if (scheduleRows.children.length === 1 && scheduleRows.children[0].textContent.includes('No schedules')) {
      scheduleRows.innerHTML = '';
    }
  }

  function addScheduleRow(day, start, end, notes) {
    clearNoSchedulesRow();

    const tr = document.createElement('tr');

    const tdDay = document.createElement('td');
    tdDay.textContent = day;
    tr.appendChild(tdDay);

    const tdStart = document.createElement('td');
    tdStart.textContent = start;
    tr.appendChild(tdStart);

    const tdEnd = document.createElement('td');
    tdEnd.textContent = end;
    tr.appendChild(tdEnd);

    const tdNotes = document.createElement('td');
    tdNotes.textContent = notes;
    tr.appendChild(tdNotes);

    const tdAction = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => {
      tr.remove();
      // If table empty, add the no schedules row
      if (scheduleRows.children.length === 0) {
        const noSchedules = document.createElement('tr');
        noSchedules.innerHTML = `<td colspan="5" style="text-align:center; color:#999;">No schedules added yet.</td>`;
        scheduleRows.appendChild(noSchedules);
      }
    });
    tdAction.appendChild(deleteBtn);
    tr.appendChild(tdAction);

    scheduleRows.appendChild(tr);
  }

  scheduleForm.addEventListener('submit', e => {
    e.preventDefault();

    const day = scheduleForm.day.value;
    const start = scheduleForm.startTime.value;
    const end = scheduleForm.endTime.value;
    const notes = scheduleForm.notes.value.trim();

    if (!day || !start || !end) {
      alert('Please fill in all required fields.');
      return;
    }

    if (start >= end) {
      alert('Start time must be earlier than end time.');
      return;
    }

    addScheduleRow(day, start, end, notes);

    scheduleForm.reset();
    scheduleForm.day.focus();
  });
});