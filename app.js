// RK INFOTECH Business Management App with Supabase Integration

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://tgnriyzxnkglnwahjdhi.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbnJpeXp4bmtnbG53YWhqZGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDI2MjAsImV4cCI6MjA3NTE3ODYyMH0.FZRWkiZYU3srY0kH0IewZfoQKocmOHuCsOsrBM1sZSI'
};

// Database Service Layer
class DatabaseService {
  constructor() {
    this.supabase = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.initializeSupabase();
  }

  async initializeSupabase() {
    try {
      if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Supabase not configured. Using local storage fallback.');
        this.updateConnectionStatus(false, 'Not configured');
        return;
      }

      this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      
      // Test connection
      const { data, error } = await this.supabase.from('company_settings').select('*').limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist - show setup instructions
        this.updateConnectionStatus(false, 'Database schema not set up');
        this.showSchemaSetupInstructions();
      } else if (error) {
        throw error;
      } else {
        this.isConnected = true;
        this.updateConnectionStatus(true, 'Connected');
        await this.setupRealtimeSubscriptions();
      }
    } catch (error) {
      console.error('Supabase initialization error:', error);
      this.updateConnectionStatus(false, `Error: ${error.message}`);
    }
  }

  updateConnectionStatus(connected, message) {
    this.isConnected = connected;
    
    const connectionDot = document.getElementById('connectionDot');
    const connectionText = document.getElementById('connectionText');
    const headerStatusDot = document.getElementById('headerStatusDot');
    const cloudStatusBadge = document.getElementById('cloudStatusBadge');

    if (connectionDot) {
      connectionDot.className = `connection-dot ${connected ? 'connected' : 'disconnected'}`;
    }
    
    if (connectionText) {
      connectionText.textContent = message;
    }

    if (headerStatusDot) {
      headerStatusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    }

    if (cloudStatusBadge) {
      cloudStatusBadge.className = `status-badge ${connected ? 'active' : 'offline'}`;
      cloudStatusBadge.innerHTML = connected ? 
        '<div class="loading-dot"></div>Synced' : 
        '<div class="loading-dot"></div>Offline';
    }

    // Update database configuration status
    const dbConfigStatus = document.getElementById('dbConfigStatus');
    if (dbConfigStatus) {
      if (connected) {
        dbConfigStatus.innerHTML = '<p class="config-message text-success">✅ Database connected and ready</p>';
      } else {
        dbConfigStatus.innerHTML = `<p class="config-message text-error">❌ ${message}</p>`;
      }
    }

    // Show/hide offline banner
    this.toggleOfflineBanner(!connected);
  }

  toggleOfflineBanner(show) {
    let banner = document.getElementById('offlineBanner');
    if (show && !banner) {
      banner = document.createElement('div');
      banner.id = 'offlineBanner';
      banner.className = 'offline-mode';
      banner.innerHTML = '📡 Working in offline mode - Changes will sync when connection is restored';
      document.body.appendChild(banner);
    } else if (!show && banner) {
      banner.remove();
    }
  }

  showSchemaSetupInstructions() {
    const setupStatus = document.getElementById('setupStatus');
    if (setupStatus) {
      setupStatus.innerHTML = `
        <div class="status-indicator">
          <div class="status-dot disconnected"></div>
          <span>Database schema setup required</span>
        </div>
        <div class="setup-sql" style="margin-top: 16px;">
          <h5>Run these SQL commands in your Supabase SQL Editor:</h5>
          <textarea class="form-control" rows="10" readonly style="font-family: monospace; font-size: 12px;">
-- Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT,
  department TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  bank_account TEXT,
  ifsc TEXT,
  pan_number TEXT,
  basic_salary DECIMAL(10,2),
  hra DECIMAL(10,2),
  da DECIMAL(10,2),
  medical_allowance DECIMAL(10,2),
  conveyance_allowance DECIMAL(10,2),
  join_date DATE,
  address TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  total_hours INTERVAL,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_gst TEXT,
  items JSONB,
  total_amount DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  grand_total DECIMAL(10,2),
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  gst TEXT,
  contact_person TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create company_settings table
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  gst TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
          </textarea>
          <p style="margin-top: 12px; font-size: 12px; color: var(--color-text-secondary);">
            After running these commands, refresh the page to reconnect.
          </p>
        </div>
      `;
    }
  }

  async setupRealtimeSubscriptions() {
    if (!this.supabase || !this.isConnected) return;

    try {
      // Subscribe to employees changes
      const employeesSubscription = this.supabase
        .channel('employees-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'employees' },
          (payload) => this.handleRealtimeUpdate('employees', payload)
        )
        .subscribe();

      // Subscribe to attendance changes  
      const attendanceSubscription = this.supabase
        .channel('attendance-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'attendance' },
          (payload) => this.handleRealtimeUpdate('attendance', payload)
        )
        .subscribe();

      // Subscribe to invoices changes
      const invoicesSubscription = this.supabase
        .channel('invoices-changes')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'invoices' },
          (payload) => this.handleRealtimeUpdate('invoices', payload)
        )
        .subscribe();

      this.subscriptions.set('employees', employeesSubscription);
      this.subscriptions.set('attendance', attendanceSubscription);
      this.subscriptions.set('invoices', invoicesSubscription);

      console.log('Real-time subscriptions established');
      this.showSyncIndicators(true);

    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
  }

  handleRealtimeUpdate(table, payload) {
    console.log(`Real-time update for ${table}:`, payload);
    
    // Show sync indicators
    const syncIndicator = document.getElementById(`${table}Sync`);
    if (syncIndicator) {
      syncIndicator.classList.add('syncing');
      setTimeout(() => syncIndicator.classList.remove('syncing'), 1000);
    }

    // Refresh relevant UI sections
    switch (table) {
      case 'employees':
        if (getCurrentActiveTab() === 'employees') {
          loadEmployees();
        }
        populateEmployeeSelect();
        updateDashboardStats();
        break;
      case 'attendance':
        if (getCurrentActiveTab() === 'attendance') {
          loadAttendanceHistory();
        }
        updateDashboardStats();
        break;
      case 'invoices':
        updateDashboardStats();
        break;
    }

    showNotification(`${table} updated in real-time`, 'info');
  }

  showSyncIndicators(active) {
    const indicators = ['attendanceRealtime', 'payrollRealtime', 'settingsRealtime'];
    indicators.forEach(id => {
      const indicator = document.getElementById(id);
      if (indicator) {
        indicator.style.display = active ? 'flex' : 'none';
      }
    });
  }

  // CRUD operations with fallback to localStorage
  async getEmployees() {
    if (!this.isConnected) {
      return JSON.parse(localStorage.getItem('employees') || '[]');
    }

    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cache locally
      localStorage.setItem('employees', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('Error loading employees from database', 'error');
      return JSON.parse(localStorage.getItem('employees') || '[]');
    }
  }

  async saveEmployee(employee) {
    // Always save to localStorage first
    let employees = JSON.parse(localStorage.getItem('employees') || '[]');
    
    if (employee.id && employees.find(e => e.id === employee.id)) {
      // Update existing
      employees = employees.map(e => e.id === employee.id ? employee : e);
    } else {
      // Add new
      if (!employee.id) {
        employee.id = this.generateId();
      }
      employees.push(employee);
    }
    
    localStorage.setItem('employees', JSON.stringify(employees));

    // Try to save to Supabase if connected
    if (this.isConnected) {
      try {
        const { data, error } = await this.supabase
          .from('employees')
          .upsert([employee])
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error('Error saving employee to database:', error);
        showNotification('Saved locally - will sync when online', 'warning');
      }
    }

    return employee;
  }

  async deleteEmployee(employeeId) {
    // Remove from localStorage
    let employees = JSON.parse(localStorage.getItem('employees') || '[]');
    employees = employees.filter(e => e.id !== employeeId);
    localStorage.setItem('employees', JSON.stringify(employees));

    // Try to delete from Supabase if connected
    if (this.isConnected) {
      try {
        const { error } = await this.supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting employee from database:', error);
        showNotification('Deleted locally - will sync when online', 'warning');
      }
    }
  }

  async getAttendance(limit = 30) {
    if (!this.isConnected) {
      return JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    }

    try {
      const { data, error } = await this.supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Cache locally
      localStorage.setItem('attendanceRecords', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showNotification('Error loading attendance from database', 'error');
      return JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    }
  }

  async saveAttendance(attendance) {
    // Always save to localStorage first
    let records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    records.unshift(attendance);
    records = records.slice(0, 30);
    localStorage.setItem('attendanceRecords', JSON.stringify(records));

    // Try to save to Supabase if connected
    if (this.isConnected) {
      try {
        const { data, error } = await this.supabase
          .from('attendance')
          .insert([{
            ...attendance,
            id: this.generateId(),
            employee_id: attendance.employeeId
          }])
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error('Error saving attendance to database:', error);
        showNotification('Attendance saved locally - will sync when online', 'warning');
      }
    }

    return attendance;
  }

  async getClients() {
    if (!this.isConnected) {
      return appData.clients; // Use static data as fallback
    }

    try {
      const { data, error } = await this.supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.length > 0 ? data : appData.clients;
    } catch (error) {
      console.error('Error fetching clients:', error);
      return appData.clients;
    }
  }

  async saveInvoice(invoice) {
    // Always save to localStorage first
    let invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    
    if (!invoice.id) {
      invoice.id = this.generateId();
    }
    
    invoices.unshift(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));

    // Try to save to Supabase if connected
    if (this.isConnected) {
      try {
        const { data, error } = await this.supabase
          .from('invoices')
          .insert([invoice])
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error('Error saving invoice to database:', error);
        showNotification('Invoice saved locally - will sync when online', 'warning');
      }
    }

    return invoice;
  }

  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async syncAllData() {
    if (!this.isConnected) {
      showNotification('Cannot sync - database not connected', 'error');
      return;
    }

    showNotification('Starting data synchronization...', 'info');
    setButtonLoading('syncAllBtn', true);

    try {
      // Sync employees
      const localEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
      for (const employee of localEmployees) {
        await this.saveEmployee(employee);
      }

      // Sync attendance
      const localAttendance = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      for (const record of localAttendance) {
        await this.saveAttendance(record);
      }

      // Update last sync timestamp
      localStorage.setItem('lastSync', new Date().toISOString());
      updateLastSyncDisplay();

      showNotification('Data synchronization completed', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      showNotification('Synchronization failed: ' + error.message, 'error');
    } finally {
      setButtonLoading('syncAllBtn', false);
    }
  }
}

// Initialize database service
const db = new DatabaseService();

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
      "bank_account": "1234567890123456",
      "ifsc": "HDFC0001234",
      "pan_number": "ABCDE1234F",
      "basic_salary": 50000,
      "hra": 15000,
      "da": 5000,
      "medical_allowance": 2000,
      "conveyance_allowance": 1000,
      "join_date": "2023-01-15",
      "address": "123 Main Street, Bangalore",
      "emergency_contact": "9876543299"
    },
    {
      "id": "EMP002",
      "name": "Priya Sharma",
      "designation": "Project Manager",
      "department": "IT",
      "email": "priya@rkinfotech.com",
      "phone": "9876543212",
      "bank_account": "2345678901234567",
      "ifsc": "HDFC0001234",
      "pan_number": "BCDEF2345G",
      "basic_salary": 75000,
      "hra": 22500,
      "da": 7500,
      "medical_allowance": 3000,
      "conveyance_allowance": 1500,
      "join_date": "2022-06-01",
      "address": "456 Park Avenue, Bangalore",
      "emergency_contact": "9876543298"
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
      "contact_person": "Mr. John Smith"
    },
    {
      "id": "CLIENT002",
      "name": "XYZ Solutions Ltd",
      "address": "789 Corporate Center, Delhi, Delhi 110001",
      "phone": "+91-9876543230",
      "email": "contact@xyzsolutions.com",
      "gst": "07MNOPQ9012R3S4",
      "contact_person": "Ms. Sarah Johnson"
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
  updateLastSyncDisplay();
  
  // Initialize with sample data if no employees exist
  initializeDefaultData();
  
  // Update clock every second
  setInterval(updateClock, 1000);
}

async function initializeDefaultData() {
  try {
    const employees = await db.getEmployees();
    if (employees.length === 0) {
      // Save default employees to database
      for (const employee of appData.employees) {
        await db.saveEmployee(employee);
      }
      showNotification('Default data initialized', 'info');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

function getCurrentActiveTab() {
  const activeSection = document.querySelector('.section.active');
  return activeSection ? activeSection.id : 'dashboard';
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

async function clockIn() {
  setButtonLoading('clockInBtn', true);
  
  try {
    const now = new Date();
    attendanceState.isCheckedIn = true;
    attendanceState.checkInTime = now;
    
    saveAttendanceState();
    updateAttendanceUI();
    
    showNotification('Clocked in successfully at ' + now.toLocaleTimeString('en-IN', {hour12: true}));
  } catch (error) {
    showNotification('Error clocking in: ' + error.message, 'error');
  } finally {
    setButtonLoading('clockInBtn', false);
  }
}

async function clockOut() {
  setButtonLoading('clockOutBtn', true);
  
  try {
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
    
    await db.saveAttendance(attendanceRecord);
    
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
  } catch (error) {
    showNotification('Error clocking out: ' + error.message, 'error');
  } finally {
    setButtonLoading('clockOutBtn', false);
  }
}

function saveAttendanceState() {
  localStorage.setItem('attendanceState', JSON.stringify({
    isCheckedIn: attendanceState.isCheckedIn,
    checkInTime: attendanceState.checkInTime ? attendanceState.checkInTime.toISOString() : null
  }));
}

async function loadAttendanceHistory() {
  const historyList = document.getElementById('attendanceHistoryList');
  
  if (!historyList) return;
  
  try {
    const records = await db.getAttendance();
    
    if (records.length === 0) {
      historyList.innerHTML = '<div class="table-row"><span style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary);">No attendance records found</span></div>';
      return;
    }
    
    historyList.innerHTML = records.map(record => `
      <div class="table-row">
        <span>${new Date(record.date).toLocaleDateString('en-IN')}</span>
        <span>${record.checkIn || record.check_in}</span>
        <span>${record.checkOut || record.check_out}</span>
        <span>${record.totalHours || record.total_hours}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading attendance history:', error);
    historyList.innerHTML = '<div class="table-row"><span style="grid-column: 1 / -1; text-align: center; color: var(--color-error);">Error loading attendance records</span></div>';
  }
}

async function refreshAttendanceHistory() {
  setButtonLoading('refreshAttendanceBtn', true);
  try {
    await loadAttendanceHistory();
    showNotification('Attendance history refreshed', 'success');
  } catch (error) {
    showNotification('Error refreshing attendance: ' + error.message, 'error');
  } finally {
    setButtonLoading('refreshAttendanceBtn', false);
  }
}

// Employee Management Functions
async function loadEmployees() {
  const employeeList = document.getElementById('employeeList');
  
  if (!employeeList) return;
  
  try {
    const employees = await db.getEmployees();
    
    if (employees.length === 0) {
      employeeList.innerHTML = '<div class="employee-card"><p>No employees found. Click "Add New Employee" to get started.</p></div>';
      return;
    }
    
    employeeList.innerHTML = employees.map(employee => createEmployeeCard(employee)).join('');
    
    // Update total employees count
    const totalEmployeesElement = document.getElementById('totalEmployees');
    if (totalEmployeesElement) {
      totalEmployeesElement.innerHTML = employees.length;
    }
  } catch (error) {
    console.error('Error loading employees:', error);
    employeeList.innerHTML = '<div class="employee-card"><p class="text-error">Error loading employees</p></div>';
  }
}

async function refreshEmployees() {
  setButtonLoading('refreshEmployeesBtn', true);
  try {
    await loadEmployees();
    await populateEmployeeSelect();
    showNotification('Employees refreshed', 'success');
  } catch (error) {
    showNotification('Error refreshing employees: ' + error.message, 'error');
  } finally {
    setButtonLoading('refreshEmployeesBtn', false);
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
            <span class="detail-value">${employee.join_date || employee.joinDate ? new Date(employee.join_date || employee.joinDate).toLocaleDateString('en-IN') : 'N/A'}</span>
          </div>
        </div>
        <div class="detail-group">
          <h5>Salary Information</h5>
          <div class="detail-item">
            <span class="detail-label">Basic Salary:</span>
            <span class="detail-value">₹${(employee.basic_salary || employee.basicSalary || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total CTC:</span>
            <span class="detail-value">₹${((employee.basic_salary || employee.basicSalary || 0) + (employee.hra || 0) + (employee.da || 0) + (employee.medical_allowance || employee.medicalAllowance || 0) + (employee.conveyance_allowance || employee.conveyanceAllowance || 0)).toLocaleString('en-IN')}</span>
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

async function editEmployee(employeeId) {
  try {
    const employees = await db.getEmployees();
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
    document.getElementById('empBankAccount').value = employee.bank_account || employee.bankAccount || '';
    document.getElementById('empIfsc').value = employee.ifsc || '';
    document.getElementById('empPan').value = employee.pan_number || employee.panNumber || '';
    document.getElementById('empJoinDate').value = employee.join_date || employee.joinDate || '';
    document.getElementById('empBasicSalary').value = employee.basic_salary || employee.basicSalary || '';
    document.getElementById('empHra').value = employee.hra || '';
    document.getElementById('empDa').value = employee.da || '';
    document.getElementById('empMedical').value = employee.medical_allowance || employee.medicalAllowance || '';
    document.getElementById('empConveyance').value = employee.conveyance_allowance || employee.conveyanceAllowance || '';
    document.getElementById('empAddress').value = employee.address || '';
    document.getElementById('empEmergencyContact').value = employee.emergency_contact || employee.emergencyContact || '';
    
    document.getElementById('employeeModal').classList.remove('hidden');
  } catch (error) {
    showNotification('Error loading employee details: ' + error.message, 'error');
  }
}

async function saveEmployee() {
  const form = document.getElementById('employeeForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  setButtonLoading('saveEmployeeBtn', true);
  
  try {
    const employeeData = {
      id: document.getElementById('empId').value,
      name: document.getElementById('empName').value,
      designation: document.getElementById('empDesignation').value,
      department: document.getElementById('empDepartment').value,
      email: document.getElementById('empEmail').value,
      phone: document.getElementById('empPhone').value,
      bank_account: document.getElementById('empBankAccount').value,
      ifsc: document.getElementById('empIfsc').value,
      pan_number: document.getElementById('empPan').value,
      join_date: document.getElementById('empJoinDate').value,
      basic_salary: parseFloat(document.getElementById('empBasicSalary').value) || 0,
      hra: parseFloat(document.getElementById('empHra').value) || 0,
      da: parseFloat(document.getElementById('empDa').value) || 0,
      medical_allowance: parseFloat(document.getElementById('empMedical').value) || 0,
      conveyance_allowance: parseFloat(document.getElementById('empConveyance').value) || 0,
      address: document.getElementById('empAddress').value,
      emergency_contact: document.getElementById('empEmergencyContact').value
    };
    
    await db.saveEmployee(employeeData);
    
    closeModal('employeeModal');
    loadEmployees();
    populateEmployeeSelect();
    
    showNotification(editingEmployeeId ? 'Employee updated successfully' : 'Employee added successfully');
  } catch (error) {
    showNotification('Error saving employee: ' + error.message, 'error');
  } finally {
    setButtonLoading('saveEmployeeBtn', false);
  }
}

function confirmDeleteEmployee(employeeId) {
  db.getEmployees().then(employees => {
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (!employee) return;
    
    showConfirmModal(
      'Delete Employee',
      `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
      () => deleteEmployee(employeeId)
    );
  });
}

async function deleteEmployee(employeeId) {
  try {
    await db.deleteEmployee(employeeId);
    loadEmployees();
    populateEmployeeSelect();
    showNotification('Employee deleted successfully');
  } catch (error) {
    showNotification('Error deleting employee: ' + error.message, 'error');
  }
}

function filterEmployees() {
  const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
  const departmentFilter = document.getElementById('departmentFilter').value;
  
  const employeeCards = document.querySelectorAll('.employee-card');
  
  employeeCards.forEach(card => {
    const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
    const designation = card.querySelector('p')?.textContent.toLowerCase() || '';
    const department = card.querySelector('p')?.textContent.split('•')[1]?.trim();
    
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
  return 'EMP' + String(Date.now()).slice(-6);
}

// Employee and dropdown functions
async function populateEmployeeSelect() {
  const select = document.getElementById('employeeSelect');
  if (!select) return;
  
  try {
    const employees = await db.getEmployees();
    
    select.innerHTML = '<option value="">Select Employee</option>';
    
    employees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = `${employee.name} (${employee.id})`;
      select.appendChild(option);
    });
  } catch (error) {
    select.innerHTML = '<option value="">Error loading employees</option>';
  }
}

async function loadEmployeeDetails() {
  const employeeSelect = document.getElementById('employeeSelect');
  const employeeId = employeeSelect.value;
  
  try {
    const employees = await db.getEmployees();
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee) {
      document.getElementById('employeeId').value = employee.id;
      document.getElementById('designation').value = employee.designation;
      document.getElementById('basicSalary').value = employee.basic_salary || employee.basicSalary || 0;
      document.getElementById('hra').value = employee.hra || 0;
      document.getElementById('da').value = employee.da || 0;
      document.getElementById('medicalAllowance').value = employee.medical_allowance || employee.medicalAllowance || 0;
      document.getElementById('conveyanceAllowance').value = employee.conveyance_allowance || employee.conveyanceAllowance || 0;
      
      // Calculate deductions
      const basicSalary = employee.basic_salary || employee.basicSalary || 0;
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
  } catch (error) {
    showNotification('Error loading employee details: ' + error.message, 'error');
  }
}

async function populateClientSelect() {
  const select = document.getElementById('clientSelect');
  if (!select) return;
  
  try {
    const clients = await db.getClients();
    
    select.innerHTML = '<option value="">Select Client</option>';
    
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name;
      select.appendChild(option);
    });
  } catch (error) {
    select.innerHTML = '<option value="">Error loading clients</option>';
  }
}

async function loadClientDetails() {
  const clientSelect = document.getElementById('clientSelect');
  const clientId = clientSelect.value;
  
  try {
    const clients = await db.getClients();
    const client = clients.find(c => c.id === clientId);
    
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
  } catch (error) {
    showNotification('Error loading client details: ' + error.message, 'error');
  }
}

async function refreshClients() {
  setButtonLoading('refreshClientsBtn', true);
  try {
    await populateClientSelect();
    showNotification('Clients refreshed', 'success');
  } catch (error) {
    showNotification('Error refreshing clients: ' + error.message, 'error');
  } finally {
    setButtonLoading('refreshClientsBtn', false);
  }
}

async function refreshInvoices() {
  setButtonLoading('refreshInvoicesBtn', true);
  try {
    await updateDashboardStats();
    showNotification('Invoices refreshed', 'success');
  } catch (error) {
    showNotification('Error refreshing invoices: ' + error.message, 'error');
  } finally {
    setButtonLoading('refreshInvoicesBtn', false);
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

async function previewSalarySlip() {
  const employeeId = document.getElementById('employeeSelect').value;
  if (!employeeId) {
    showNotification('Please select an employee', 'error');
    return;
  }
  
  try {
    const employees = await db.getEmployees();
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
  } catch (error) {
    showNotification('Error previewing salary slip: ' + error.message, 'error');
  }
}

function downloadSalaryPDF() {
  if (!currentSalaryData) {
    showNotification('Please preview the salary slip first', 'error');
    return;
  }
  
  showLoading('Generating salary slip PDF...');
  
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
        ['PAN Number', currentSalaryData.employee.pan_number || currentSalaryData.employee.panNumber || 'N/A', 'Bank A/C', currentSalaryData.employee.bank_account || currentSalaryData.employee.bankAccount || 'N/A']
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
          <tr><td><strong>PAN:</strong></td><td>${data.employee.pan_number || data.employee.panNumber || 'N/A'}</td></tr>
          <tr><td><strong>Bank A/C:</strong></td><td>${data.employee.bank_account || data.employee.bankAccount || 'N/A'}</td></tr>
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

async function saveInvoice() {
  if (!currentInvoiceData) {
    previewInvoice();
    if (!currentInvoiceData) return;
  }
  
  setButtonLoading('saveInvoiceBtn', true);
  
  try {
    await db.saveInvoice({
      ...currentInvoiceData,
      status: 'saved',
      created_at: new Date().toISOString()
    });
    
    showNotification('Invoice saved successfully');
    
    // Reset form
    document.getElementById('invoiceNumber').value = 'INV-' + Date.now();
    setDefaultDates();
    
  } catch (error) {
    showNotification('Error saving invoice: ' + error.message, 'error');
  } finally {
    setButtonLoading('saveInvoiceBtn', false);
  }
}

function downloadInvoicePDF() {
  if (!currentInvoiceData) {
    showNotification('Please preview the invoice first', 'error');
    return;
  }
  
  showLoading('Generating invoice PDF...');
  
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
      showNotification('Logo uploaded successfully');
    };
    reader.readAsDataURL(file);
  }
}

async function saveSettings() {
  setButtonLoading('saveSettingsBtn', true);
  
  try {
    const settings = {
      companyName: document.getElementById('companyName').value,
      companyGst: document.getElementById('companyGst').value,
      companyAddress: document.getElementById('companyAddress').value,
      invoiceTemplate: document.getElementById('invoiceTemplate')?.value || 'template1',
      salaryTemplate: document.getElementById('salaryTemplate')?.value || 'salary1'
    };
    
    localStorage.setItem('companySettings', JSON.stringify(settings));
    
    // Update company name in header
    const companyNameElement = document.querySelector('.company-name');
    if (companyNameElement) {
      companyNameElement.textContent = settings.companyName;
    }
    
    showNotification('Settings saved successfully');
  } catch (error) {
    showNotification('Error saving settings: ' + error.message, 'error');
  } finally {
    setButtonLoading('saveSettingsBtn', false);
  }
}

async function syncAllData() {
  await db.syncAllData();
}

function exportData() {
  try {
    const data = {
      attendance: JSON.parse(localStorage.getItem('attendanceRecords') || '[]'),
      employees: JSON.parse(localStorage.getItem('employees') || '[]'),
      invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
      settings: JSON.parse(localStorage.getItem('companySettings') || '{}'),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rk-infotech-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully');
  } catch (error) {
    showNotification('Error exporting data: ' + error.message, 'error');
  }
}

function clearLocalData() {
  showConfirmModal(
    'Clear Local Cache',
    'Are you sure you want to clear all local data cache? This will not affect data in the cloud database.',
    () => {
      const keysToKeep = ['companyLogo', 'companySettings'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      showNotification('Local cache cleared successfully');
      location.reload();
    }
  );
}

function resetDatabase() {
  showConfirmModal(
    'Reset Database',
    'Are you sure you want to reset the entire database? This will permanently delete all data and cannot be undone.',
    async () => {
      if (!db.isConnected) {
        showNotification('Database not connected', 'error');
        return;
      }

      try {
        // This would require database admin permissions
        showNotification('Database reset requires manual action in Supabase dashboard', 'warning');
      } catch (error) {
        showNotification('Error resetting database: ' + error.message, 'error');
      }
    }
  );
}

function updateLastSyncDisplay() {
  const lastSync = localStorage.getItem('lastSync');
  const lastSyncElement = document.getElementById('lastSync');
  
  if (lastSyncElement) {
    if (lastSync) {
      const syncDate = new Date(lastSync);
      lastSyncElement.textContent = syncDate.toLocaleString('en-IN');
    } else {
      lastSyncElement.textContent = 'Never';
    }
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

function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmOkBtn').onclick = function() {
    onConfirm();
    closeModal('confirmModal');
  };
  document.getElementById('confirmModal').classList.remove('hidden');
}

function showLoading(message = 'Processing...') {
  document.getElementById('loadingMessage').textContent = message;
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
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (container.contains(notification)) {
        container.removeChild(notification);
      }
    }, 300);
  }, type === 'error' ? 5000 : 3000);
}

function setButtonLoading(buttonId, loading) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  const spinner = button.querySelector('.loading-spinner');
  if (loading) {
    button.disabled = true;
    button.classList.add('loading');
    if (spinner) spinner.classList.remove('hidden');
  } else {
    button.disabled = false;
    button.classList.remove('loading');
    if (spinner) spinner.classList.add('hidden');
  }
}

async function updateDashboardStats() {
  try {
    // Update attendance stats
    const records = await db.getAttendance();
    const thisMonth = records.filter(record => {
      const recordDate = new Date(record.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    });
    
    const presentDaysElement = document.getElementById('presentDays');
    const absentDaysElement = document.getElementById('absentDays');
    
    if (presentDaysElement) presentDaysElement.innerHTML = thisMonth.length;
    if (absentDaysElement) absentDaysElement.innerHTML = Math.max(0, 22 - thisMonth.length);

    // Update employees count
    const employees = await db.getEmployees();
    const totalEmployeesElement = document.getElementById('totalEmployees');
    if (totalEmployeesElement) {
      totalEmployeesElement.innerHTML = employees.length;
    }

    // Update pending salaries (mock data)
    const pendingSalariesElement = document.getElementById('pendingSalaries');
    if (pendingSalariesElement) {
      pendingSalariesElement.innerHTML = Math.max(0, employees.length - 1);
    }

    // Update recent invoices (mock data)
    const recentInvoicesElement = document.getElementById('recentInvoices');
    if (recentInvoicesElement) {
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      recentInvoicesElement.innerHTML = invoices.length;
    }

  } catch (error) {
    console.error('Error updating dashboard stats:', error);
  }
}

// Initialize notification container
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('notificationContainer')) {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
});