// RK INFOTECH Business Management System with Complete Authentication and Enhanced Features

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// Authentication Service
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.userRole = 'employee';
  }

  async initialize() {
    // Check if user is logged in from session
    const storedUser = localStorage.getItem('currentUser');
    const storedSession = localStorage.getItem('userSession');
    
    if (storedUser && storedSession) {
      const sessionData = JSON.parse(storedSession);
      if (sessionData.expires > Date.now()) {
        this.currentUser = JSON.parse(storedUser);
        this.isAuthenticated = true;
        this.userRole = this.currentUser.role || 'employee';
        this.setupUserInterface();
        return true;
      } else {
        this.logout();
      }
    }
    return false;
  }

  async login(email, password) {
    // Demo authentication - replace with Supabase auth when configured
    const demoUsers = [
      {
        id: 'admin-001',
        email: 'admin@rkinfotech.com',
        password: 'admin123',
        name: 'Administrator',
        role: 'admin',
        employee_id: 'ADM001'
      },
      {
        id: 'emp-001',
        email: 'rajesh@rkinfotech.com',
        password: 'employee123',
        name: 'Rajesh Kumar',
        role: 'employee',
        employee_id: 'EMP001'
      }
    ];

    const user = demoUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.currentUser = user;
      this.isAuthenticated = true;
      this.userRole = user.role;
      
      // Store session
      const sessionData = {
        userId: user.id,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('userSession', JSON.stringify(sessionData));
      
      this.setupUserInterface();
      return { success: true, user };
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
  }

  async logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.userRole = 'employee';
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userSession');
    
    // Show login screen
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.body.classList.remove('admin');
    
    showNotification('Logged out successfully', 'info');
  }

  async resetPassword(email) {
    // Demo password reset
    showNotification('Password reset link sent to ' + email, 'success');
    return { success: true };
  }

  setupUserInterface() {
    // Hide login screen, show main app
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Set user info
    document.getElementById('userName').textContent = this.currentUser.name;
    document.getElementById('userRole').textContent = this.userRole.charAt(0).toUpperCase() + this.userRole.slice(1);
    document.getElementById('welcomeUser').textContent = this.currentUser.name;
    
    // Apply role-based styling
    if (this.userRole === 'admin') {
      document.body.classList.add('admin');
    }
    
    showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin() {
    return this.userRole === 'admin';
  }
}

// Enhanced Database Service with Authentication
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
        this.updateConnectionStatus(false, 'Not configured - Using demo mode');
        await this.initializeDemoData();
        return;
      }

      this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      
      // Test connection
      const { data, error } = await this.supabase.from('employees').select('*').limit(1);
      
      if (error && error.code === '42P01') {
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
      await this.initializeDemoData();
    }
  }

  async initializeDemoData() {
    // Initialize with demo data if no data exists
    if (!localStorage.getItem('employees')) {
      const demoEmployees = [
        {
          id: 'EMP001',
          auth_id: 'emp-001',
          employee_id: 'EMP001',
          name: 'Rajesh Kumar',
          email: 'rajesh@rkinfotech.com',
          designation: 'Software Developer',
          department: 'IT',
          phone: '9876543211',
          role: 'employee',
          status: 'active',
          basic_salary: 50000,
          hra: 15000,
          da: 5000,
          medical_allowance: 2000,
          conveyance_allowance: 1000,
          join_date: '2023-01-15',
          address: '123 Main Street, Bangalore',
          emergency_contact: '9876543299',
          created_at: new Date().toISOString()
        },
        {
          id: 'ADM001',
          auth_id: 'admin-001',
          employee_id: 'ADM001',
          name: 'Administrator',
          email: 'admin@rkinfotech.com',
          designation: 'System Administrator',
          department: 'Management',
          phone: '9876543210',
          role: 'admin',
          status: 'active',
          basic_salary: 100000,
          hra: 30000,
          da: 10000,
          medical_allowance: 5000,
          conveyance_allowance: 2000,
          join_date: '2022-01-01',
          address: '456 Admin Street, Bangalore',
          emergency_contact: '9876543288',
          created_at: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('employees', JSON.stringify(demoEmployees));
    }

    if (!localStorage.getItem('vendors')) {
      const demoVendors = [
        {
          id: 'VEN001',
          vendor_id: 'VEN001',
          name: 'Tech Solutions Ltd',
          contact_person: 'John Smith',
          email: 'john@techsolutions.com',
          phone: '+91-9876543220',
          address: '123 Business Park, Mumbai',
          gst_number: '27ABCDE1234F1Z5',
          service_category: 'IT Services',
          payment_terms: '30 days',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'VEN002',
          vendor_id: 'VEN002',
          name: 'Office Supplies Co',
          contact_person: 'Sarah Johnson',
          email: 'sarah@officesupplies.com',
          phone: '+91-9876543221',
          address: '456 Supply Street, Delhi',
          gst_number: '07FGHIJ5678K1L9',
          service_category: 'Office Supplies',
          payment_terms: '15 days',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('vendors', JSON.stringify(demoVendors));
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
        '<div class="loading-dot"></div>Demo Mode';
    }

    this.toggleOfflineBanner(!connected);
  }

  toggleOfflineBanner(show) {
    let banner = document.getElementById('offlineBanner');
    if (show && !banner) {
      banner = document.createElement('div');
      banner.id = 'offlineBanner';
      banner.className = 'offline-mode';
      banner.innerHTML = '📡 Demo Mode - Changes stored locally';
      document.body.appendChild(banner);
    } else if (!show && banner) {
      banner.remove();
    }
  }

  // Employee Management
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
      
      localStorage.setItem('employees', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return JSON.parse(localStorage.getItem('employees') || '[]');
    }
  }

  async saveEmployee(employee) {
    // Always save to localStorage first
    let employees = JSON.parse(localStorage.getItem('employees') || '[]');
    
    if (employee.id && employees.find(e => e.id === employee.id)) {
      employees = employees.map(e => e.id === employee.id ? { ...e, ...employee, updated_at: new Date().toISOString() } : e);
    } else {
      if (!employee.id) {
        employee.id = this.generateId();
      }
      employee.created_at = new Date().toISOString();
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
    let employees = JSON.parse(localStorage.getItem('employees') || '[]');
    employees = employees.filter(e => e.id !== employeeId);
    localStorage.setItem('employees', JSON.stringify(employees));

    if (this.isConnected) {
      try {
        const { error } = await this.supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting employee from database:', error);
      }
    }
  }

  // Attendance Management
  async getAttendance(employeeId = null, limit = 30) {
    const key = employeeId ? `attendanceRecords_${employeeId}` : 'attendanceRecords';
    
    if (!this.isConnected) {
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      return employeeId ? records.filter(r => r.employee_id === employeeId) : records;
    }

    try {
      let query = this.supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      localStorage.setItem(key, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      return employeeId ? records.filter(r => r.employee_id === employeeId) : records;
    }
  }

  async saveAttendance(attendance) {
    const currentUser = auth.getCurrentUser();
    attendance.employee_id = currentUser.id;
    attendance.id = this.generateId();
    attendance.created_at = new Date().toISOString();

    // Save to localStorage
    let records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    records.unshift(attendance);
    records = records.slice(0, 100); // Keep last 100 records
    localStorage.setItem('attendanceRecords', JSON.stringify(records));

    // Try to save to Supabase if connected
    if (this.isConnected) {
      try {
        const { data, error } = await this.supabase
          .from('attendance')
          .insert([attendance])
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

  // Work Status Management
  async getWorkStatus(employeeId = null, limit = 30) {
    const key = employeeId ? `workStatus_${employeeId}` : 'workStatus';
    
    if (!this.isConnected) {
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      return employeeId ? records.filter(r => r.employee_id === employeeId) : records;
    }

    try {
      let query = this.supabase
        .from('work_status')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      localStorage.setItem(key, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching work status:', error);
      const records = JSON.parse(localStorage.getItem(key) || '[]');
      return employeeId ? records.filter(r => r.employee_id === employeeId) : records;
    }
  }

  async saveWorkStatus(workStatus) {
    const currentUser = auth.getCurrentUser();
    workStatus.employee_id = currentUser.id;
    workStatus.id = this.generateId();
    workStatus.created_at = new Date().toISOString();
    workStatus.status = 'pending';

    // Save to localStorage
    let records = JSON.parse(localStorage.getItem('workStatus') || '[]');
    
    // Remove existing entry for the same date and employee
    records = records.filter(r => !(r.date === workStatus.date && r.employee_id === workStatus.employee_id));
    records.unshift(workStatus);
    records = records.slice(0, 100);
    localStorage.setItem('workStatus', JSON.stringify(records));

    // Try to save to Supabase if connected
    if (this.isConnected) {
      try {
        const { data, error } = await this.supabase
          .from('work_status')
          .upsert([workStatus])
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error('Error saving work status to database:', error);
        showNotification('Work status saved locally - will sync when online', 'warning');
      }
    }

    return workStatus;
  }

  // Vendor Management
  async getVendors() {
    if (!this.isConnected) {
      return JSON.parse(localStorage.getItem('vendors') || '[]');
    }

    try {
      const { data, error } = await this.supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      localStorage.setItem('vendors', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return JSON.parse(localStorage.getItem('vendors') || '[]');
    }
  }

  async saveVendor(vendor) {
    let vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    
    if (vendor.id && vendors.find(v => v.id === vendor.id)) {
      vendors = vendors.map(v => v.id === vendor.id ? { ...v, ...vendor, updated_at: new Date().toISOString() } : v);
    } else {
      if (!vendor.id) {
        vendor.id = this.generateId();
      }
      vendor.created_at = new Date().toISOString();
      vendors.push(vendor);
    }
    
    localStorage.setItem('vendors', JSON.stringify(vendors));

    if (this.isConnected) {
      try {
        const { data, error } = await this.supabase
          .from('vendors')
          .upsert([vendor])
          .select();

        if (error) throw error;
        return data[0];
      } catch (error) {
        console.error('Error saving vendor to database:', error);
        showNotification('Vendor saved locally - will sync when online', 'warning');
      }
    }

    return vendor;
  }

  async deleteVendor(vendorId) {
    let vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
    vendors = vendors.filter(v => v.id !== vendorId);
    localStorage.setItem('vendors', JSON.stringify(vendors));

    if (this.isConnected) {
      try {
        const { error } = await this.supabase
          .from('vendors')
          .delete()
          .eq('id', vendorId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting vendor from database:', error);
      }
    }
  }

  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Initialize services
const auth = new AuthService();
const db = new DatabaseService();

// Application Data
const appData = {
  company: {
    name: "RK INFOTECH",
    address: "123 Tech Park, Bangalore, Karnataka 560001",
    phone: "+91-9876543210",
    email: "contact@rkinfotech.com",
    gst: "29ABCDE1234F1Z5",
    website: "www.rkinfotech.com"
  },
  deductions: {
    pfRate: 12,
    esiRate: 0.75,
    professionalTax: 200,
    incomeTaxRate: 10
  }
};

// Global state
let attendanceState = {
  isCheckedIn: false,
  checkInTime: null,
  todayHours: 0
};

let currentSalaryData = null;
let editingEmployeeId = null;
let editingVendorId = null;

// Initialize app on load
document.addEventListener('DOMContentLoaded', async function() {
  // Check authentication first
  const isLoggedIn = await auth.initialize();
  
  if (isLoggedIn) {
    initializeApp();
  } else {
    showLoginScreen();
  }
});

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

function initializeApp() {
  updateCurrentDate();
  loadAttendanceState();
  loadEmployees();
  populateEmployeeSelect();
  loadVendors();
  loadAttendanceHistory();
  loadWorkStatusHistory();
  updateDashboardStats();
  updateClock();
  setupEventListeners();
  setDefaultDates();
  loadTodayWorkStatus();
  
  // Update clock every second
  setInterval(updateClock, 1000);
}

// Authentication functions
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  setButtonLoading('loginBtn', true);
  
  try {
    const result = await auth.login(email, password);
    
    if (result.success) {
      initializeApp();
    } else {
      showNotification(result.error, 'error');
    }
  } catch (error) {
    showNotification('Login failed: ' + error.message, 'error');
  } finally {
    setButtonLoading('loginBtn', false);
  }
}

async function handlePasswordReset(event) {
  event.preventDefault();
  
  const email = document.getElementById('resetEmail').value;
  
  setButtonLoading('resetBtn', true);
  
  try {
    await auth.resetPassword(email);
  } catch (error) {
    showNotification('Password reset failed: ' + error.message, 'error');
  } finally {
    setButtonLoading('resetBtn', false);
  }
}

async function handleLogout() {
  await auth.logout();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  
  document.querySelector(`[onclick="switchAuthTab('${tab}')"]`).classList.add('active');
  document.getElementById(`${tab}Form`).classList.add('active');
}

// Navigation and UI functions
function setupEventListeners() {
  document.querySelectorAll('.nav-item').forEach(navItem => {
    navItem.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      if (tabName) {
        switchTab(tabName);
        updateActiveNav(this);
      }
    });
  });

  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && !e.target.classList.contains('modal-content')) {
      e.target.classList.add('hidden');
    }
  });

  const salaryInputs = ['basicSalary', 'hra', 'da', 'medicalAllowance', 'conveyanceAllowance', 'pf', 'esi', 'professionalTax', 'incomeTax'];
  salaryInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', calculateSalary);
    }
  });
}

function switchTab(tabName) {
  // Check admin access
  if (!auth.isAdmin() && ['employees', 'vendors', 'payroll'].includes(tabName)) {
    showNotification('Access denied. Admin privileges required.', 'error');
    return;
  }

  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.remove('active'));
  
  const targetSection = document.getElementById(tabName);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Special initialization for specific tabs
  if (tabName === 'attendance') {
    updateAttendanceUI();
  } else if (tabName === 'workStatus') {
    loadTodayWorkStatus();
  } else if (tabName === 'payroll') {
    populateEmployeeSelect();
  } else if (tabName === 'employees') {
    loadEmployees();
  } else if (tabName === 'vendors') {
    loadVendors();
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

function setDefaultDates() {
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const todayStr = today.toISOString().slice(0, 10);
  
  const salaryPeriodInput = document.getElementById('salaryPeriod');
  if (salaryPeriodInput) {
    salaryPeriodInput.value = currentMonth;
  }
  
  const workDateInput = document.getElementById('workDate');
  if (workDateInput) {
    workDateInput.value = todayStr;
  }
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
      check_in: attendanceState.checkInTime.toISOString(),
      check_out: checkOutTime.toISOString(),
      total_hours: totalHours,
      location: 'Office',
      status: 'present'
    };
    
    await db.saveAttendance(attendanceRecord);
    
    attendanceState.isCheckedIn = false;
    attendanceState.checkInTime = null;
    attendanceState.todayHours = 0;
    
    saveAttendanceState();
    updateAttendanceUI();
    loadAttendanceHistory();
    updateDashboardStats();
    
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
  const currentUser = auth.getCurrentUser();
  const stateKey = `attendanceState_${currentUser.id}`;
  
  localStorage.setItem(stateKey, JSON.stringify({
    isCheckedIn: attendanceState.isCheckedIn,
    checkInTime: attendanceState.checkInTime ? attendanceState.checkInTime.toISOString() : null
  }));
}

async function loadAttendanceHistory() {
  const historyList = document.getElementById('attendanceHistoryList');
  if (!historyList) return;
  
  try {
    const currentUser = auth.getCurrentUser();
    const records = await db.getAttendance(currentUser.id);
    
    if (records.length === 0) {
      historyList.innerHTML = '<div class="table-row"><span style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary);">No attendance records found</span></div>';
      return;
    }
    
    historyList.innerHTML = records.map(record => `
      <div class="table-row">
        <span>${new Date(record.date).toLocaleDateString('en-IN')}</span>
        <span>${record.check_in ? new Date(record.check_in).toLocaleTimeString('en-IN', {hour12: false, hour: '2-digit', minute: '2-digit'}) : '-'}</span>
        <span>${record.check_out ? new Date(record.check_out).toLocaleTimeString('en-IN', {hour12: false, hour: '2-digit', minute: '2-digit'}) : '-'}</span>
        <span>${record.total_hours || '-'}</span>
        <span class="status-badge ${record.status === 'present' ? 'active' : 'warning'}">${record.status || 'Present'}</span>
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

// Work Status functions
async function saveWorkStatus(event) {
  event.preventDefault();
  
  setButtonLoading('saveWorkStatusBtn', true);
  
  try {
    const workStatus = {
      date: document.getElementById('workDate').value,
      hours_worked: parseFloat(document.getElementById('hoursWorked').value),
      project_name: document.getElementById('projectName').value,
      tasks_completed: document.getElementById('tasksCompleted').value.split('\n').filter(task => task.trim()),
      progress_notes: document.getElementById('progressNotes').value
    };
    
    await db.saveWorkStatus(workStatus);
    
    showNotification('Work status saved successfully');
    loadWorkStatusHistory();
    updateDashboardStats();
    
    // Clear form
    document.getElementById('workStatusFormElement').reset();
    setDefaultDates();
    
  } catch (error) {
    showNotification('Error saving work status: ' + error.message, 'error');
  } finally {
    setButtonLoading('saveWorkStatusBtn', false);
  }
}

async function loadTodayWorkStatus() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const currentUser = auth.getCurrentUser();
    const records = await db.getWorkStatus(currentUser.id);
    const todayRecord = records.find(r => r.date === today);
    
    if (todayRecord) {
      document.getElementById('workDate').value = todayRecord.date;
      document.getElementById('hoursWorked').value = todayRecord.hours_worked;
      document.getElementById('projectName').value = todayRecord.project_name;
      document.getElementById('tasksCompleted').value = Array.isArray(todayRecord.tasks_completed) 
        ? todayRecord.tasks_completed.join('\n') 
        : todayRecord.tasks_completed;
      document.getElementById('progressNotes').value = todayRecord.progress_notes || '';
      
      showNotification('Today\'s work status loaded', 'info');
    } else {
      setDefaultDates();
    }
  } catch (error) {
    console.error('Error loading today\'s work status:', error);
  }
}

async function loadWorkStatusHistory() {
  const historyList = document.getElementById('workStatusHistoryList');
  if (!historyList) return;
  
  try {
    const currentUser = auth.getCurrentUser();
    const records = await db.getWorkStatus(currentUser.id, 10);
    
    if (records.length === 0) {
      historyList.innerHTML = '<div class="loading-card"><p class="loading-text">No work status records found</p></div>';
      return;
    }
    
    historyList.innerHTML = records.map(record => createWorkStatusItem(record)).join('');
  } catch (error) {
    console.error('Error loading work status history:', error);
    historyList.innerHTML = '<div class="loading-card"><p class="loading-text text-error">Error loading work status records</p></div>';
  }
}

function createWorkStatusItem(record) {
  const tasks = Array.isArray(record.tasks_completed) ? record.tasks_completed : [record.tasks_completed];
  
  return `
    <div class="work-status-item fade-in">
      <div class="work-status-header">
        <div class="work-status-date">${new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="work-status-hours">⏱️ ${record.hours_worked || 0} hours</div>
      </div>
      <div class="work-status-project">📂 ${record.project_name}</div>
      <div class="work-status-tasks">
        <h5>Tasks Completed:</h5>
        <p>${tasks.join(', ')}</p>
      </div>
      ${record.progress_notes ? `<div class="work-status-notes">${record.progress_notes}</div>` : ''}
      <div class="work-status-badge ${record.status || 'pending'}">${(record.status || 'pending').toUpperCase()}</div>
    </div>
  `;
}

async function refreshWorkStatusHistory() {
  setButtonLoading('refreshWorkStatusBtn', true);
  try {
    await loadWorkStatusHistory();
    showNotification('Work status history refreshed', 'success');
  } catch (error) {
    showNotification('Error refreshing work status: ' + error.message, 'error');
  } finally {
    setButtonLoading('refreshWorkStatusBtn', false);
  }
}

// Employee Management functions
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
  } catch (error) {
    console.error('Error loading employees:', error);
    employeeList.innerHTML = '<div class="employee-card"><p class="text-error">Error loading employees</p></div>';
  }
}

function createEmployeeCard(employee) {
  return `
    <div class="employee-card fade-in">
      <div class="employee-header">
        <div class="employee-info">
          <h4>${employee.name}</h4>
          <p>${employee.designation} • ${employee.department}</p>
          <p class="status-badge ${employee.status === 'active' ? 'active' : 'inactive'}">${employee.status || 'Active'}</p>
          <p class="status-badge ${employee.role === 'admin' ? 'warning' : 'active'}">${(employee.role || 'employee').toUpperCase()}</p>
        </div>
        <div class="employee-actions">
          <button class="btn btn--xs btn--secondary" onclick="editEmployee('${employee.id}')">Edit</button>
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
            <span class="detail-value">${employee.employee_id || employee.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Join Date:</span>
            <span class="detail-value">${employee.join_date ? new Date(employee.join_date).toLocaleDateString('en-IN') : 'N/A'}</span>
          </div>
        </div>
        <div class="detail-group">
          <h5>Salary Information</h5>
          <div class="detail-item">
            <span class="detail-label">Basic Salary:</span>
            <span class="detail-value">₹${(employee.basic_salary || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total CTC:</span>
            <span class="detail-value">₹${((employee.basic_salary || 0) + (employee.hra || 0) + (employee.da || 0) + (employee.medical_allowance || 0) + (employee.conveyance_allowance || 0)).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
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
    document.getElementById('empId').value = employee.employee_id || employee.id;
    document.getElementById('empName').value = employee.name;
    document.getElementById('empEmail').value = employee.email;
    document.getElementById('empPhone').value = employee.phone;
    document.getElementById('empDesignation').value = employee.designation;
    document.getElementById('empDepartment').value = employee.department;
    document.getElementById('empRole').value = employee.role || 'employee';
    document.getElementById('empJoinDate').value = employee.join_date;
    document.getElementById('empBankAccount').value = employee.bank_account || '';
    document.getElementById('empIfsc').value = employee.ifsc || '';
    document.getElementById('empPan').value = employee.pan_number || '';
    document.getElementById('empBasicSalary').value = employee.basic_salary || '';
    document.getElementById('empHra').value = employee.hra || '';
    document.getElementById('empDa').value = employee.da || '';
    document.getElementById('empMedical').value = employee.medical_allowance || '';
    document.getElementById('empConveyance').value = employee.conveyance_allowance || '';
    document.getElementById('empAddress').value = employee.address || '';
    document.getElementById('empEmergencyContact').value = employee.emergency_contact || '';
    
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
      id: editingEmployeeId || generateId(),
      employee_id: document.getElementById('empId').value,
      name: document.getElementById('empName').value,
      email: document.getElementById('empEmail').value,
      phone: document.getElementById('empPhone').value,
      designation: document.getElementById('empDesignation').value,
      department: document.getElementById('empDepartment').value,
      role: document.getElementById('empRole').value,
      join_date: document.getElementById('empJoinDate').value,
      bank_account: document.getElementById('empBankAccount').value,
      ifsc: document.getElementById('empIfsc').value,
      pan_number: document.getElementById('empPan').value,
      basic_salary: parseFloat(document.getElementById('empBasicSalary').value) || 0,
      hra: parseFloat(document.getElementById('empHra').value) || 0,
      da: parseFloat(document.getElementById('empDa').value) || 0,
      medical_allowance: parseFloat(document.getElementById('empMedical').value) || 0,
      conveyance_allowance: parseFloat(document.getElementById('empConveyance').value) || 0,
      address: document.getElementById('empAddress').value,
      emergency_contact: document.getElementById('empEmergencyContact').value,
      status: 'active'
    };
    
    await db.saveEmployee(employeeData);
    
    closeModal('employeeModal');
    loadEmployees();
    populateEmployeeSelect();
    updateDashboardStats();
    
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
    updateDashboardStats();
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

function generateEmployeeId() {
  return 'EMP' + String(Date.now()).slice(-6);
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Vendor Management functions
async function loadVendors() {
  const vendorList = document.getElementById('vendorList');
  if (!vendorList) return;
  
  try {
    const vendors = await db.getVendors();
    
    if (vendors.length === 0) {
      vendorList.innerHTML = '<div class="vendor-card"><p>No vendors found. Click "Add New Vendor" to get started.</p></div>';
      return;
    }
    
    vendorList.innerHTML = vendors.map(vendor => createVendorCard(vendor)).join('');
  } catch (error) {
    console.error('Error loading vendors:', error);
    vendorList.innerHTML = '<div class="vendor-card"><p class="text-error">Error loading vendors</p></div>';
  }
}

function createVendorCard(vendor) {
  return `
    <div class="vendor-card fade-in">
      <div class="vendor-header">
        <div class="vendor-info">
          <h4>${vendor.name}</h4>
          <p>${vendor.contact_person} • ${vendor.service_category}</p>
          <p class="status-badge ${vendor.status === 'active' ? 'active' : 'inactive'}">${vendor.status || 'Active'}</p>
        </div>
        <div class="vendor-actions">
          <button class="btn btn--xs btn--secondary" onclick="editVendor('${vendor.id}')">Edit</button>
          <button class="btn btn--xs btn--danger" onclick="confirmDeleteVendor('${vendor.id}')">Delete</button>
        </div>
      </div>
      <div class="vendor-details">
        <div class="detail-group">
          <h5>Contact Information</h5>
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${vendor.email}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${vendor.phone}</span>
          </div>
        </div>
        <div class="detail-group">
          <h5>Business Details</h5>
          <div class="detail-item">
            <span class="detail-label">Vendor ID:</span>
            <span class="detail-value">${vendor.vendor_id || vendor.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Terms:</span>
            <span class="detail-value">${vendor.payment_terms}</span>
          </div>
        </div>
        <div class="detail-group">
          <h5>Address</h5>
          <div class="detail-item">
            <span class="detail-value">${vendor.address}</span>
          </div>
          ${vendor.gst_number ? `
          <div class="detail-item">
            <span class="detail-label">GST:</span>
            <span class="detail-value">${vendor.gst_number}</span>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function showAddVendorModal() {
  editingVendorId = null;
  document.getElementById('vendorModalTitle').textContent = 'Add New Vendor';
  document.getElementById('vendorForm').reset();
  document.getElementById('vendorId').value = generateVendorId();
  document.getElementById('vendorModal').classList.remove('hidden');
}

async function editVendor(vendorId) {
  try {
    const vendors = await db.getVendors();
    const vendor = vendors.find(v => v.id === vendorId);
    
    if (!vendor) return;
    
    editingVendorId = vendorId;
    document.getElementById('vendorModalTitle').textContent = 'Edit Vendor';
    
    // Populate form with vendor data
    document.getElementById('vendorId').value = vendor.vendor_id || vendor.id;
    document.getElementById('vendorName').value = vendor.name;
    document.getElementById('vendorContactPerson').value = vendor.contact_person;
    document.getElementById('vendorEmail').value = vendor.email;
    document.getElementById('vendorPhone').value = vendor.phone;
    document.getElementById('vendorGst').value = vendor.gst_number || '';
    document.getElementById('vendorAddress').value = vendor.address;
    document.getElementById('vendorCategory').value = vendor.service_category;
    document.getElementById('vendorPaymentTerms').value = vendor.payment_terms;
    document.getElementById('vendorServiceDesc').value = vendor.service_description || '';
    
    document.getElementById('vendorModal').classList.remove('hidden');
  } catch (error) {
    showNotification('Error loading vendor details: ' + error.message, 'error');
  }
}

async function saveVendor() {
  const form = document.getElementById('vendorForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  setButtonLoading('saveVendorBtn', true);
  
  try {
    const vendorData = {
      id: editingVendorId || generateId(),
      vendor_id: document.getElementById('vendorId').value,
      name: document.getElementById('vendorName').value,
      contact_person: document.getElementById('vendorContactPerson').value,
      email: document.getElementById('vendorEmail').value,
      phone: document.getElementById('vendorPhone').value,
      gst_number: document.getElementById('vendorGst').value,
      address: document.getElementById('vendorAddress').value,
      service_category: document.getElementById('vendorCategory').value,
      payment_terms: document.getElementById('vendorPaymentTerms').value,
      service_description: document.getElementById('vendorServiceDesc').value,
      status: 'active'
    };
    
    await db.saveVendor(vendorData);
    
    closeModal('vendorModal');
    loadVendors();
    updateDashboardStats();
    
    showNotification(editingVendorId ? 'Vendor updated successfully' : 'Vendor added successfully');
  } catch (error) {
    showNotification('Error saving vendor: ' + error.message, 'error');
  } finally {
    setButtonLoading('saveVendorBtn', false);
  }
}

function confirmDeleteVendor(vendorId) {
  db.getVendors().then(vendors => {
    const vendor = vendors.find(v => v.id === vendorId);
    
    if (!vendor) return;
    
    showConfirmModal(
      'Delete Vendor',
      `Are you sure you want to delete ${vendor.name}? This action cannot be undone.`,
      () => deleteVendor(vendorId)
    );
  });
}

async function deleteVendor(vendorId) {
  try {
    await db.deleteVendor(vendorId);
    loadVendors();
    updateDashboardStats();
    showNotification('Vendor deleted successfully');
  } catch (error) {
    showNotification('Error deleting vendor: ' + error.message, 'error');
  }
}

function filterVendors() {
  const searchTerm = document.getElementById('vendorSearch').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  
  const vendorCards = document.querySelectorAll('.vendor-card');
  
  vendorCards.forEach(card => {
    const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
    const contactPerson = card.querySelector('p')?.textContent.toLowerCase() || '';
    const category = card.querySelector('p')?.textContent.split('•')[1]?.trim();
    
    const matchesSearch = name.includes(searchTerm) || contactPerson.includes(searchTerm);
    const matchesCategory = !categoryFilter || category === categoryFilter;
    
    if (matchesSearch && matchesCategory) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

async function refreshVendors() {
  setButtonLoading('refreshVendorsBtn', true);
  try {
    await loadVendors();
    showNotification('Vendors refreshed', 'success');
  } catch (error) {
    showNotification('Error refreshing vendors: ' + error.message, 'error');
  } finally {
    setButtonLoading('refreshVendorsBtn', false);
  }
}

function generateVendorId() {
  return 'VEN' + String(Date.now()).slice(-6);
}

// Payroll functions
async function populateEmployeeSelect() {
  const select = document.getElementById('employeeSelect');
  if (!select) return;
  
  try {
    const employees = await db.getEmployees();
    
    select.innerHTML = '<option value="">Select Employee</option>';
    
    employees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = `${employee.name} (${employee.employee_id || employee.id})`;
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
      document.getElementById('employeeId').value = employee.employee_id || employee.id;
      document.getElementById('designation').value = employee.designation;
      document.getElementById('basicSalary').value = employee.basic_salary || 0;
      document.getElementById('hra').value = employee.hra || 0;
      document.getElementById('da').value = employee.da || 0;
      document.getElementById('medicalAllowance').value = employee.medical_allowance || 0;
      document.getElementById('conveyanceAllowance').value = employee.conveyance_allowance || 0;
      
      // Calculate deductions
      const basicSalary = employee.basic_salary || 0;
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
      
      // Company header with logo
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
        ['Employee ID', currentSalaryData.employee.employee_id || currentSalaryData.employee.id, 'Name', currentSalaryData.employee.name],
        ['Designation', currentSalaryData.employee.designation, 'Department', currentSalaryData.employee.department],
        ['PAN Number', currentSalaryData.employee.pan_number || 'N/A', 'Bank A/C', currentSalaryData.employee.bank_account || 'N/A']
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
          <tr><td><strong>Employee ID:</strong></td><td>${data.employee.employee_id || data.employee.id}</td></tr>
          <tr><td><strong>Name:</strong></td><td>${data.employee.name}</td></tr>
          <tr><td><strong>Designation:</strong></td><td>${data.employee.designation}</td></tr>
          <tr><td><strong>Department:</strong></td><td>${data.employee.department}</td></tr>
          <tr><td><strong>PAN:</strong></td><td>${data.employee.pan_number || 'N/A'}</td></tr>
          <tr><td><strong>Bank A/C:</strong></td><td>${data.employee.bank_account || 'N/A'}</td></tr>
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

// Dashboard and statistics
async function updateDashboardStats() {
  try {
    const currentUser = auth.getCurrentUser();
    
    // Update attendance stats
    const records = await db.getAttendance(currentUser.id);
    const thisMonth = records.filter(record => {
      const recordDate = new Date(record.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    });
    
    const presentDaysElement = document.getElementById('presentDays');
    const absentDaysElement = document.getElementById('absentDays');
    
    if (presentDaysElement) presentDaysElement.innerHTML = thisMonth.length;
    if (absentDaysElement) absentDaysElement.innerHTML = Math.max(0, 22 - thisMonth.length);

    // Update employees count (admin only)
    if (auth.isAdmin()) {
      const employees = await db.getEmployees();
      const totalEmployeesElement = document.getElementById('totalEmployees');
      if (totalEmployeesElement) {
        totalEmployeesElement.innerHTML = employees.length;
      }
      
      // Update vendors count
      const vendors = await db.getVendors();
      const totalVendorsElement = document.getElementById('totalVendors');
      if (totalVendorsElement) {
        totalVendorsElement.innerHTML = vendors.length;
      }
    }

    // Update work status
    const workStatusRecords = await db.getWorkStatus(currentUser.id);
    const todayWorkStatusElement = document.getElementById('todayWorkStatus');
    const today = new Date().toISOString().split('T')[0];
    const todayStatus = workStatusRecords.find(r => r.date === today);
    
    if (todayWorkStatusElement) {
      todayWorkStatusElement.innerHTML = todayStatus ? 'Submitted' : 'Pending';
    }

  } catch (error) {
    console.error('Error updating dashboard stats:', error);
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
  const container = document.getElementById('notificationContainer') || createNotificationContainer();

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

function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notificationContainer';
  container.className = 'notification-container';
  document.body.appendChild(container);
  return container;
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

// Initialize notification container on load
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('notificationContainer')) {
    createNotificationContainer();
  }
});