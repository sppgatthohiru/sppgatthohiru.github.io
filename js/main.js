// ============================================================
// MAIN.JS - Entry Point Aplikasi ASLAP
// ============================================================
import { db } from "./firebase-init.js";
import { loadDashboard, initDashboard, editListrik, editStok } from "./dashboard.js";
import { loadStokPage, initStok, setCurrentPage } from "./stok.js";
import { loadSisaPengolahanPage, initSisaPengolahan } from "./sisa-pengolahan.js";
import { loadSampahOmprengPage, initSampahOmpreng } from "./sampah-ompreng.js";
import { loadAbsensiPage, initAbsensi } from "./absensi.js";

// ============================================================
// GLOBAL VARIABLES
// ============================================================
let currentPage = 'dashboard';

// ============================================================
// EXPORT FUNCTIONS KE WINDOW (untuk akses dari HTML)
// ============================================================
window.editListrik = editListrik;
window.editStok = editStok;

// ============================================================
// SIDEBAR TOGGLE FUNCTION (untuk mobile responsive)
// ============================================================
window.toggleSidebar = function() {
  const sidebar = document.querySelector('aside');
  if (sidebar) {
    sidebar.classList.toggle('w-20');
    sidebar.classList.toggle('w-72');
    
    // Toggle text visibility
    const allSpans = sidebar.querySelectorAll('nav span, .sidebar-text, .dokumentasi-menu span, .print-menu span');
    allSpans.forEach(span => {
      span.classList.toggle('hidden');
    });
    
    // Toggle label text
    const labels = sidebar.querySelectorAll('.dokumentasi-label span, .print-menu-label span');
    labels.forEach(label => {
      label.classList.toggle('hidden');
    });
    
    // Save state ke localStorage
    const isCollapsed = sidebar.classList.contains('w-20');
    localStorage.setItem('sidebar_collapsed', isCollapsed);
  }
};

// ============================================================
// LOAD SIDEBAR STATE
// ============================================================
function loadSidebarState() {
  const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  const sidebar = document.querySelector('aside');
  
  if (sidebar && isCollapsed) {
    sidebar.classList.add('w-20');
    sidebar.classList.remove('w-72');
    
    const allSpans = sidebar.querySelectorAll('nav span, .sidebar-text, .dokumentasi-menu span, .print-menu span');
    allSpans.forEach(span => {
      span.classList.add('hidden');
    });
    
    const labels = sidebar.querySelectorAll('.dokumentasi-label span, .print-menu-label span');
    labels.forEach(label => {
      label.classList.add('hidden');
    });
  }
}

// ============================================================
// SHOW PAGE FUNCTION (dipanggil dari HTML onclick)
// ============================================================
window.showPage = function(page) {
  currentPage = page;
  
  // Update active state di sidebar
  updateActiveNav(page);
  
  // Load page content
  loadPage(page);
  
  // Save current page ke localStorage
  localStorage.setItem('current_page', page);
};

// ============================================================
// UPDATE ACTIVE NAVIGATION
// ============================================================
function updateActiveNav(page) {
  // Remove active class dari semua nav items
  document.querySelectorAll('.nav-dashboard, .nav-stok, .nav-sisa-peng, .nav-sampah-ompreng, .nav-absensi').forEach(item => {
    item.classList.remove('bg-emerald-700', 'text-white');
    item.classList.add('text-white/80');
  });
  
  // Map page ke class selector
  const navMap = {
    'dashboard': '.nav-dashboard',
    'stok': '.nav-stok',
    'sisa_pengolahan': '.nav-sisa-peng',
    'sampah_ompreng': '.nav-sampah-ompreng',
    'absensi': '.nav-absensi'
  };
  
  const selector = navMap[page];
  if (selector) {
    const activeNav = document.querySelector(selector);
    if (activeNav) {
      activeNav.classList.remove('text-white/80');
      activeNav.classList.add('bg-emerald-700', 'text-white');
    }
  }
}

// ============================================================
// LOAD PAGE CONTENT
// ============================================================
async function loadPage(page) {
  const content = document.getElementById('mainContent');
  if (!content) return;
  
  // Show loading spinner
  content.innerHTML = `
    <div class="flex justify-center items-center h-64">
      <span class="loading loading-spinner loading-lg text-emerald-600"></span>
    </div>
  `;
  
  let html = '';
  
  switch(page) {
    case 'dashboard':
      html = await loadDashboard();
      break;
    case 'stok':
      html = await loadStokPage();
      break;
    case 'sisa_pengolahan':
      html = await loadSisaPengolahanPage();
      break;
    case 'sampah_ompreng':
      html = await loadSampahOmprengPage();
      break;
    case 'absensi':
      html = await loadAbsensiPage();
      break;
    default:
      html = await loadDashboard();
      page = 'dashboard';
  }
  
  content.innerHTML = html;
  
  // Initialize page specific functions
  initPageData(page);
}

// ============================================================
// INITIALIZE PAGE DATA
// ============================================================
function initPageData(page) {
  // Set current page untuk stok (jika diperlukan)
  if (typeof setCurrentPage === 'function') {
    setCurrentPage(page);
  }
  
  switch(page) {
    case 'dashboard':
      if (typeof initDashboard === 'function') {
        setTimeout(() => initDashboard(), 50);
      }
      break;
    case 'stok':
      if (typeof initStok === 'function') {
        setTimeout(() => initStok(), 50);
      }
      break;
    case 'sisa_pengolahan':
      if (typeof initSisaPengolahan === 'function') {
        setTimeout(() => initSisaPengolahan(), 50);
      }
      break;
    case 'sampah_ompreng':
      if (typeof initSampahOmpreng === 'function') {
        setTimeout(() => initSampahOmpreng(), 50);
      }
      break;
    case 'absensi':
      if (typeof initAbsensi === 'function') {
        setTimeout(() => initAbsensi(), 50);
      }
      break;
  }
}

// ============================================================
// TOAST NOTIFICATION (menggunakan DaisyUI)
// ============================================================
window.showToast = function(message, duration = 3000) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    // Create toast container if not exists
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast toast-top toast-end z-[100]';
    document.body.appendChild(container);
  }
  
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'alert alert-success shadow-lg animate-fadeIn';
  toast.innerHTML = `
    <div>
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    </div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ============================================================
// GET TODAY ISO DATE
// ============================================================
window.getTodayISO = function() {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// ============================================================
// FORMAT DATE
// ============================================================
window.formatDate = function(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ============================================================
// THEME TOGGLE (Dark/Light Mode)
// ============================================================
window.toggleTheme = function() {
  const html = document.querySelector('html');
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const themeIcon = document.querySelector('#themeToggle i');
  if (themeIcon) {
    if (newTheme === 'dark') {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  }
  
  window.showToast(`Mode ${newTheme === 'dark' ? 'Gelap' : 'Terang'} aktif`);
};

// ============================================================
// LOAD SAVED THEME
// ============================================================
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.querySelector('html').setAttribute('data-theme', savedTheme);
}

// ============================================================
// LOAD SAVED PAGE
// ============================================================
function loadSavedPage() {
  const savedPage = localStorage.getItem('current_page') || 'dashboard';
  window.showPage(savedPage);
}

// ============================================================
// INITIALIZE APPLICATION
// ============================================================
function initApp() {
  loadSavedTheme();
  loadSidebarState();
  loadSavedPage();
}

// Start aplikasi ketika DOM sudah siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}