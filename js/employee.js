document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://employee-service-gec9.onrender.com/api/employees';
  const saveBtn = document.getElementById('saveBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const tbody = document.querySelector('#employeeTable tbody');
  let editId = null;

  async function fetchEmployees() {
    const res = await fetch(API_URL);
    return res.json();
  }

  async function addEmployee(employee) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });

      if (!res.ok) throw new Error('Failed to add employee');

      return res.json();
    } catch (error) {
      console.error("Error adding employee:", error);
      throw error;
    }
  }

  async function updateEmployee(id, employee) {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });

      if (!res.ok) throw new Error('Failed to update employee');

      return res.json();
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  }

  async function deleteEmployee(id) {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete employee');

      updateTable();
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  }

  function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('position').value = '';
    document.getElementById('department').value = '';
    document.getElementById('monthlySalary').value = '';
    document.getElementById('timeIn').value = '';
    document.getElementById('timeOut').value = '';
    editId = null;
    saveBtn.textContent = 'Save Employee Data';
  }

  async function editEmployee(id) {
    const employees = await fetchEmployees();
    const emp = employees.find(e => e._id === id);
    if (!emp) return alert('Employee not found');

    document.getElementById('name').value = emp.name;
    document.getElementById('position').value = emp.position;
    document.getElementById('department').value = emp.department;
    document.getElementById('monthlySalary').value = emp.monthlySalary;
    document.getElementById('timeIn').value = emp.timeIn;
    document.getElementById('timeOut').value = emp.timeOut;
    editId = id;
    saveBtn.textContent = 'Update Employee Data';
  }

  async function updateTable() {
    const employees = await fetchEmployees();
    tbody.innerHTML = '';

    if (employees.length > 0) {
      employees.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${emp.name}</td>
          <td>${emp.position}</td>
          <td>${emp.department}</td>
          <td>${emp.monthlySalary}</td>
          <td>${emp.timeIn ? emp.timeIn : '00:00'}</td>
          <td>${emp.timeOut ? emp.timeOut : '00:00'}</td>
          <td>
            <button class="action-btn edit-btn" data-id="${emp._id}">Edit</button>
            <button class="action-btn delete-btn" data-id="${emp._id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      document.getElementById('employeeTable').style.display = 'table';

      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => editEmployee(btn.dataset.id);
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = () => {
          if (confirm('Are you sure you want to delete this employee?')) {
            deleteEmployee(btn.dataset.id);
          }
        };
      });
    } else {
      document.getElementById('employeeTable').style.display = 'none';
    }
  }

  saveBtn.onclick = async () => {
    const name = document.getElementById('name').value.trim();
    const position = document.getElementById('position').value.trim();
    const department = document.getElementById('department').value.trim();
    const monthlySalary = parseFloat(document.getElementById('monthlySalary').value.trim());
    const timeIn = document.getElementById('timeIn').value;
    const timeOut = document.getElementById('timeOut').value;

    if (!name || !position || !department || !monthlySalary || !timeIn || !timeOut) {
      return alert('Please fill in all fields.');
    }

    const employee = { name, position, department, monthlySalary, timeIn, timeOut };

    try {
      if (editId) {
        await updateEmployee(editId, employee);
        alert('Employee updated successfully!');
      } else {
        await addEmployee(employee);
        alert('Employee added successfully!');
      }
      clearForm();
      updateTable();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  exportPdfBtn.onclick = async () => {
    const jsPDFModule = window.jspdf;
    if (!jsPDFModule) {
      alert('Failed to load jsPDF. Please check your script includes.');
      return;
    }

    const doc = new jsPDFModule.jsPDF();
    doc.setFontSize(18);
    doc.text("Employee Report", 14, 20);

    const employees = await fetchEmployees();
    if (!employees.length) return alert('No employees to export.');

    const rows = employees.map(emp => [
      emp.name ?? '',
      emp.position ?? '',
      emp.department ?? '',
      String(emp.monthlySalary ?? ''),
      emp.timeIn ?? '',
      emp.timeOut ?? ''
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Name', 'Position', 'Department', 'Monthly Salary (PHP)', 'Time In', 'Time Out']],
      body: rows,
      styles: { fontSize: 10 }
    });

    doc.save('employee_report.pdf');
  };

  updateTable();
});