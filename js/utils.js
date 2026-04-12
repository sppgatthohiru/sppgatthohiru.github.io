// ============================================================
// UTILS.JS - Utility Functions for ASLAP MBG Tracker
// ============================================================
import { db } from "./firebase-init.js";
import { ref, push } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";

// ============================================================
// TOAST NOTIFICATION (menggunakan DaisyUI)
// ============================================================
let toastContainer = null;

export function showToast(message, duration = 3000, type = 'success') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast toast-top toast-end z-[100]';
    document.body.appendChild(toastContainer);
  }
  
  let alertClass = 'alert-success';
  let icon = 'fa-check-circle';
  
  switch(type) {
    case 'error':
      alertClass = 'alert-error';
      icon = 'fa-exclamation-circle';
      break;
    case 'warning':
      alertClass = 'alert-warning';
      icon = 'fa-exclamation-triangle';
      break;
    case 'info':
      alertClass = 'alert-info';
      icon = 'fa-info-circle';
      break;
    default:
      alertClass = 'alert-success';
      icon = 'fa-check-circle';
  }
  
  const toast = document.createElement('div');
  toast.className = `alert ${alertClass} shadow-lg animate-fadeIn`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, duration);
}

// ============================================================
// LOG ACTIVITY - Audit Trail (SIAPA yang mengubah apa)
// ============================================================
export async function logActivity(action, module, description, oldData = null, newData = null) {
  if (!window.currentUser) {
    console.warn("⚠️ logActivity: Tidak ada user yang login");
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    user: {
      uid: window.currentUser.uid,
      name: window.currentUser.name,
      email: window.currentUser.email || ''
    },
    action: action,           // "create", "update", "delete"
    module: module,           // "stok", "sisa_pengolahan", "absensi", "ompreng", dll
    description: description,
    oldData: oldData ? deepClone(oldData) : null,
    newData: newData ? deepClone(newData) : null
  };

  try {
    const logsRef = ref(db, 'activity_logs');
    await push(logsRef, logEntry);
    console.log(`✅ Log tersimpan → ${action} | ${module} | ${description}`);
  } catch (error) {
    console.error("❌ Gagal menyimpan log aktivitas:", error);
  }
}

// ============================================================
// FORMAT DATE (ke format Indonesia)
// ============================================================
export function formatDate(date, format = 'full') {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const options = {
    'full': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    'date': { year: 'numeric', month: 'numeric', day: 'numeric' },
    'time': { hour: '2-digit', minute: '2-digit' },
    'datetime': { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    'short': { day: 'numeric', month: 'short' }
  };
  
  const selectedOptions = options[format] || options['full'];
  return d.toLocaleDateString('id-ID', selectedOptions);
}

// ============================================================
// GET TODAY ISO DATE (YYYY-MM-DD)
// ============================================================
export function getTodayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localTime = new Date(now.getTime() - offset);
  
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ============================================================
// FORMAT NUMBER (dengan pemisah ribuan)
// ============================================================
export function formatNumber(number, decimals = 0) {
  if (number === undefined || number === null) return '0';
  return Number(number).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ============================================================
// FORMAT CURRENCY (Rupiah)
// ============================================================
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// ============================================================
// VALIDATE EMAIL
// ============================================================
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ============================================================
// VALIDATE PHONE NUMBER (Indonesia)
// ============================================================
export function isValidPhone(phone) {
  const re = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return re.test(phone);
}

// ============================================================
// DEBOUNCE FUNCTION
// ============================================================
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================
// THROTTLE FUNCTION
// ============================================================
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================================
// DEEP CLONE OBJECT (digunakan di logActivity)
// ============================================================
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// GENERATE UNIQUE ID
// ============================================================
export function generateId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// ============================================================
// DOWNLOAD FILE
// ============================================================
export function downloadFile(data, filename, type = 'text/csv') {
  const blob = new Blob([data], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// COPY TO CLIPBOARD
// ============================================================
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Berhasil disalin ke clipboard', 2000);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Gagal menyalin ke clipboard', 2000, 'error');
    return false;
  }
}

// ============================================================
// ESCAPE HTML (untuk mencegah XSS)
// ============================================================
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// TRUNCATE TEXT
// ============================================================
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ============================================================
// GET RELATIVE TIME
// ============================================================
export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  
  return formatDate(date, 'date');
}

// ============================================================
// EXPORT KE WINDOW (Global Access)
// ============================================================
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.formatDate = formatDate;
  window.getTodayISO = getTodayISO;
  window.formatNumber = formatNumber;
  window.formatRupiah = formatRupiah;
  window.escapeHtml = escapeHtml;
  window.copyToClipboard = copyToClipboard;
  window.logActivity = logActivity;        // ← Tambahan penting
}

// ============================================================
// GLOBAL LOG ACTIVITY HELPER - BISA DIPANGGIL DARI SEMUA HALAMAN
// ============================================================
export async function saveChangeToHistory(action, itemName, oldValue, newValue) {
  if (!window.currentUser) {
    console.warn("Tidak ada user login untuk mencatat riwayat");
    return;
  }

  const description = `${action}: ${itemName} dari ${oldValue} menjadi ${newValue}`;

  await logActivity(
    action.includes("Penambahan") || action.includes("Tambah") || action.includes("Create") ? "create" : "update",
    "stok",
    description,
    { nama: itemName, stok: Number(oldValue) || 0 },
    { nama: itemName, stok: Number(newValue) || 0 }
  );
}

// Export ke window
if (typeof window !== 'undefined') {
  window.saveChangeToHistory = saveChangeToHistory;
}