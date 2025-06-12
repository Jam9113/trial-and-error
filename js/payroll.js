document.addEventListener("DOMContentLoaded", () => {
  const computedFields = ["grossSalary", "tax", "philHealth", "sss", "totalDeduction", "netSalary"];

  // Clear computed fields when relevant inputs change
  ["ratePerHour", "hoursPerDay", "daysWorked"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      computedFields.forEach(f => (document.getElementById(f).value = ""));
    });
  });

  // Store employee ID for later use
  let currentEmployeeId = null;

  // Fetch employee data when name is entered
  document.getElementById("employeeName").addEventListener("blur", async () => {
    const employeeName = document.getElementById("employeeName").value.trim();
    currentEmployeeId = null; // Reset employee ID
    
    if (employeeName) {
      try {
        const response = await fetch(`https://employee-service-gec9.onrender.com/api/employees?name=${encodeURIComponent(employeeName)}`);
        if (response.ok) {
          const employees = await response.json();
          if (employees && employees.length > 0) {
            // Found an employee, populate fields
            const employee = employees[0];
            currentEmployeeId = employee._id; // Store employee ID
            document.getElementById("department").value = employee.department || "";
            
            // Calculate hourly rate from monthly salary if available
            if (employee.monthlySalary) {
              // Assuming 22 working days per month and 8 hours per day
              const hourlyRate = (employee.monthlySalary / 22 / 8).toFixed(2);
              document.getElementById("ratePerHour").value = hourlyRate;
              document.getElementById("hoursPerDay").value = "8"; // Default
            }
          }
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    }
  });

  // COMPUTE button event
  document.getElementById("compute").addEventListener("click", async () => {
    const payday = document.getElementById("payday").value;
    const employeeName = document.getElementById("employeeName").value.trim();
    const department = document.getElementById("department").value.trim();
    const ratePerHour = parseFloat(document.getElementById("ratePerHour").value);
    const hoursPerDay = parseFloat(document.getElementById("hoursPerDay").value);
    const daysWorked = parseInt(document.getElementById("daysWorked").value);

    // Validate inputs
    if (!payday || !employeeName || !department) {
      alert("Please fill out all required fields (payday, employee name, department).");
      return;
    }
    if (
      isNaN(ratePerHour) || ratePerHour < 0 ||
      isNaN(hoursPerDay) || hoursPerDay < 0 ||
      isNaN(daysWorked) || daysWorked < 0
    ) {
      alert("Please enter valid non-negative numbers for rate, hours, and days.");
      return;
    }

    // Calculate payroll values
    const grossSalary = ratePerHour * hoursPerDay * daysWorked;
    const tax = grossSalary * 0.15;
    const philHealth = grossSalary * 0.05;
    const sss = grossSalary * 0.11;
    const totalDeduction = tax + philHealth + sss;
    const netSalary = grossSalary - totalDeduction;

    // Set computed values in form
    document.getElementById("grossSalary").value = grossSalary.toFixed(2);
    document.getElementById("tax").value = tax.toFixed(2);
    document.getElementById("philHealth").value = philHealth.toFixed(2);
    document.getElementById("sss").value = sss.toFixed(2);
    document.getElementById("totalDeduction").value = totalDeduction.toFixed(2);
    document.getElementById("netSalary").value = netSalary.toFixed(2);

    // Prepare data to send
    // Send data to backend API
    const payrollData = {
      payday,
      employeeName,
      department,
      RateperHour: ratePerHour.toFixed(2),
      HoursperDay: hoursPerDay.toFixed(2),
      NumbersofDaysWorked: daysWorked,
      GrossSalary: grossSalary.toFixed(2),
      Tax: tax.toFixed(2),
      Philhealth: philHealth.toFixed(2),
      SSS: sss.toFixed(2),
      TotalDeductions: totalDeduction.toFixed(2),
      NetSalary: netSalary.toFixed(2),
    };
    
    // Add employee ID if available
    if (currentEmployeeId) {
      payrollData.employeeId = currentEmployeeId;
    }

    try {
      const res = await fetch("https://payroll-service-bnci.onrender.com/api/payrolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payrollData),
      });

      if (!res.ok) {
        let errorText = "Failed to save payroll.";
        try {
          const errorJson = await res.json();
          if (errorJson && errorJson.error) {
            errorText = errorJson.error;
          }
        } catch { }
        alert(errorText);
        return;
      }

      alert("Payroll saved to database!");
    } catch (error) {
      alert("Error connecting to server.");
      console.error(error);
    }
  });

  // CLEAR button event
  document.getElementById("clear").addEventListener("click", () => {
    ["payday", "employeeName", "department", "ratePerHour", "hoursPerDay", "daysWorked", ...computedFields]
      .forEach(id => document.getElementById(id).value = "");
  });

  // EXPORT CSV button event
  document.getElementById("exportCsv").addEventListener("click", () => {
    const fields = [
      "payday", "employeeName", "department", "ratePerHour", "hoursPerDay", "daysWorked",
      "grossSalary", "tax", "philHealth", "sss", "totalDeduction", "netSalary"
    ];

    // Check if required fields have data before exporting CSV
    if (!document.getElementById("employeeName").value.trim()) {
      alert("Please enter Employee Name before exporting CSV.");
      return;
    }

    let csvContent = fields.join(",") + "\n";
    let values = fields.map(id => {
      const val = document.getElementById(id).value || "";
      // Escape quotes by doubling them (CSV standard)
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvContent += values.join(",");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${document.getElementById("employeeName").value || "record"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // DOWNLOAD PDF button event
  document.getElementById("downloadPdf").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Payroll System", 105, 15, null, null, "center");

    const fields = [
      ["Payday", "payday"],
      ["Employee Name", "employeeName"],
      ["Department", "department"],
      ["Rate Per Hour", "ratePerHour"],
      ["Hours Per Day", "hoursPerDay"],
      ["Days Worked", "daysWorked"],
      ["Gross Salary", "grossSalary"],
      ["Tax", "tax"],
      ["PhilHealth", "philHealth"],
      ["SSS", "sss"],
      ["Total Deduction", "totalDeduction"],
      ["Net Salary", "netSalary"],
    ];

    let y = 30;
    doc.setFontSize(12);
    fields.forEach(([label, id]) => {
      const val = document.getElementById(id).value || "";
      doc.text(`${label}: ${val}`, 15, y);
      y += 10;
    });

    doc.save(`payroll_${document.getElementById("employeeName").value || "record"}.pdf`);
  });

  // PRINT button event
  document.getElementById("print").addEventListener("click", () => {
    window.print();
  });
});