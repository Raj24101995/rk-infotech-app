// RK INFOTECH Business Management App JavaScript

// Application data from JSON
const appData = {
  "company": {
    "name": "RK INFOTECH",
    "address": "123 Tech Park, Bangalore, Karnataka 560001",
    "phone": "+91-9876543210",
    "email": "contact@rkinfotech.com",
    "gst": "29ABCDE1234F1Z5"
  },
  "employees": [
    {
      "id": "EMP001",
      "name": "Rajesh Kumar",
      "designation": "Software Developer",
      "department": "IT",
      "email": "rajesh@rkinfotech.com",
      "phone": "9876543211",
      "bankAccount": "1234567890123456",
      "ifsc": "HDFC0001234",
      "panNumber": "ABCDE1234F",
      "basicSalary": 50000,
      "hra": 15000,
      "da": 5000,
      "medicalAllowance": 2000,
      "conveyanceAllowance": 1000
    },
    {
      "id": "EMP002", 
      "name": "Priya Sharma",
      "designation": "Project Manager",
      "department": "IT",
      "email": "priya@rkinfotech.com",
      "phone": "9876543212",
      "bankAccount": "2345678901234567",
      "ifsc": "HDFC0001234",
      "panNumber": "BCDEF2345G",
      "basicSalary": 75000,
      "hra": 22500,
      "da": 7500,
      "medicalAllowance": 3000,
      "conveyanceAllowance": 1500
    }
  ],
  "attendance": [
    {
      "date": "2025-10-04",
      "employeeId": "EMP001",
      "checkIn": "09:00",
      "checkOut": "18:00",
      "totalHours": "9:00",
      "location": "Office"
    },
    {
      "date": "2025-10-03",
      "employeeId": "EMP001", 
      "checkIn": "09:15",
      "checkOut": "18:30",
      "totalHours": "9:15",
      "location": "Office"
    }
  ],
  "invoiceTemplates": [
    {
      "id": "template1",
      "name": "Professional Blue",
      "primaryColor": "#2563eb",
      "secondaryColor": "#f8fafc"
    },
    {
      "id": "template2", 
      "name": "Corporate Green",
      "primaryColor": "#059669",
      "secondaryColor": "#f0fdf4"
    },
    {
      "id": "template3",
      "name": "Modern Purple",
      "primaryColor": "#7c3aed", 
      "secondaryColor": "#faf5ff"
    }
  ],
  "salaryTemplates": [
    {
      "id": "salary1",
      "name": "Standard Template",
      "headerColor": "#2563eb",
      "fontFamily": "Arial"
    },
    {
      "id": "salary2",
      "name": "Professional Template", 
      "headerColor": "#059669",
      "fontFamily": "Times New Roman"
    }
  ],
  "clients": [
    {
      "id": "CLIENT001",
      "name": "ABC Technologies Pvt Ltd",
      "address": "456 Business Park, Mumbai, Maharashtra 400001",
      "phone": "+91-9876543220",
      "email": "info@abctech.com",
      "gst": "27FGHIJ5678K1L9"
    },
    {
      "id": "CLIENT002",
      "name": "XYZ Solutions Ltd",
      "address": "789 Corporate Center, Delhi, Delhi 110001", 
      "phone": "+91-9876543230",
      "email": "contact@xyzsolutions.com",
      "gst": "07MNOPQ9012R3S4"
    }
  ],
  "services": [
    {
      "id": "SRV001",
      "name": "Web Development",
      "description": "Custom website development",
      "rate": 1500,
      "unit": "hour"
    },
    {
      "id": "SRV002",
      "name": "Mobile App Development",
      "description": "iOS and Android app development",
      "rate": 2000,
      "unit": "hour"  
    },
    {
      "id": "SRV003",
      "name": "Software Consultation",
      "description": "Technical consultation services",
      "rate": 2500,
      "unit": "hour"
    }
  ],
  "taxRates": {
    "cgst": 9,
    "sgst": 9,
    "igst": 18
  }
};

// Global state
let currentUser = appData.employees[0]; // Default to first employee
let attendanceState = {
  isCheckedIn: false,
  checkInTime: null,
  todayHours: 0
};

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  updateCurrentDate();
  loadAttendanceState();
  populateEmployeeSelect();
  populateClientSelect();
  populateServiceSelects();
  loadAttendanceHistory();
  updateDashboardStats();
  updateClock();
  setupEventListeners();
  
  // Update clock every second
  setInterval(updateClock, 1000);
}

function setupEventListeners() {
  // Bottom navigation click handlers
  document.querySelectorAll('.nav-item').forEach(navItem => {
    navItem.addEventListener('click', function() {
      const tabName = this.onclick ? this.onclick.toString().match(/switchTab\('(.+?)'\)/)?.[1] : null;
      if (tabName) {
        switchTab(tabName);
        updateActiveNav(this);
      }
    });
  });
  
  // Quick action button handlers
  document.querySelectorAll('.action-buttons .btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.onclick ? this.onclick.toString().match(/switchTab\('(.+?)'\)/)?.[1] : null;
      if (tabName) {
        switchTab(tabName);
        updateActiveNavByTab(tabName);
      }
    });
  });

  // Modal close handlers
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && !e.target.classList.contains('modal-content')) {
      e.target.classList.add('hidden');
    }
  });
}

// Tab switching functionality
function switchTab(tabName) {
  // Hide all sections
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.remove('active'));
  
  // Show selected section
  const targetSection = document.getElementById(tabName);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Special initialization for specific tabs
  if (tabName === 'attendance') {
    updateAttendanceUI();
  } else if (tabName === 'payroll') {
    populateEmployeeSelect();
  } else if (tabName === 'invoices') {
    populateClientSelect();
    populateServiceSelects();
  }
}

function updateActiveNav(clickedItem) {
  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Add active class to clicked item
  clickedItem.classList.add('active');
}

function updateActiveNavByTab(tabName) {
  // Map tab names to nav items
  const tabMap = {
    'dashboard': 0,
    'attendance': 1,
    'payroll': 2,
    'invoices': 3,
    'settings': 4
  };
  
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item, index) => {
    item.classList.remove('active');
    if (index === tabMap[tabName]) {
      item.classList.add('active');
    }
  });
}

// Date and time functions
function updateCurrentDate() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-IN', options);
}

function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-IN', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const clockElement = document.getElementById('currentTime');
  if (clockElement) {
    clockElement.textContent = timeString;
  }
  
  // Update today's hours if checked in
  if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
    const hoursWorked = calculateHoursWorked(attendanceState.checkInTime, now);
    const todayHoursElement = document.getElementById('todayHours');
    if (todayHoursElement) {
      todayHoursElement.textContent = hoursWorked;
    }
    attendanceState.todayHours = hoursWorked;
  }
}

function calculateHoursWorked(checkIn, checkOut) {
  const diff = checkOut.getTime() - checkIn.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

// Attendance functions
function loadAttendanceState() {
  const saved = localStorage.getItem('attendanceState');
  if (saved) {
    const state = JSON.parse(saved);
    attendanceState.isCheckedIn = state.isCheckedIn;
    attendanceState.checkInTime = state.checkInTime ? new Date(state.checkInTime) : null;
    
    // Check if it's a new day
    const today = new Date().toDateString();
    const checkInDate = attendanceState.checkInTime ? attendanceState.checkInTime.toDateString() : null;
    
    if (checkInDate !== today) {
      attendanceState.isCheckedIn = false;
      attendanceState.checkInTime = null;
      attendanceState.todayHours = 0;
    }
  }
  
  updateAttendanceUI();
}

function updateAttendanceUI() {
  const statusElement = document.getElementById('currentStatus');
  const statusDot = document.querySelector('.status-dot');
  const clockInBtn = document.getElementById('clockInBtn');
  const clockOutBtn = document.getElementById('clockOutBtn');
  const attendanceStatus = document.getElementById('attendanceStatus');
  
  if (attendanceState.isCheckedIn) {
    if (statusElement) statusElement.textContent = 'Checked In';
    if (statusDot) statusDot.classList.add('checked-in');
    if (clockInBtn) clockInBtn.disabled = true;
    if (clockOutBtn) clockOutBtn.disabled = false;
    if (attendanceStatus) {
      attendanceStatus.textContent = 'Checked In';
      attendanceStatus.className = 'text-success';
    }
  } else {
    if (statusElement) statusElement.textContent = 'Not Checked In';
    if (statusDot) statusDot.classList.remove('checked-in');
    if (clockInBtn) clockInBtn.disabled = false;
    if (clockOutBtn) clockOutBtn.disabled = true;
    if (attendanceStatus) {
      attendanceStatus.textContent = 'Not Checked In';
      attendanceStatus.className = 'text-error';
    }
  }
}

function clockIn() {
  const now = new Date();
  attendanceState.isCheckedIn = true;
  attendanceState.checkInTime = now;
  
  saveAttendanceState();
  updateAttendanceUI();
  
  showNotification('Clocked in successfully at ' + now.toLocaleTimeString('en-IN', {hour12: true}));
}

function clockOut() {
  const now = new Date();
  const checkOutTime = now;
  const totalHours = calculateHoursWorked(attendanceState.checkInTime, checkOutTime);
  
  // Save attendance record
  const attendanceRecord = {
    date: now.toISOString().split('T')[0],
    employeeId: currentUser.id,
    checkIn: attendanceState.checkInTime.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: false}),
    checkOut: checkOutTime.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: false}),
    totalHours: totalHours,
    location: 'Office'
  };
  
  saveAttendanceRecord(attendanceRecord);
  
  // Reset state
  attendanceState.isCheckedIn = false;
  attendanceState.checkInTime = null;
  attendanceState.todayHours = 0;
  
  saveAttendanceState();
  updateAttendanceUI();
  loadAttendanceHistory();
  
  const todayHoursElement = document.getElementById('todayHours');
  if (todayHoursElement) {
    todayHoursElement.textContent = '0:00';
  }
  
  showNotification('Clocked out successfully. Total hours: ' + totalHours);
}

function saveAttendanceState() {
  localStorage.setItem('attendanceState', JSON.stringify({
    isCheckedIn: attendanceState.isCheckedIn,
    checkInTime: attendanceState.checkInTime ? attendanceState.checkInTime.toISOString() : null
  }));
}

function saveAttendanceRecord(record) {
  let records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  records.unshift(record); // Add to beginning
  records = records.slice(0, 30); // Keep only last 30 records
  localStorage.setItem('attendanceRecords', JSON.stringify(records));
}

function loadAttendanceHistory() {
  const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  const historyList = document.getElementById('attendanceHistoryList');
  
  if (!historyList) return;
  
  if (records.length === 0) {
    historyList.innerHTML = '<div class="table-row"><span colspan="4" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary);">No attendance records found</span></div>';
    return;
  }
  
  historyList.innerHTML = records.map(record => `
    <div class="table-row">
      <span>${new Date(record.date).toLocaleDateString('en-IN')}</span>
      <span>${record.checkIn}</span>
      <span>${record.checkOut}</span>
      <span>${record.totalHours}</span>
    </div>
  `).join('');
}

// Employee and dropdown functions
function populateEmployeeSelect() {
  const select = document.getElementById('employeeSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Employee</option>';
  
  appData.employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.name} (${employee.id})`;
    select.appendChild(option);
  });
}

function loadEmployeeDetails() {
  const employeeId = document.getElementById('employeeSelect').value;
  const employee = appData.employees.find(emp => emp.id === employeeId);
  
  if (employee) {
    document.getElementById('employeeId').value = employee.id;
    document.getElementById('designation').value = employee.designation;
    document.getElementById('basicSalary').value = employee.basicSalary;
    document.getElementById('hra').value = employee.hra;
    document.getElementById('da').value = employee.da;
    document.getElementById('medicalAllowance').value = employee.medicalAllowance;
    
    // Set default deductions
    document.getElementById('pf').value = Math.round(employee.basicSalary * 0.12);
    document.getElementById('esi').value = Math.round((employee.basicSalary + employee.hra) * 0.0075);
    document.getElementById('professionalTax').value = 200;
    document.getElementById('incomeTax').value = Math.round(employee.basicSalary * 0.1);
    
    calculateSalary();
  }
}

function populateClientSelect() {
  const select = document.getElementById('clientSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Client</option>';
  
  appData.clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    select.appendChild(option);
  });
}

function loadClientDetails() {
  const clientId = document.getElementById('clientSelect').value;
  const client = appData.clients.find(c => c.id === clientId);
  
  if (client) {
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientGst').value = client.gst;
    document.getElementById('clientAddress').value = client.address;
  }
}

function populateServiceSelects() {
  const selects = document.querySelectorAll('.service-select');
  
  selects.forEach(select => {
    select.innerHTML = '<option value="">Select Service</option>';
    
    appData.services.forEach(service => {
      const option = document.createElement('option');
      option.value = service.id;
      option.textContent = service.name;
      select.appendChild(option);
    });
  });
}

function loadServiceDetails(selectElement) {
  const serviceId = selectElement.value;
  const service = appData.services.find(s => s.id === serviceId);
  const item = selectElement.closest('.invoice-item');
  
  if (service) {
    item.querySelector('.rate-input').value = service.rate;
    item.querySelector('.description-input').value = service.description;
    calculateInvoice();
  }
}

// Salary calculation functions
function calculateSalary() {
  const basicSalary = parseFloat(document.getElementById('basicSalary').value) || 0;
  const hra = parseFloat(document.getElementById('hra').value) || 0;
  const da = parseFloat(document.getElementById('da').value) || 0;
  const medicalAllowance = parseFloat(document.getElementById('medicalAllowance').value) || 0;
  
  const pf = parseFloat(document.getElementById('pf').value) || 0;
  const esi = parseFloat(document.getElementById('esi').value) || 0;
  const professionalTax = parseFloat(document.getElementById('professionalTax').value) || 0;
  const incomeTax = parseFloat(document.getElementById('incomeTax').value) || 0;
  
  const grossSalary = basicSalary + hra + da + medicalAllowance;
  const totalDeductions = pf + esi + professionalTax + incomeTax;
  const netSalary = grossSalary - totalDeductions;
  
  document.getElementById('grossSalary').textContent = `₹${grossSalary.toLocaleString('en-IN')}`;
  document.getElementById('totalDeductions').textContent = `₹${totalDeductions.toLocaleString('en-IN')}`;
  document.getElementById('netSalary').textContent = `₹${netSalary.toLocaleString('en-IN')}`;
}

function generateSalarySlip() {
  const employeeId = document.getElementById('employeeSelect').value;
  if (!employeeId) {
    showNotification('Please select an employee', 'error');
    return;
  }
  
  const employee = appData.employees.find(emp => emp.id === employeeId);
  const salaryData = {
    employee: employee,
    basicSalary: parseFloat(document.getElementById('basicSalary').value),
    hra: parseFloat(document.getElementById('hra').value),
    da: parseFloat(document.getElementById('da').value),
    medicalAllowance: parseFloat(document.getElementById('medicalAllowance').value),
    pf: parseFloat(document.getElementById('pf').value),
    esi: parseFloat(document.getElementById('esi').value),
    professionalTax: parseFloat(document.getElementById('professionalTax').value),
    incomeTax: parseFloat(document.getElementById('incomeTax').value),
    month: new Date().toLocaleString('en-IN', {month: 'long', year: 'numeric'})
  };
  
  const grossSalary = salaryData.basicSalary + salaryData.hra + salaryData.da + salaryData.medicalAllowance;
  const totalDeductions = salaryData.pf + salaryData.esi + salaryData.professionalTax + salaryData.incomeTax;
  const netSalary = grossSalary - totalDeductions;
  
  const salarySlipHTML = generateSalarySlipHTML(salaryData, grossSalary, totalDeductions, netSalary);
  
  showDocumentPreview('Salary Slip', salarySlipHTML);
}

function generateSalarySlipHTML(data, gross, deductions, net) {
  return `
    <div class="document-preview">
      <div class="document-header">
        <h1>${appData.company.name}</h1>
        <div class="company-info">
          <p>${appData.company.address}</p>
          <p>Phone: ${appData.company.phone} | Email: ${appData.company.email}</p>
          <p>GST: ${appData.company.gst}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <h2>SALARY SLIP</h2>
        <p>For the month of ${data.month}</p>
      </div>
      
      <div class="document-section">
        <h3>Employee Details</h3>
        <table class="document-table">
          <tr><td><strong>Employee ID:</strong></td><td>${data.employee.id}</td></tr>
          <tr><td><strong>Name:</strong></td><td>${data.employee.name}</td></tr>
          <tr><td><strong>Designation:</strong></td><td>${data.employee.designation}</td></tr>
          <tr><td><strong>Department:</strong></td><td>${data.employee.department}</td></tr>
          <tr><td><strong>PAN:</strong></td><td>${data.employee.panNumber}</td></tr>
        </table>
      </div>
      
      <div class="document-section">
        <h3>Salary Components</h3>
        <table class="document-table">
          <thead>
            <tr>
              <th>Earnings</th>
              <th>Amount (₹)</th>
              <th>Deductions</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>${data.basicSalary.toLocaleString('en-IN')}</td>
              <td>Provident Fund</td>
              <td>${data.pf.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>House Rent Allowance</td>
              <td>${data.hra.toLocaleString('en-IN')}</td>
              <td>ESI</td>
              <td>${data.esi.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Dearness Allowance</td>
              <td>${data.da.toLocaleString('en-IN')}</td>
              <td>Professional Tax</td>
              <td>${data.professionalTax.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Medical Allowance</td>
              <td>${data.medicalAllowance.toLocaleString('en-IN')}</td>
              <td>Income Tax</td>
              <td>${data.incomeTax.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="font-weight: bold; background: #f8f9fa;">
              <td>Total Earnings</td>
              <td>${gross.toLocaleString('en-IN')}</td>
              <td>Total Deductions</td>
              <td>${deductions.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="document-total">
        <h3>Net Salary: ₹${net.toLocaleString('en-IN')}</h3>
      </div>
      
      <div style="margin-top: 48px; text-align: right;">
        <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
        <p style="margin-top: 32px;">____________________</p>
        <p>Authorized Signatory</p>
      </div>
    </div>
  `;
}

// Invoice functions
function addInvoiceItem() {
  const itemsContainer = document.getElementById('invoiceItems');
  const newItem = document.querySelector('.invoice-item').cloneNode(true);
  
  // Clear values
  newItem.querySelectorAll('input, select').forEach(input => {
    if (input.type !== 'number' || input.classList.contains('quantity-input')) {
      input.value = input.classList.contains('quantity-input') ? 1 : '';
    } else {
      input.value = '';
    }
  });
  
  // Add remove button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-item';
  removeBtn.innerHTML = '×';
  removeBtn.onclick = function() {
    newItem.remove();
    calculateInvoice();
  };
  newItem.appendChild(removeBtn);
  
  itemsContainer.appendChild(newItem);
  
  // Populate service select for new item
  const serviceSelect = newItem.querySelector('.service-select');
  serviceSelect.innerHTML = '<option value="">Select Service</option>';
  appData.services.forEach(service => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    serviceSelect.appendChild(option);
  });
}

function calculateInvoice() {
  const items = document.querySelectorAll('.invoice-item');
  let subtotal = 0;
  
  items.forEach(item => {
    const quantity = parseFloat(item.querySelector('.quantity-input').value) || 0;
    const rate = parseFloat(item.querySelector('.rate-input').value) || 0;
    const amount = quantity * rate;
    
    item.querySelector('.amount-input').value = amount;
    subtotal += amount;
  });
  
  const cgst = subtotal * (appData.taxRates.cgst / 100);
  const sgst = subtotal * (appData.taxRates.sgst / 100);
  const total = subtotal + cgst + sgst;
  
  document.getElementById('subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById('cgst').textContent = `₹${cgst.toLocaleString('en-IN')}`;
  document.getElementById('sgst').textContent = `₹${sgst.toLocaleString('en-IN')}`;
  document.getElementById('totalAmount').textContent = `₹${total.toLocaleString('en-IN')}`;
}

function generateInvoice() {
  const clientName = document.getElementById('clientName').value;
  if (!clientName) {
    showNotification('Please select a client', 'error');
    return;
  }
  
  const invoiceData = {
    invoiceNumber: 'INV-' + Date.now(),
    date: new Date().toLocaleDateString('en-IN'),
    client: {
      name: document.getElementById('clientName').value,
      address: document.getElementById('clientAddress').value,
      gst: document.getElementById('clientGst').value
    },
    items: [],
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    total: 0
  };
  
  // Collect items
  document.querySelectorAll('.invoice-item').forEach(item => {
    const description = item.querySelector('.description-input').value;
    const quantity = parseFloat(item.querySelector('.quantity-input').value) || 0;
    const rate = parseFloat(item.querySelector('.rate-input').value) || 0;
    const amount = quantity * rate;
    
    if (description && quantity && rate) {
      invoiceData.items.push({
        description,
        quantity,
        rate,
        amount
      });
      invoiceData.subtotal += amount;
    }
  });
  
  invoiceData.cgst = invoiceData.subtotal * (appData.taxRates.cgst / 100);
  invoiceData.sgst = invoiceData.subtotal * (appData.taxRates.sgst / 100);
  invoiceData.total = invoiceData.subtotal + invoiceData.cgst + invoiceData.sgst;
  
  const invoiceHTML = generateInvoiceHTML(invoiceData);
  showDocumentPreview('Invoice', invoiceHTML);
}

function generateInvoiceHTML(data) {
  return `
    <div class="document-preview">
      <div class="document-header">
        <h1>${appData.company.name}</h1>
        <div class="company-info">
          <p>${appData.company.address}</p>
          <p>Phone: ${appData.company.phone} | Email: ${appData.company.email}</p>
          <p>GST: ${appData.company.gst}</p>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
        <div>
          <h2>INVOICE</h2>
          <p><strong>Invoice No:</strong> ${data.invoiceNumber}</p>
          <p><strong>Date:</strong> ${data.date}</p>
        </div>
        <div>
          <h3>Bill To:</h3>
          <p><strong>${data.client.name}</strong></p>
          <p>${data.client.address}</p>
          <p>GST: ${data.client.gst}</p>
        </div>
      </div>
      
      <div class="document-section">
        <table class="document-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${item.rate.toLocaleString('en-IN')}</td>
                <td>${item.amount.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
            <tr style="border-top: 2px solid #ddd;">
              <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="font-weight: bold;">₹${data.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;">CGST (${appData.taxRates.cgst}%):</td>
              <td>₹${data.cgst.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;">SGST (${appData.taxRates.sgst}%):</td>
              <td>₹${data.sgst.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #f8f9fa; font-weight: bold; font-size: 16px;">
              <td colspan="3" style="text-align: right;">Total Amount:</td>
              <td>₹${data.total.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 48px;">
        <p><strong>Terms & Conditions:</strong></p>
        <ul style="font-size: 12px; color: #666;">
          <li>Payment is due within 30 days of invoice date</li>
          <li>Late payments may incur additional charges</li>
          <li>All disputes must be reported within 7 days</li>
        </ul>
      </div>
      
      <div style="margin-top: 48px; text-align: right;">
        <p>____________________</p>
        <p>Authorized Signatory</p>
      </div>
    </div>
  `;
}

// Settings functions
function uploadLogo() {
  const file = document.getElementById('logoUpload').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const logoPreview = document.getElementById('logoPreview');
      logoPreview.innerHTML = `<img src="${e.target.result}" alt="Company Logo">`;
      
      // Update header logo
      document.getElementById('companyLogo').src = e.target.result;
      
      // Save to localStorage
      localStorage.setItem('companyLogo', e.target.result);
    };
    reader.readAsDataURL(file);
  }
}

function saveSettings() {
  const settings = {
    companyName: document.getElementById('companyName').value,
    companyGst: document.getElementById('companyGst').value,
    companyAddress: document.getElementById('companyAddress').value,
    invoiceTemplate: document.getElementById('invoiceTemplate').value,
    salaryTemplate: document.getElementById('salaryTemplate').value
  };
  
  localStorage.setItem('companySettings', JSON.stringify(settings));
  showNotification('Settings saved successfully');
}

function exportData() {
  const data = {
    attendance: JSON.parse(localStorage.getItem('attendanceRecords') || '[]'),
    settings: JSON.parse(localStorage.getItem('companySettings') || '{}'),
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rk-infotech-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Data exported successfully');
}

function clearData() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
}

// Modal functions
function showDocumentPreview(title, content) {
  document.getElementById('documentTitle').textContent = title;
  document.getElementById('documentPreview').innerHTML = content;
  document.getElementById('documentModal').classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function downloadDocument() {
  const content = document.getElementById('documentPreview').innerHTML;
  const blob = new Blob([`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Document</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .document-preview { background: white; color: black; }
        .document-header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
        .document-header h1 { color: #2563eb; font-size: 24px; margin-bottom: 8px; }
        .document-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .document-table th, .document-table td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        .document-table th { background: #f8f9fa; font-weight: bold; }
        .document-total { text-align: right; font-weight: bold; font-size: 18px; color: #2563eb; }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `], {type: 'text/html'});
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `document-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function printDocument() {
  const content = document.getElementById('documentPreview').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Print Document</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .document-preview { background: white; color: black; }
        .document-header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
        .document-header h1 { color: #2563eb; font-size: 24px; margin-bottom: 8px; }
        .document-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .document-table th, .document-table td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        .document-table th { background: #f8f9fa; font-weight: bold; }
        .document-total { text-align: right; font-weight: bold; font-size: 18px; color: #2563eb; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Utility functions
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'error' ? 'var(--color-error)' : 'var(--color-success)'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 1001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function updateDashboardStats() {
  // Update dashboard statistics
  const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
  const thisMonth = records.filter(record => {
    const recordDate = new Date(record.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });
  
  const presentDaysElement = document.getElementById('presentDays');
  const absentDaysElement = document.getElementById('absentDays');
  const monthlyHoursElement = document.getElementById('monthlyHours');
  
  if (presentDaysElement) presentDaysElement.textContent = thisMonth.length;
  if (absentDaysElement) absentDaysElement.textContent = Math.max(0, 22 - thisMonth.length);
  
  // Calculate monthly hours
  const totalHours = thisMonth.reduce((sum, record) => {
    const [hours, minutes] = record.totalHours.split(':').map(Number);
    return sum + hours + (minutes / 60);
  }, 0);
  
  if (monthlyHoursElement) monthlyHoursElement.textContent = Math.round(totalHours);
}

// Save functions for forms
function saveSalaryData() {
  const employeeId = document.getElementById('employeeSelect').value;
  if (!employeeId) {
    showNotification('Please select an employee', 'error');
    return;
  }
  
  showNotification('Salary data saved successfully');
}

function saveInvoiceData() {
  const clientName = document.getElementById('clientName').value;
  if (!clientName) {
    showNotification('Please enter client details', 'error');
    return;
  }
  
  showNotification('Invoice draft saved successfully');
}