// RK INFOTECH Business Management App JavaScript

// Application data from JSON
const appData = {
  "company": {
    "name": "RK INFOTECH",
    "address": "123 Tech Park, Bangalore, Karnataka 560001",
    "phone": "+91-9876543210",
    "email": "contact@rkinfotech.com",
    "gst": "29ABCDE1234F1Z5",
    "website": "www.rkinfotech.com",
    "bankName": "HDFC Bank",
    "bankAccount": "50100123456789",
    "ifscCode": "HDFC0001234"
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
      "conveyanceAllowance": 1000,
      "joinDate": "2023-01-15",
      "address": "123 Main Street, Bangalore",
      "emergencyContact": "9876543299"
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
      "conveyanceAllowance": 1500,
      "joinDate": "2022-06-01",
      "address": "456 Park Avenue, Bangalore",
      "emergencyContact": "9876543298"
    },
    {
      "id": "EMP003",
      "name": "Amit Singh",
      "designation": "UI/UX Designer",
      "department": "Design",
      "email": "amit@rkinfotech.com",
      "phone": "9876543213",
      "bankAccount": "3456789012345678",
      "ifsc": "HDFC0001234",
      "panNumber": "CDEFG3456H",
      "basicSalary": 45000,
      "hra": 13500,
      "da": 4500,
      "medicalAllowance": 2000,
      "conveyanceAllowance": 1000,
      "joinDate": "2023-03-20",
      "address": "789 Garden Road, Bangalore",
      "emergencyContact": "9876543297"
    }
  ],
  "clients": [
    {
      "id": "CLIENT001",
      "name": "ABC Technologies Pvt Ltd",
      "address": "456 Business Park, Mumbai, Maharashtra 400001",
      "phone": "+91-9876543220",
      "email": "info@abctech.com",
      "gst": "27FGHIJ5678K1L9",
      "contactPerson": "Mr. John Smith"
    },
    {
      "id": "CLIENT002",
      "name": "XYZ Solutions Ltd",
      "address": "789 Corporate Center, Delhi, Delhi 110001",
      "phone": "+91-9876543230",
      "email": "contact@xyzsolutions.com",
      "gst": "07MNOPQ9012R3S4",
      "contactPerson": "Ms. Sarah Johnson"
    }
  ],
  "services": [
    {
      "id": "SRV001",
      "name": "Web Development",
      "description": "Custom website development services",
      "rate": 1500,
      "unit": "hour",
      "category": "Development"
    },
    {
      "id": "SRV002",
      "name": "Mobile App Development",
      "description": "iOS and Android application development",
      "rate": 2000,
      "unit": "hour",
      "category": "Development"
    },
    {
      "id": "SRV003",
      "name": "UI/UX Design",
      "description": "User interface and experience design",
      "rate": 1200,
      "unit": "hour",
      "category": "Design"
    },
    {
      "id": "SRV004",
      "name": "Software Consultation",
      "description": "Technical consultation and strategy",
      "rate": 2500,
      "unit": "hour",
      "category": "Consultation"
    }
  ],
  "deductions": {
    "pfRate": 12,
    "esiRate": 0.75,
    "professionalTax": 200,
    "incomeTaxRate": 10
  },
  "taxRates": {
    "cgst": 9,
    "sgst": 9,
    "igst": 18
  }
};

// Global state
let currentUser = appData.employees[0];
let attendanceState = {
  isCheckedIn: false,
  checkInTime: null,
  todayHours: 0
};

let currentSalaryData = null;
let currentInvoiceData = null;
let editingEmployeeId = null;

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  updateCurrentDate();
  loadAttendanceState();
  loadEmployees();
  populateEmployeeSelect();
  populateClientSelect();
  populateServiceSelects();
  loadAttendanceHistory();
  updateDashboardStats();
  updateClock();
  setupEventListeners();
  setDefaultDates();
  
  // Update clock every second
  setInterval(updateClock, 1000);
}

function setDefaultDates() {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const todayStr = today.toISOString().slice(0, 10);
  
  const salaryPeriodInput = document.getElementById('salaryPeriod');
  if (salaryPeriodInput) {
    salaryPeriodInput.value = currentMonth;
  }
  
  const invoiceDateInput = document.getElementById('invoiceDate');
  if (invoiceDateInput) {
    invoiceDateInput.value = todayStr;
  }
  
  const dueDateInput = document.getElementById('dueDate');
  if (dueDateInput) {
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 30);
    dueDateInput.value = dueDate.toISOString().slice(0, 10);
  }
  
  // Generate invoice number
  const invoiceNumberInput = document.getElementById('invoiceNumber');
  if (invoiceNumberInput) {
    invoiceNumberInput.value = 'INV-' + Date.now();
  }
}

function setupEventListeners() {
  // Bottom navigation click handlers
  document.querySelectorAll('.nav-item').forEach(navItem => {
    navItem.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      if (tabName) {
        switchTab(tabName);
        updateActiveNav(this);
      }
    });
  });

  // Modal close handlers
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && !e.target.classList.contains('modal-content')) {
      e.target.classList.add('hidden');
    }
  });

  // Setup dropdown change handlers
  const employeeSelect = document.getElementById('employeeSelect');
  if (employeeSelect) {
    employeeSelect.addEventListener('change', loadEmployeeDetails);
  }

  const clientSelect = document.getElementById('clientSelect');
  if (clientSelect) {
    clientSelect.addEventListener('change', loadClientDetails);
  }

  // Setup service select handlers for all service dropdowns
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('service-select')) {
      loadServiceDetails(e.target);
    }
  });

  // Setup calculation handlers
  const salaryInputs = ['basicSalary', 'hra', 'da', 'medicalAllowance', 'conveyanceAllowance', 'pf', 'esi', 'professionalTax', 'incomeTax'];
  salaryInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', calculateSalary);
    }
  });

  // Setup invoice calculation handlers
  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('quantity-input') || e.target.classList.contains('rate-input')) {
      calculateInvoice();
    }
  });
}

// Tab switching functionality
function switchTab(tabName) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.remove('active'));
  
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
  } else if (tabName === 'employees') {
    loadEmployees();
  }
}

function updateActiveNav(clickedItem) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  clickedItem.classList.add('active');
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
  const currentDateElement = document.getElementById('currentDate');
  if (currentDateElement) {
    currentDateElement.textContent = now.toLocaleDateString('en-IN', options);
  }
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
  
  const attendanceRecord = {
    date: now.toISOString().split('T')[0],
    employeeId: currentUser.id,
    checkIn: attendanceState.checkInTime.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: false}),
    checkOut: checkOutTime.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: false}),
    totalHours: totalHours,
    location: 'Office'
  };
  
  saveAttendanceRecord(attendanceRecord);
  
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
  records.unshift(record);
  records = records.slice(0, 30);
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

// Employee Management Functions
function loadEmployees() {
  const employees = getEmployees();
  const employeeList = document.getElementById('employeeList');
  
  if (!employeeList) return;
  
  if (employees.length === 0) {
    employeeList.innerHTML = '<div class="employee-card"><p>No employees found. Click "Add New Employee" to get started.</p></div>';
    return;
  }
  
  employeeList.innerHTML = employees.map(employee => createEmployeeCard(employee)).join('');
  
  // Update total employees count
  const totalEmployeesElement = document.getElementById('totalEmployees');
  if (totalEmployeesElement) {
    totalEmployeesElement.textContent = employees.length;
  }
}

function createEmployeeCard(employee) {
  return `
    <div class="employee-card fade-in">
      <div class="employee-header">
        <div class="employee-info">
          <h4>${employee.name}</h4>
          <p>${employee.designation} • ${employee.department}</p>
          <p class="status-badge active">Active</p>
        </div>
        <div class="employee-actions">
          <button class="btn btn--xs btn--secondary" onclick="viewEmployee('${employee.id}')">View</button>
          <button class="btn btn--xs btn--primary" onclick="editEmployee('${employee.id}')">Edit</button>
          <button class="btn btn--xs btn--danger" onclick="confirmDeleteEmployee('${employee.id}')">Delete</button>
        </div>
      </div>
      <div class="employee-details">
        <div class="detail-group">
          <h5>Contact Information</h5>
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${employee.email}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${employee.phone}</span>
          </div>
        </div>
        <div class="detail-group">
          <h5>Employment Details</h5>
          <div class="detail-item">
            <span class="detail-label">Employee ID:</span>
            <span class="detail-value">${employee.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Join Date:</span>
            <span class="detail-value">${employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-IN') : 'N/A'}</span>
          </div>
        </div>
        <div class="detail-group">
          <h5>Salary Information</h5>
          <div class="detail-item">
            <span class="detail-label">Basic Salary:</span>
            <span class="detail-value">₹${employee.basicSalary?.toLocaleString('en-IN') || '0'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total CTC:</span>
            <span class="detail-value">₹${((employee.basicSalary || 0) + (employee.hra || 0) + (employee.da || 0) + (employee.medicalAllowance || 0) + (employee.conveyanceAllowance || 0)).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function viewEmployee(employeeId) {
  editEmployee(employeeId);
}

function showAddEmployeeModal() {
  editingEmployeeId = null;
  document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
  document.getElementById('employeeForm').reset();
  document.getElementById('empId').value = generateEmployeeId();
  document.getElementById('employeeModal').classList.remove('hidden');
}

function editEmployee(employeeId) {
  const employees = getEmployees();
  const employee = employees.find(emp => emp.id === employeeId);
  
  if (!employee) return;
  
  editingEmployeeId = employeeId;
  document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
  
  // Populate form with employee data
  document.getElementById('empId').value = employee.id;
  document.getElementById('empName').value = employee.name;
  document.getElementById('empDesignation').value = employee.designation;
  document.getElementById('empDepartment').value = employee.department;
  document.getElementById('empEmail').value = employee.email;
  document.getElementById('empPhone').value = employee.phone;
  document.getElementById('empBankAccount').value = employee.bankAccount || '';
  document.getElementById('empIfsc').value = employee.ifsc || '';
  document.getElementById('empPan').value = employee.panNumber || '';
  document.getElementById('empJoinDate').value = employee.joinDate || '';
  document.getElementById('empBasicSalary').value = employee.basicSalary || '';
  document.getElementById('empHra').value = employee.hra || '';
  document.getElementById('empDa').value = employee.da || '';
  document.getElementById('empMedical').value = employee.medicalAllowance || '';
  document.getElementById('empConveyance').value = employee.conveyanceAllowance || '';
  document.getElementById('empAddress').value = employee.address || '';
  
  document.getElementById('employeeModal').classList.remove('hidden');
}

function saveEmployee() {
  const form = document.getElementById('employeeForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const employeeData = {
    id: document.getElementById('empId').value,
    name: document.getElementById('empName').value,
    designation: document.getElementById('empDesignation').value,
    department: document.getElementById('empDepartment').value,
    email: document.getElementById('empEmail').value,
    phone: document.getElementById('empPhone').value,
    bankAccount: document.getElementById('empBankAccount').value,
    ifsc: document.getElementById('empIfsc').value,
    panNumber: document.getElementById('empPan').value,
    joinDate: document.getElementById('empJoinDate').value,
    basicSalary: parseFloat(document.getElementById('empBasicSalary').value) || 0,
    hra: parseFloat(document.getElementById('empHra').value) || 0,
    da: parseFloat(document.getElementById('empDa').value) || 0,
    medicalAllowance: parseFloat(document.getElementById('empMedical').value) || 0,
    conveyanceAllowance: parseFloat(document.getElementById('empConveyance').value) || 0,
    address: document.getElementById('empAddress').value
  };
  
  let employees = getEmployees();
  
  if (editingEmployeeId) {
    // Update existing employee
    const index = employees.findIndex(emp => emp.id === editingEmployeeId);
    if (index !== -1) {
      employees[index] = employeeData;
      showNotification('Employee updated successfully');
    }
  } else {
    // Add new employee
    employees.push(employeeData);
    showNotification('Employee added successfully');
  }
  
  saveEmployees(employees);
  closeModal('employeeModal');
  loadEmployees();
  populateEmployeeSelect();
}

function confirmDeleteEmployee(employeeId) {
  const employees = getEmployees();
  const employee = employees.find(emp => emp.id === employeeId);
  
  if (!employee) return;
  
  showConfirmModal(
    'Delete Employee',
    `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
    () => deleteEmployee(employeeId)
  );
}

function deleteEmployee(employeeId) {
  let employees = getEmployees();
  employees = employees.filter(emp => emp.id !== employeeId);
  
  saveEmployees(employees);
  loadEmployees();
  populateEmployeeSelect();
  showNotification('Employee deleted successfully');
}

function filterEmployees() {
  const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
  const departmentFilter = document.getElementById('departmentFilter').value;
  
  const employeeCards = document.querySelectorAll('.employee-card');
  
  employeeCards.forEach(card => {
    const name = card.querySelector('h4').textContent.toLowerCase();
    const designation = card.querySelector('p').textContent.toLowerCase();
    const department = card.querySelector('p').textContent.split('•')[1]?.trim();
    
    const matchesSearch = name.includes(searchTerm) || designation.includes(searchTerm);
    const matchesDepartment = !departmentFilter || department === departmentFilter;
    
    if (matchesSearch && matchesDepartment) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function generateEmployeeId() {
  const employees = getEmployees();
  const lastId = employees.length > 0 ? 
    Math.max(...employees.map(emp => parseInt(emp.id.replace('EMP', '')))) : 0;
  return 'EMP' + String(lastId + 1).padStart(3, '0');
}

function getEmployees() {
  const stored = localStorage.getItem('employees');
  return stored ? JSON.parse(stored) : appData.employees;
}

function saveEmployees(employees) {
  localStorage.setItem('employees', JSON.stringify(employees));
}

// Employee and dropdown functions
function populateEmployeeSelect() {
  const select = document.getElementById('employeeSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Employee</option>';
  
  const employees = getEmployees();
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.name} (${employee.id})`;
    select.appendChild(option);
  });
}

function loadEmployeeDetails() {
  const employeeSelect = document.getElementById('employeeSelect');
  const employeeId = employeeSelect.value;
  const employees = getEmployees();
  const employee = employees.find(emp => emp.id === employeeId);
  
  if (employee) {
    document.getElementById('employeeId').value = employee.id;
    document.getElementById('designation').value = employee.designation;
    document.getElementById('basicSalary').value = employee.basicSalary || 0;
    document.getElementById('hra').value = employee.hra || 0;
    document.getElementById('da').value = employee.da || 0;
    document.getElementById('medicalAllowance').value = employee.medicalAllowance || 0;
    document.getElementById('conveyanceAllowance').value = employee.conveyanceAllowance || 0;
    
    // Calculate deductions
    const basicSalary = employee.basicSalary || 0;
    const grossForPF = basicSalary + (employee.hra || 0);
    
    document.getElementById('pf').value = Math.round(basicSalary * (appData.deductions.pfRate / 100));
    document.getElementById('esi').value = Math.round(grossForPF * (appData.deductions.esiRate / 100));
    document.getElementById('professionalTax').value = appData.deductions.professionalTax;
    document.getElementById('incomeTax').value = Math.round(basicSalary * (appData.deductions.incomeTaxRate / 100));
    
    calculateSalary();
  } else {
    // Clear fields if no employee selected
    const fields = ['employeeId', 'designation', 'basicSalary', 'hra', 'da', 'medicalAllowance', 'conveyanceAllowance', 'pf', 'esi', 'professionalTax', 'incomeTax'];
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
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
  const clientSelect = document.getElementById('clientSelect');
  const clientId = clientSelect.value;
  const client = appData.clients.find(c => c.id === clientId);
  
  if (client) {
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientGst').value = client.gst;
    document.getElementById('clientAddress').value = client.address;
  } else {
    // Clear fields if no client selected
    document.getElementById('clientName').value = '';
    document.getElementById('clientGst').value = '';
    document.getElementById('clientAddress').value = '';
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
  
  if (service && item) {
    item.querySelector('.rate-input').value = service.rate;
    item.querySelector('.description-input').value = service.description;
    calculateInvoice();
  } else if (item) {
    // Clear fields if no service selected
    item.querySelector('.rate-input').value = '';
    item.querySelector('.description-input').value = '';
    calculateInvoice();
  }
}

// Salary calculation functions
function calculateSalary() {
  const basicSalary = parseFloat(document.getElementById('basicSalary').value) || 0;
  const hra = parseFloat(document.getElementById('hra').value) || 0;
  const da = parseFloat(document.getElementById('da').value) || 0;
  const medicalAllowance = parseFloat(document.getElementById('medicalAllowance').value) || 0;
  const conveyanceAllowance = parseFloat(document.getElementById('conveyanceAllowance').value) || 0;
  
  const pf = parseFloat(document.getElementById('pf').value) || 0;
  const esi = parseFloat(document.getElementById('esi').value) || 0;
  const professionalTax = parseFloat(document.getElementById('professionalTax').value) || 0;
  const incomeTax = parseFloat(document.getElementById('incomeTax').value) || 0;
  
  const grossSalary = basicSalary + hra + da + medicalAllowance + conveyanceAllowance;
  const totalDeductions = pf + esi + professionalTax + incomeTax;
  const netSalary = grossSalary - totalDeductions;
  
  const grossElement = document.getElementById('grossSalary');
  const deductionsElement = document.getElementById('totalDeductions');
  const netElement = document.getElementById('netSalary');
  
  if (grossElement) grossElement.textContent = `₹${grossSalary.toLocaleString('en-IN')}`;
  if (deductionsElement) deductionsElement.textContent = `₹${totalDeductions.toLocaleString('en-IN')}`;
  if (netElement) netElement.textContent = `₹${netSalary.toLocaleString('en-IN')}`;
}

function previewSalarySlip() {
  const employeeId = document.getElementById('employeeSelect').value;
  if (!employeeId) {
    showNotification('Please select an employee', 'error');
    return;
  }
  
  const employees = getEmployees();
  const employee = employees.find(emp => emp.id === employeeId);
  const salaryPeriod = document.getElementById('salaryPeriod').value;
  
  currentSalaryData = {
    employee: employee,
    period: salaryPeriod,
    basicSalary: parseFloat(document.getElementById('basicSalary').value),
    hra: parseFloat(document.getElementById('hra').value),
    da: parseFloat(document.getElementById('da').value),
    medicalAllowance: parseFloat(document.getElementById('medicalAllowance').value),
    conveyanceAllowance: parseFloat(document.getElementById('conveyanceAllowance').value),
    pf: parseFloat(document.getElementById('pf').value),
    esi: parseFloat(document.getElementById('esi').value),
    professionalTax: parseFloat(document.getElementById('professionalTax').value),
    incomeTax: parseFloat(document.getElementById('incomeTax').value)
  };
  
  const grossSalary = currentSalaryData.basicSalary + currentSalaryData.hra + currentSalaryData.da + 
    currentSalaryData.medicalAllowance + currentSalaryData.conveyanceAllowance;
  const totalDeductions = currentSalaryData.pf + currentSalaryData.esi + currentSalaryData.professionalTax + currentSalaryData.incomeTax;
  const netSalary = grossSalary - totalDeductions;
  
  const salarySlipHTML = generateSalarySlipHTML(currentSalaryData, grossSalary, totalDeductions, netSalary);
  
  showDocumentPreview('Salary Slip Preview', salarySlipHTML);
  document.getElementById('downloadSalaryBtn').disabled = false;
}

function downloadSalaryPDF() {
  if (!currentSalaryData) {
    showNotification('Please preview the salary slip first', 'error');
    return;
  }
  
  showLoading();
  
  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Company header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(appData.company.name, 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(appData.company.address, 105, 30, { align: 'center' });
      doc.text(`Phone: ${appData.company.phone} | Email: ${appData.company.email}`, 105, 35, { align: 'center' });
      doc.text(`GST: ${appData.company.gst}`, 105, 40, { align: 'center' });
      
      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SALARY SLIP', 105, 55, { align: 'center' });
      
      const periodDate = new Date(currentSalaryData.period + '-01');
      doc.setFontSize(12);
      doc.text(`For the month of ${periodDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`, 105, 65, { align: 'center' });
      
      // Employee details table
      const empDetails = [
        ['Employee ID', currentSalaryData.employee.id, 'Name', currentSalaryData.employee.name],
        ['Designation', currentSalaryData.employee.designation, 'Department', currentSalaryData.employee.department],
        ['PAN Number', currentSalaryData.employee.panNumber || 'N/A', 'Bank A/C', currentSalaryData.employee.bankAccount || 'N/A']
      ];
      
      doc.autoTable({
        startY: 75,
        head: [['Employee Details', '', '', '']],
        body: empDetails,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
        margin: { left: 20, right: 20 }
      });
      
      // Salary components table
      const grossSalary = currentSalaryData.basicSalary + currentSalaryData.hra + currentSalaryData.da + 
        currentSalaryData.medicalAllowance + currentSalaryData.conveyanceAllowance;
      const totalDeductions = currentSalaryData.pf + currentSalaryData.esi + currentSalaryData.professionalTax + currentSalaryData.incomeTax;
      const netSalary = grossSalary - totalDeductions;
      
      const salaryData = [
        ['Basic Salary', `₹${currentSalaryData.basicSalary.toLocaleString('en-IN')}`, 'Provident Fund', `₹${currentSalaryData.pf.toLocaleString('en-IN')}`],
        ['HRA', `₹${currentSalaryData.hra.toLocaleString('en-IN')}`, 'ESI', `₹${currentSalaryData.esi.toLocaleString('en-IN')}`],
        ['DA', `₹${currentSalaryData.da.toLocaleString('en-IN')}`, 'Professional Tax', `₹${currentSalaryData.professionalTax.toLocaleString('en-IN')}`],
        ['Medical Allowance', `₹${currentSalaryData.medicalAllowance.toLocaleString('en-IN')}`, 'Income Tax', `₹${currentSalaryData.incomeTax.toLocaleString('en-IN')}`],
        ['Conveyance Allowance', `₹${currentSalaryData.conveyanceAllowance.toLocaleString('en-IN')}`, '', ''],
        ['Total Earnings', `₹${grossSalary.toLocaleString('en-IN')}`, 'Total Deductions', `₹${totalDeductions.toLocaleString('en-IN')}`]
      ];
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Earnings', 'Amount (₹)', 'Deductions', 'Amount (₹)']],
        body: salaryData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 },
        columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 20, right: 20 }
      });
      
      // Net salary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Net Salary: ₹${netSalary.toLocaleString('en-IN')}`, 105, doc.lastAutoTable.finalY + 20, { align: 'center' });
      
      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, doc.internal.pageSize.height - 30);
      doc.text('Authorized Signatory', 150, doc.internal.pageSize.height - 20);
      doc.line(140, doc.internal.pageSize.height - 25, 190, doc.internal.pageSize.height - 25);
      
      // Save PDF
      const fileName = `salary-slip-${currentSalaryData.employee.name.replace(/\s+/g, '-')}-${currentSalaryData.period}.pdf`;
      doc.save(fileName);
      
      hideLoading();
      showNotification('Salary slip PDF downloaded successfully');
      
    } catch (error) {
      hideLoading();
      showNotification('Error generating PDF: ' + error.message, 'error');
    }
  }, 1000);
}

function generateSalarySlipHTML(data, gross, deductions, net) {
  const periodDate = new Date(data.period + '-01');
  const monthYear = periodDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  
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
        <p>For the month of ${monthYear}</p>
      </div>
      
      <div class="document-section">
        <h3>Employee Details</h3>
        <table class="document-table">
          <tr><td><strong>Employee ID:</strong></td><td>${data.employee.id}</td></tr>
          <tr><td><strong>Name:</strong></td><td>${data.employee.name}</td></tr>
          <tr><td><strong>Designation:</strong></td><td>${data.employee.designation}</td></tr>
          <tr><td><strong>Department:</strong></td><td>${data.employee.department}</td></tr>
          <tr><td><strong>PAN:</strong></td><td>${data.employee.panNumber || 'N/A'}</td></tr>
          <tr><td><strong>Bank A/C:</strong></td><td>${data.employee.bankAccount || 'N/A'}</td></tr>
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
            <tr>
              <td>Conveyance Allowance</td>
              <td>${data.conveyanceAllowance.toLocaleString('en-IN')}</td>
              <td></td>
              <td></td>
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
  
  const subtotalElement = document.getElementById('subtotal');
  const cgstElement = document.getElementById('cgst');
  const sgstElement = document.getElementById('sgst');
  const totalElement = document.getElementById('totalAmount');
  
  if (subtotalElement) subtotalElement.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (cgstElement) cgstElement.textContent = `₹${cgst.toLocaleString('en-IN')}`;
  if (sgstElement) sgstElement.textContent = `₹${sgst.toLocaleString('en-IN')}`;
  if (totalElement) totalElement.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function previewInvoice() {
  const clientName = document.getElementById('clientName').value;
  if (!clientName) {
    showNotification('Please select a client', 'error');
    return;
  }
  
  currentInvoiceData = {
    invoiceNumber: document.getElementById('invoiceNumber').value,
    date: document.getElementById('invoiceDate').value,
    dueDate: document.getElementById('dueDate').value,
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
      currentInvoiceData.items.push({
        description,
        quantity,
        rate,
        amount
      });
      currentInvoiceData.subtotal += amount;
    }
  });
  
  if (currentInvoiceData.items.length === 0) {
    showNotification('Please add at least one item to the invoice', 'error');
    return;
  }
  
  currentInvoiceData.cgst = currentInvoiceData.subtotal * (appData.taxRates.cgst / 100);
  currentInvoiceData.sgst = currentInvoiceData.subtotal * (appData.taxRates.sgst / 100);
  currentInvoiceData.total = currentInvoiceData.subtotal + currentInvoiceData.cgst + currentInvoiceData.sgst;
  
  const invoiceHTML = generateInvoiceHTML(currentInvoiceData);
  showDocumentPreview('Invoice Preview', invoiceHTML);
  document.getElementById('downloadInvoiceBtn').disabled = false;
}

function downloadInvoicePDF() {
  if (!currentInvoiceData) {
    showNotification('Please preview the invoice first', 'error');
    return;
  }
  
  showLoading();
  
  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Company header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(appData.company.name, 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(appData.company.address, 20, 30);
      doc.text(`Phone: ${appData.company.phone}`, 20, 35);
      doc.text(`Email: ${appData.company.email}`, 20, 40);
      doc.text(`GST: ${appData.company.gst}`, 20, 45);
      
      // Invoice title and details
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 150, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${currentInvoiceData.invoiceNumber}`, 150, 40);
      doc.text(`Date: ${new Date(currentInvoiceData.date).toLocaleDateString('en-IN')}`, 150, 45);
      doc.text(`Due Date: ${new Date(currentInvoiceData.dueDate).toLocaleDateString('en-IN')}`, 150, 50);
      
      // Client details
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(currentInvoiceData.client.name, 20, 75);
      const addressLines = doc.splitTextToSize(currentInvoiceData.client.address, 100);
      doc.text(addressLines, 20, 80);
      doc.text(`GST: ${currentInvoiceData.client.gst}`, 20, 80 + (addressLines.length * 5) + 5);
      
      // Items table
      const tableData = currentInvoiceData.items.map(item => [
        item.description,
        item.quantity.toString(),
        `₹${item.rate.toLocaleString('en-IN')}`,
        `₹${item.amount.toLocaleString('en-IN')}`
      ]);
      
      // Add summary rows
      tableData.push(
        ['', '', 'Subtotal:', `₹${currentInvoiceData.subtotal.toLocaleString('en-IN')}`],
        ['', '', `CGST (${appData.taxRates.cgst}%):`, `₹${currentInvoiceData.cgst.toLocaleString('en-IN')}`],
        ['', '', `SGST (${appData.taxRates.sgst}%):`, `₹${currentInvoiceData.sgst.toLocaleString('en-IN')}`],
        ['', '', 'Total Amount:', `₹${currentInvoiceData.total.toLocaleString('en-IN')}`]
      );
      
      doc.autoTable({
        startY: 110,
        head: [['Description', 'Qty', 'Rate (₹)', 'Amount (₹)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 },
        columnStyles: { 
          1: { halign: 'center' }, 
          2: { halign: 'right' }, 
          3: { halign: 'right' } 
        },
        margin: { left: 20, right: 20 },
        didParseCell: function (data) {
          if (data.row.index >= tableData.length - 4) {
            data.cell.styles.fontStyle = 'bold';
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontSize = 12;
            }
          }
        }
      });
      
      // Terms and conditions
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', 20, doc.lastAutoTable.finalY + 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const terms = [
        '• Payment is due within 30 days of invoice date',
        '• Late payments may incur additional charges',
        '• All disputes must be reported within 7 days'
      ];
      
      terms.forEach((term, index) => {
        doc.text(term, 20, doc.lastAutoTable.finalY + 30 + (index * 5));
      });
      
      // Signature
      doc.text('Authorized Signatory', 150, doc.internal.pageSize.height - 20);
      doc.line(140, doc.internal.pageSize.height - 25, 190, doc.internal.pageSize.height - 25);
      
      // Save PDF
      const fileName = `invoice-${currentInvoiceData.invoiceNumber}.pdf`;
      doc.save(fileName);
      
      hideLoading();
      showNotification('Invoice PDF downloaded successfully');
      
    } catch (error) {
      hideLoading();
      showNotification('Error generating PDF: ' + error.message, 'error');
    }
  }, 1000);
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
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString('en-IN')}</p>
          <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString('en-IN')}</p>
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
      
      document.getElementById('companyLogo').src = e.target.result;
      
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
    employees: JSON.parse(localStorage.getItem('employees') || '[]'),
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
  showConfirmModal(
    'Clear All Data',
    'Are you sure you want to clear all data? This action cannot be undone.',
    () => {
      localStorage.clear();
      location.reload();
    }
  );
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

function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmOkBtn').onclick = function() {
    onConfirm();
    closeModal('confirmModal');
  };
  document.getElementById('confirmModal').classList.remove('hidden');
}

function showLoading() {
  document.getElementById('loadingModal').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingModal').classList.add('hidden');
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
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function updateDashboardStats() {
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
  
  const totalHours = thisMonth.reduce((sum, record) => {
    const [hours, minutes] = record.totalHours.split(':').map(Number);
    return sum + hours + (minutes / 60);
  }, 0);
  
  if (monthlyHoursElement) monthlyHoursElement.textContent = Math.round(totalHours);
}