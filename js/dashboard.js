// ============================================================
// DASHBOARD.JS - Halaman Utama ASLAP MBG
// Theme: Professional Blue - Clean & Modern
// Version: 3.3 (Updated with logActivity - Siapa yang mengubah data)
// ============================================================
import { ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, stokRef, sisaPengRef, omprengRef, absensiRef } from "./firebase-init.js";
import { initAuthGuard } from './auth-guard.js';
import { logActivity } from './utils.js';
import { googleDocsLinks } from "./config.js";
import { showToast, getTodayISO, escapeHtml } from "./utils.js";

// ============================================================
// GLOBAL VARIABLES
// ============================================================
window.googleDocsLinks = googleDocsLinks;
let chartSisa = null;
let chartOmpreng = null;
let chartTrend = null;
let stokHistory = [];
let historyIndex = -1;
let lowStockAlertShown = false;
let currentMetric = 'sisa';
let currentRandomStoks = [];
// Filter chart variables
let currentChartDays = 7;
let chartStartDate = null;
let chartEndDate = null;

// ============================================================
// HISTORY & FILTER
// ============================================================
let changeHistory = [];
let currentFilterDate = null;

// HARDCORE PEMAKAIAN PER HARI
const DAILY_USAGE = {
  'GAS_LPG_50KG': 1,
  'GAS_LPG_12KG': 1,
  'GALON_AIR': 10,
  'LISTRIK': 100
};

// Threshold stok minimum
const STOCK_THRESHOLDS = {
  'GAS_LPG_50KG': 2,
  'GAS_LPG_12KG': 2,
  'GALON_AIR': 15,
  'LISTRIK': 80
};

// Category icons mapping
const CATEGORY_ICONS = {
  "Pembersih & Deterjen": "fa-soap",
  "Perlengkapan Kebersihan": "fa-broom",
  "Plastik & Kresek": "fa-shopping-bag",
  "Alat Pelindung & Masker": "fa-head-side-mask",
  "Kebutuhan Umum": "fa-box",
  "Utility & Gas": "fa-gas-pump",
  "Barang Lainnya": "fa-archive"
};

// ============================================================
// SECTION 1: LOAD DASHBOARD HTML
// ============================================================
export function loadDashboard() {
  const savedNotes = localStorage.getItem('dashboard_notes') || '';
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!-- ==================== HEADER SECTION ==================== -->
    <div class="mb-6">
      <div class="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-bold text-gradient">Dashboard</h1>
          <p class="text-slate-500 mt-1 flex items-center gap-2">
            <i class="fas fa-calendar-alt text-primary/60 text-sm"></i>
            <span>${today}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="badge badge-primary badge-lg gap-2">
            <i class="fas fa-chart-line"></i>
            <span>Real-time</span>
          </div>
          <div class="tooltip tooltip-left" data-tip="Refresh Data">
            <button onclick="window.location.reload()" class="btn btn-ghost btn-sm btn-circle">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== KPI CARDS SECTION ==================== -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
      <!-- Card 1: Total Stok -->
      <div class="card bg-gradient-to-br from-[#1e3a5f] to-[#2c5282] text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 group" onclick="window.showTotalStockDetail()">
        <div class="card-body p-5">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-white/80 text-sm font-medium">Total Stok</p>
              <p class="text-3xl font-bold mt-1" id="totalStok">0</p>
              <p class="text-white/60 text-xs mt-1">Seluruh item</p>
            </div>
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i class="fas fa-boxes text-xl"></i>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs">
            <span class="text-white/70">📦 Update real-time</span>
            <i class="fas fa-arrow-right text-white/50 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      </div>
     
      <!-- Card 2: Stok Menipis -->
      <div class="card bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 group" onclick="window.toggleLowStockList()">
        <div class="card-body p-5">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-white/80 text-sm font-medium">Stok Menipis</p>
              <p class="text-3xl font-bold mt-1" id="stokMenipis">0</p>
              <p class="text-white/60 text-xs mt-1">Perlu perhatian</p>
            </div>
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i class="fas fa-exclamation-triangle text-xl"></i>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs">
            <span class="text-white/70">⚠️ Dibawah threshold</span>
            <i class="fas fa-chevron-down text-white/50 group-hover:translate-y-1 transition-transform"></i>
          </div>
        </div>
      </div>
     
      <!-- Card 3: Rata-rata Metric -->
      <div class="card bg-gradient-to-br from-[#3182ce] to-[#4299e1] text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 group" onclick="window.toggleMetric()">
        <div class="card-body p-5">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-white/80 text-sm font-medium" id="metricLabel">Rata-rata Sisa</p>
              <p class="text-3xl font-bold mt-1" id="rataMetric">0</p>
              <p class="text-white/60 text-xs mt-1" id="metricUnit">kg/hari</p>
            </div>
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i class="fas fa-chart-bar text-xl" id="metricIcon"></i>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs">
            <span class="text-white/70">📊 Klik untuk toggle</span>
            <i class="fas fa-exchange-alt text-white/50"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== LOW STOCK ALERT SECTION ==================== -->
    <div id="lowStockContainer" class="hidden mb-5">
      <div class="alert alert-warning shadow-lg border-l-8 border-l-amber-500">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <i class="fas fa-exclamation-triangle text-amber-500 text-lg"></i>
            <h3 class="font-bold text-amber-700">Peringatan Stok Menipis</h3>
          </div>
          <div id="lowStockItems" class="text-sm mt-1"></div>
        </div>
        <button onclick="window.toggleLowStockList()" class="btn btn-sm btn-ghost">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- ==================== PREDIKSI STOK + CHECKLIST HARIAN ==================== -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <!-- Prediksi Stok Habis Card -->
      <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-simple text-primary text-sm"></i>
            </div>
            <h3 class="font-semibold text-slate-700 text-sm">Prediksi Stok Habis</h3>
            <span class="text-xs text-slate-400 ml-auto">Berdasarkan pemakaian tetap</span>
          </div>
          <div id="stockPredictionList" class="space-y-2">
            <div class="text-center py-3 text-slate-400 text-xs">Memuat data prediksi...</div>
          </div>
        </div>
      </div>
     
      <!-- Checklist 3 Data Harian Card -->
      <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-check-double text-primary text-sm"></i>
            </div>
            <h3 class="font-semibold text-slate-700 text-sm">Checklist Data Harian</h3>
            <span class="text-xs text-slate-400 ml-auto">Hari ini</span>
          </div>
          <div id="dailyDataChecklist" class="space-y-2">
            <div class="text-center py-3 text-slate-400 text-xs">Memuat data checklist...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== TWO COLUMNS LAYOUT ==================== -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <!-- LEFT COLUMN -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Quick Actions Card -->
        <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
          <div class="card-body p-4">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <i class="fas fa-bolt text-primary text-sm"></i>
              </div>
              <h3 class="font-semibold text-slate-700 text-sm">Aksi Cepat</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="btn btn-primary btn-xs gap-1" onclick="window.quickAddStock('GAS_LPG_50KG', 5)">
                <i class="fas fa-plus-circle"></i> +5 LPG 50kg
              </button>
              <button class="btn btn-primary btn-xs gap-1" onclick="window.quickAddStock('GALON_AIR', 10)">
                <i class="fas fa-plus-circle"></i> +10 Galon
              </button>
              <button class="btn btn-secondary btn-xs gap-1" onclick="window.showDailyReport()">
                <i class="fas fa-chart-line"></i> Laporan
              </button>
              <button class="btn btn-accent btn-xs gap-1" onclick="window.exportToExcel()">
                <i class="fas fa-file-excel"></i> Export
              </button>
              <button class="btn btn-outline btn-xs gap-1" onclick="window.undoLastStock()">
                <i class="fas fa-undo-alt"></i> Undo
              </button>
            </div>
          </div>
        </div>

        <!-- Stock Cards Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <!-- LPG 50KG -->
          <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all group">
            <div class="card-body p-3 text-center">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <i class="fas fa-fire text-primary text-lg"></i>
              </div>
              <h3 class="font-semibold text-slate-700 text-xs">LPG 50KG</h3>
              <div class="flex items-center justify-center gap-2 my-2">
                <button class="btn btn-error btn-xs btn-circle" onclick="window.editStok('GAS_LPG_50KG', -1)">-</button>
                <p id="lpg50" class="text-xl font-bold text-primary min-w-[40px]">0</p>
                <button class="btn btn-success btn-xs btn-circle" onclick="window.editStok('GAS_LPG_50KG', 1)">+</button>
              </div>
              <p class="text-[10px] text-slate-400">Unit</p>
            </div>
          </div>

          <!-- LPG 12KG -->
          <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all group">
            <div class="card-body p-3 text-center">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <i class="fas fa-fire text-primary text-lg"></i>
              </div>
              <h3 class="font-semibold text-slate-700 text-xs">LPG 12KG</h3>
              <div class="flex items-center justify-center gap-2 my-2">
                <button class="btn btn-error btn-xs btn-circle" onclick="window.editStok('GAS_LPG_12KG', -1)">-</button>
                <p id="lpg12" class="text-xl font-bold text-primary min-w-[40px]">0</p>
                <button class="btn btn-success btn-xs btn-circle" onclick="window.editStok('GAS_LPG_12KG', 1)">+</button>
              </div>
              <p class="text-[10px] text-slate-400">Unit</p>
            </div>
          </div>

          <!-- Galon Air -->
          <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all group">
            <div class="card-body p-3 text-center">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <i class="fas fa-tint text-primary text-lg"></i>
              </div>
              <h3 class="font-semibold text-slate-700 text-xs">GALON AIR</h3>
              <div class="flex items-center justify-center gap-2 my-2">
                <button class="btn btn-error btn-xs btn-circle" onclick="window.editStok('GALON_AIR', -1)">-</button>
                <p id="galon" class="text-xl font-bold text-primary min-w-[40px]">0</p>
                <button class="btn btn-success btn-xs btn-circle" onclick="window.editStok('GALON_AIR', 1)">+</button>
              </div>
              <p class="text-[10px] text-slate-400">Unit</p>
            </div>
          </div>

          <!-- Listrik -->
          <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
            <div class="card-body p-3 text-center">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <i class="fas fa-bolt text-primary text-lg"></i>
              </div>
              <h3 class="font-semibold text-slate-700 text-xs">LISTRIK</h3>
              <div class="flex gap-1 justify-center my-2">
                <input type="number" id="inputListrik" placeholder="Jumlah" class="input input-bordered input-xs w-20 text-center">
                <button class="btn btn-primary btn-xs" onclick="window.editListrik()">Update</button>
              </div>
              <p id="listrik" class="text-xl font-bold text-primary">0</p>
              <p class="text-[10px] text-slate-400">kWh</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN - Notes -->
      <div class="card bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all">
        <div class="card-body p-3">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-1">
              <div class="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                <i class="fas fa-sticky-note text-primary text-xs"></i>
              </div>
              <h3 class="font-semibold text-slate-700 text-sm">Catatan</h3>
            </div>
            <button class="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-error" onclick="window.clearNotes()">
              <i class="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
          <div class="relative">
            <i class="fas fa-search absolute left-2 top-2 text-slate-400 text-xs"></i>
            <input type="text" id="notesSearch" placeholder="Cari..." class="input input-bordered w-full pl-7 text-xs py-1 h-8 mb-2" />
          </div>
          <textarea id="dashboardNotes" class="textarea textarea-bordered h-32 resize-none focus:border-primary text-xs" placeholder="Tulis catatan...">${savedNotes}</textarea>
          <div class="flex justify-between items-center text-[10px] text-slate-400 mt-1">
            <span><i class="far fa-clock"></i> Auto-save</span>
            <span><i class="far fa-keyboard"></i> <span id="charCount">${savedNotes.length}</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== STOK OPERASIONAL LIST SECTION ==================== -->
    <div class="card bg-white shadow-md border border-slate-100 mb-6">
      <div class="card-body p-4">
        <div class="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-boxes text-primary text-sm"></i>
            </div>
            <h3 class="font-semibold text-slate-700 text-sm">Stok Operasional Lainnya</h3>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-primary badge-xs gap-1" id="totalItemStok">
              <i class="fas fa-database text-xs"></i> 0 item
            </span>
            <button class="btn btn-ghost btn-xs gap-1" onclick="window.refreshRandomStok()">
              <i class="fas fa-random"></i> Random
            </button>
          </div>
        </div>
       
        <div id="stokOperasionalGrid" class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
          <div class="text-center py-4 text-slate-400 col-span-2 text-sm">
            <span class="loading loading-spinner loading-sm text-primary"></span>
            <p class="mt-1 text-xs">Memuat data stok...</p>
          </div>
        </div>
       
        <div class="text-center mt-3 pt-2 border-t border-slate-100">
          <button class="btn btn-link text-primary text-xs gap-1" onclick="window.goToStokPage()">
            <i class="fas fa-arrow-right"></i> Lihat Semua Stok Operasional
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== RIWAYAT PERUBAHAN ==================== -->
    <div class="card bg-white shadow-md border border-slate-100 mb-6">
      <div class="card-body p-4">
        <div class="flex justify-between items-center mb-3 flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-history text-primary text-sm"></i>
            </div>
            <h3 class="font-semibold text-slate-700 text-sm">Riwayat Perubahan Stok</h3>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <input type="date" id="historyDateFilter" class="input input-bordered input-sm w-36">
            <button onclick="window.filterHistoryByDate()" class="btn btn-primary btn-sm gap-1">
              <i class="fas fa-filter"></i> Filter
            </button>
            <button onclick="window.showAllHistory()" class="btn btn-ghost btn-sm">
              Semua Tanggal
            </button>
            <button onclick="window.clearHistory()" class="btn btn-ghost btn-xs text-slate-400 hover:text-error">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
        <div id="historyTimeline" class="max-h-96 overflow-y-auto custom-scrollbar pr-2">
          <!-- Timeline diisi otomatis oleh JS -->
        </div>
      </div>
    </div>

    <!-- ==================== CHARTS SECTION ==================== -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <!-- Trend Chart -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-4">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <i class="fas fa-chart-line text-primary text-sm"></i>
              </div>
              <h3 class="font-semibold text-slate-700 text-sm">Trend Stok</h3>
            </div>
            <div class="flex items-center gap-2">
              <select id="chartFilterDays" class="select select-xs select-bordered w-24 text-xs" onchange="window.changeChartDays()">
                <option value="7">7 Hari</option>
                <option value="14">14 Hari</option>
                <option value="30">30 Hari</option>
                <option value="custom">Custom</option>
              </select>
              <div id="customDateRange" class="hidden flex gap-1">
                <input type="date" id="startDate" class="input input-xs input-bordered w-24">
                <input type="date" id="endDate" class="input input-xs input-bordered w-24">
                <button class="btn btn-xs btn-primary" onclick="window.applyCustomDate()">Go</button>
              </div>
            </div>
          </div>
          <canvas id="trendChart" class="w-full h-52"></canvas>
        </div>
      </div>
     
      <!-- Sisa Pengolahan Chart -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-bar text-primary text-sm"></i>
            </div>
            <h3 class="font-semibold text-slate-700 text-sm">Sisa Pengolahan</h3>
          </div>
          <canvas id="chartSisa" class="w-full h-52"></canvas>
        </div>
      </div>
     
      <!-- Sampah Ompreng Chart -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-bar text-primary text-sm"></i>
            </div>
            <h3 class="font-semibold text-slate-700 text-sm">Sampah Ompreng</h3>
          </div>
          <canvas id="chartOmpreng" class="w-full h-52"></canvas>
        </div>
      </div>
    </div>

    <!-- ==================== TIMESTAMP ==================== -->
    <div class="flex justify-between items-center text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
      <div class="flex items-center gap-2">
        <i class="fas fa-database"></i>
        <span>Data tersimpan di Firebase</span>
      </div>
      <div id="lastUpdate">
        <i class="far fa-clock"></i> Terakhir update: --
      </div>
    </div>

    <!-- ==================== MODALS ==================== -->
    <!-- Report Modal -->
    <dialog id="reportModal" class="modal">
      <div class="modal-box max-w-2xl">
        <div class="flex justify-between items-center mb-4 pb-2 border-b">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-line text-primary text-sm"></i>
            </div>
            <h3 class="font-bold text-base text-primary">Laporan Harian</h3>
          </div>
          <button class="btn btn-sm btn-circle btn-ghost" onclick="window.closeModal()">✕</button>
        </div>
        <div id="reportContent" class="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar"></div>
        <div class="modal-action">
          <button class="btn btn-primary btn-xs" onclick="window.exportToExcel()">
            <i class="fas fa-file-excel"></i> Export CSV
          </button>
        </div>
      </div>
    </dialog>
   
    <!-- Edit Stock Modal -->
    <dialog id="editStockModal" class="modal">
      <div class="modal-box max-w-md">
        <div class="flex justify-between items-center mb-4 pb-2 border-b">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <i class="fas fa-edit text-primary text-sm"></i>
            </div>
            <h3 class="font-bold text-base text-primary" id="editStockTitle">Edit Stok</h3>
          </div>
          <button class="btn btn-sm btn-circle btn-ghost" onclick="window.closeEditStockModal()">✕</button>
        </div>
        <div id="editStockContent"></div>
      </div>
    </dialog>
  `;
}

// ============================================================
// SECTION 2: INITIALIZATION
// ============================================================
async function initializePage() {
  const isLoggedIn = await initAuthGuard();
  if (!isLoggedIn) return;
}

export function initDashboard() {
  updateDashboard();
  initNotes();
  checkBrowserNotification();
  loadStokOperasionalList();
  loadHistoryFromFirebase();

  setInterval(() => {
    updateDailyDataChecklist();
    updateStockPrediction();
  }, 30000);
}

export function updateDashboard() {
  updateTimestamp();

  // Update Stok Operasional
  onValue(stokRef, (snap) => {
    const d = snap.val() || {};
    const stokValues = {
      'GAS_LPG_50KG': d['GAS_LPG_50KG']?.stok || 0,
      'GAS_LPG_12KG': d['GAS_LPG_12KG']?.stok || 0,
      'GALON_AIR': d['GALON_AIR']?.stok || 0,
      'LISTRIK': d['LISTRIK']?.stok || 0
    };

    const elements = { lpg50: 'GAS_LPG_50KG', lpg12: 'GAS_LPG_12KG', galon: 'GALON_AIR', listrik: 'LISTRIK' };
    Object.entries(elements).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = stokValues[key];
    });

    updateKPI(stokValues);
    updateLowStockList(stokValues);
    checkLowStock(stokValues);
    updateStockPrediction();
  });

  // Update Sisa Pengolahan Chart
  onValue(sisaPengRef, (snap) => {
    const data = snap.val() || {};
    const sortedData = Object.values(data).sort((a, b) => new Date(a.tanggalISO) - new Date(b.tanggalISO));
    const dates = sortedData.slice(-7).map(item => item.tanggalDisplay);
    const datasets = ["pokok","sayur","laukpauk","lauknabati","buah"].map((key, i) => ({
      label: ["Makanan Pokok","Sayur","Lauk Pauk","Lauk Nabati","Buah/Susu"][i],
      data: sortedData.slice(-7).map(item => item[key] || 0),
      backgroundColor: ['#1e3a5f','#2c5282','#3182ce','#4299e1','#63b3ed'][i],
      borderRadius: 6,
      barPercentage: 0.7,
      categoryPercentage: 0.8
    }));

    const ctx = document.getElementById('chartSisa');
    if (ctx) {
      if (chartSisa) chartSisa.destroy();
      chartSisa = new Chart(ctx, {
        type: 'bar',
        data: { labels: dates, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 9 } } },
            tooltip: { bodyFont: { size: 10 } }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'kg', font: { size: 9 } } },
            x: { ticks: { font: { size: 9, rotation: 45, maxRotation: 45 } } }
          }
        }
      });
      updateRataMetric(data, null);
    }
    updateDailyDataChecklist();
  });

  // Update Ompreng Chart
  onValue(omprengRef, (snap) => {
    const data = snap.val() || {};
    const sortedData = Object.values(data).sort((a, b) => new Date(a.tanggalISO) - new Date(b.tanggalISO));
    const dates = sortedData.slice(-7).map(item => item.tanggalDisplay);
    const datasets = ["pokok","sayur","laukpauk","lauknabati","buah"].map((key, i) => ({
      label: ["Makanan Pokok","Sayur","Lauk Pauk","Lauk Nabati","Buah/Susu"][i],
      data: sortedData.slice(-7).map(item => item[key] || 0),
      backgroundColor: ['#1e3a5f','#2c5282','#3182ce','#4299e1','#63b3ed'][i],
      borderRadius: 6,
      barPercentage: 0.7,
      categoryPercentage: 0.8
    }));

    const ctx = document.getElementById('chartOmpreng');
    if (ctx) {
      if (chartOmpreng) chartOmpreng.destroy();
      chartOmpreng = new Chart(ctx, {
        type: 'bar',
        data: { labels: dates, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 9 } } },
            tooltip: { bodyFont: { size: 10 } }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'kg', font: { size: 9 } } },
            x: { ticks: { font: { size: 9, rotation: 45, maxRotation: 45 } } }
          }
        }
      });
      updateRataMetric(null, data);
    }
    updateDailyDataChecklist();
  });

  onValue(absensiRef, () => updateDailyDataChecklist());

  initTrendChart();
  updateDailyDataChecklist();
}

// ============================================================
// LOG ACTIVITY HELPER (BARU)
// ============================================================


// ============================================================
// SECTION 3: KPI FUNCTIONS
// ============================================================
function updateKPI(stokValues) {
  const total = Object.values(stokValues).reduce((a, b) => a + b, 0);
  const totalStokEl = document.getElementById('totalStok');
  if (totalStokEl) totalStokEl.textContent = total;
}

// ============================================================
// SECTION 4: LOW STOCK FUNCTIONS
// ============================================================
window.toggleLowStockList = function() {
  const container = document.getElementById('lowStockContainer');
  if (container) container.classList.toggle('hidden');
};

function updateLowStockList(stokValues) {
  const lowStockItems = [];
  Object.keys(STOCK_THRESHOLDS).forEach(key => {
    const stok = stokValues[key] || 0;
    const threshold = STOCK_THRESHOLDS[key];
    if (stok <= threshold) {
      let displayName = key.replace(/_/g, ' ');
      if (key === 'LISTRIK') displayName = 'LISTRIK (kWh)';
      lowStockItems.push({ name: displayName, stok: stok, threshold: threshold });
    }
  });

  const itemsContainer = document.getElementById('lowStockItems');
  const stokMenipisEl = document.getElementById('stokMenipis');

  if (stokMenipisEl) stokMenipisEl.textContent = lowStockItems.length;

  if (itemsContainer) {
    if (lowStockItems.length > 0) {
      itemsContainer.innerHTML = lowStockItems.map(item => `
        <div class="flex justify-between items-center p-1.5 bg-amber-50 rounded-lg mt-1">
          <span class="flex items-center gap-1 text-amber-700 text-xs">⚠️ ${item.name}</span>
          <span class="badge badge-error badge-xs">${item.stok} / ${item.threshold}</span>
        </div>
      `).join('');
    } else {
      itemsContainer.innerHTML = '<div class="text-center text-green-600 py-1 text-xs">✅ Semua stok aman</div>';
    }
  }
}

function checkLowStock(stokValues) {
  const lowStokItems = [];
  Object.keys(STOCK_THRESHOLDS).forEach(key => {
    const stok = stokValues[key] || 0;
    if (stok <= STOCK_THRESHOLDS[key]) {
      lowStokItems.push(`${key.replace(/_/g, ' ')}: ${stok}`);
    }
  });

  if (lowStokItems.length > 0 && !lowStockAlertShown) {
    showToast(`⚠️ Stok menipis!\n${lowStokItems.join('\n')}`, 5000, 'warning');
    sendBrowserNotification('Peringatan Stok', lowStokItems.join('\n'));
    lowStockAlertShown = true;
    setTimeout(() => { lowStockAlertShown = false; }, 300000);
  }
}

// ============================================================
// SECTION 5: METRIC TOGGLE FUNCTIONS
// ============================================================
window.toggleMetric = function() {
  currentMetric = currentMetric === 'sisa' ? 'ompreng' : 'sisa';
  const metricLabel = document.getElementById('metricLabel');
  const metricIcon = document.getElementById('metricIcon');
  const metricUnit = document.getElementById('metricUnit');

  if (currentMetric === 'sisa') {
    metricLabel.innerHTML = 'Rata-rata Sisa';
    metricIcon.className = 'fas fa-chart-bar text-xl';
    if (metricUnit) metricUnit.innerHTML = 'kg/hari';
  } else {
    metricLabel.innerHTML = 'Rata-rata Ompreng';
    metricIcon.className = 'fas fa-trash-alt text-xl';
    if (metricUnit) metricUnit.innerHTML = 'kg/hari';
  }

  get(sisaPengRef).then(snap => updateRataMetric(snap.val(), null));
  get(omprengRef).then(snap => updateRataMetric(null, snap.val()));
};

function updateRataMetric(sisaData, omprengData) {
  const rataMetricEl = document.getElementById('rataMetric');
  if (!rataMetricEl) return;

  let total = 0;
  let count = 0;

  let data = null;
  if (currentMetric === 'sisa') {
    data = sisaData;
  } else {
    data = omprengData;
  }

  if (!data) {
    if (currentMetric === 'sisa') {
      get(sisaPengRef).then(snap => {
        if (snap.exists()) calculateAndUpdateMetric(snap.val());
        else rataMetricEl.textContent = '0';
      });
      return;
    } else {
      get(omprengRef).then(snap => {
        if (snap.exists()) calculateAndUpdateMetric(snap.val());
        else rataMetricEl.textContent = '0';
      });
      return;
    }
  }

  calculateAndUpdateMetric(data);

  function calculateAndUpdateMetric(dataObj) {
    let totalVal = 0;
    let countVal = 0;

    if (dataObj && typeof dataObj === 'object') {
      Object.values(dataObj).forEach(item => {
        if (item && typeof item === 'object') {
          totalVal += (item.pokok || 0) + (item.sayur || 0) + (item.laukpauk || 0) +
                     (item.lauknabati || 0) + (item.buah || 0);
          countVal++;
        }
      });
    }

    const result = countVal > 0 ? (totalVal / countVal).toFixed(1) : '0';
    rataMetricEl.textContent = result;
  }
}

// ============================================================
// SECTION 6: TOTAL STOCK DETAIL + EXPORT
// ============================================================
window.showTotalStockDetail = async function() {
  try {
    const snapshot = await get(stokRef);
    const data = snapshot.val() || {};

    const allStoks = [];
    let grandTotal = 0;

    for (const [key, value] of Object.entries(data)) {
      const nama = value.nama || key.replace(/_/g, ' ');
      const stok = value.stok || 0;
      allStoks.push({ nama, stok });
      grandTotal += stok;
    }

    allStoks.sort((a, b) => b.stok - a.stok);

    const modal = document.getElementById('reportModal');
    const reportContent = document.getElementById('reportContent');

    if (!modal || !reportContent) return;

    reportContent.innerHTML = `
      <div class="alert alert-success shadow-lg mb-3 py-2 text-sm">
        <i class="fas fa-chart-simple"></i>
        <span class="font-bold">TOTAL STOK KESELURUHAN: ${grandTotal}</span>
      </div>
      <div class="space-y-2 mt-3">
        <div class="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">
          <i class="fas fa-list-ul text-primary"></i> Rincian per Item
        </div>
        <div class="max-h-80 overflow-y-auto custom-scrollbar">
          ${allStoks.map(item => `
            <div class="flex justify-between items-center py-1.5 border-b border-slate-100 text-sm">
              <span class="text-slate-600">${escapeHtml(item.nama)}</span>
              <span class="badge badge-primary badge-sm">${item.stok}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-action mt-3">
        <button class="btn btn-primary btn-xs gap-1" onclick="window.exportAllStockToCSV()">
          <i class="fas fa-file-excel"></i> Export Semua Stok (CSV)
        </button>
      </div>
    `;

    modal.showModal();
  } catch (error) {
    console.error('Error:', error);
    showToast('Gagal memuat detail stok', 3000, 'error');
  }
};

window.exportAllStockToCSV = async function() {
  try {
    const snapshot = await get(stokRef);
    const data = snapshot.val() || {};

    const allStoks = [];
    let grandTotal = 0;

    for (const [key, value] of Object.entries(data)) {
      const nama = value.nama || key.replace(/_/g, ' ');
      const stok = value.stok || 0;
      if (stok > 0) {
        allStoks.push({ nama, stok });
        grandTotal += stok;
      }
    }

    allStoks.sort((a, b) => b.stok - a.stok);

    const todayISO = getTodayISO();
    const csvRows = [
      ['=== LAPORAN TOTAL STOK OPERASIONAL ==='],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
      [`Total Keseluruhan: ${grandTotal}`], [],
      ['Nama Barang', 'Jumlah Stok'],
      ...allStoks.map(item => [item.nama, item.stok])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `total_stok_operasional_${todayISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`✅ Berhasil export ${allStoks.length} item stok`, 2000, 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Gagal mengexport data stok', 3000, 'error');
  }
};

// ============================================================
// SECTION 7: STOK OPERASIONAL LIST
// ============================================================
function loadStokOperasionalList() {
  onValue(stokRef, (snapshot) => {
    const data = snapshot.val() || {};

    const stokArray = Object.values(data)
      .filter(item => item.nama && !['GAS_LPG_50KG', 'GAS_LPG_12KG', 'GALON_AIR', 'LISTRIK'].includes(item.nama.replace(/ /g, '_')))
      .map(item => ({
        nama: item.nama,
        stok: item.stok || 0,
        kategori: item.kategori || 'Barang Lainnya'
      }));

    const totalItemEl = document.getElementById('totalItemStok');
    if (totalItemEl) totalItemEl.innerHTML = `<i class="fas fa-database text-xs"></i> ${stokArray.length} item`;

    currentRandomStoks = stokArray;
    displayRandomStok();
  });
}

function displayRandomStok() {
  const gridContainer = document.getElementById('stokOperasionalGrid');
  if (!gridContainer) return;

  if (currentRandomStoks.length === 0) {
    gridContainer.innerHTML = `
      <div class="text-center py-4 text-slate-400 col-span-2 text-sm">
        <i class="fas fa-box-open text-3xl mb-1 block"></i>
        <p class="text-xs">Belum ada data stok operasional</p>
        <p class="text-[10px] mt-0.5">Tambahkan stok di halaman Stok Operasional</p>
      </div>
    `;
    return;
  }

  const shuffled = [...currentRandomStoks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const displayItems = shuffled.slice(0, 6);

  gridContainer.innerHTML = displayItems.map(item => {
    const isLowStock = item.stok < 5;
    const badgeClass = isLowStock ? 'badge-error' : 'badge-success';

    return `
      <div class="flex justify-between items-center p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-primary/5 hover:shadow-md transition-all group" onclick="window.editStockDirectFromDashboard('${item.nama.replace(/'/g, "\\'")}', ${item.stok})">
        <div class="flex-1">
          <p class="font-medium text-slate-700 group-hover:text-primary transition-colors text-sm">${escapeHtml(item.nama)}</p>
          <p class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
            <i class="fas ${CATEGORY_ICONS[item.kategori] || 'fa-boxes'} text-xs"></i>
            ${item.kategori}
          </p>
        </div>
        <div class="badge ${badgeClass} badge-sm">${item.stok}</div>
      </div>
    `;
  }).join('');
}

window.refreshRandomStok = function() {
  displayRandomStok();
  showToast('Stok operasional diacak!', 1500, 'info');
};

// ============================================================
// SECTION 8: EDIT STOCK FROM DASHBOARD MODAL
// ============================================================
window.editStockDirectFromDashboard = function(nama, currentStock) {
  const modal = document.getElementById('editStockModal');
  const editTitle = document.getElementById('editStockTitle');
  const editContent = document.getElementById('editStockContent');

  if (!modal || !editContent) return;

  editTitle.innerHTML = `<i class="fas fa-edit text-primary"></i> Edit Stok: ${escapeHtml(nama)}`;
  editContent.innerHTML = `
    <div class="form-control">
      <label class="label">
        <span class="label-text text-sm">Jumlah Stok Baru</span>
      </label>
      <input type="number" id="editStockValueDashboard" step="0.01" value="${currentStock}" class="input input-bordered w-full text-sm" placeholder="Masukkan jumlah stok baru">
    </div>
    <div class="flex gap-3 mt-4">
      <button class="btn btn-primary flex-1 btn-sm" onclick="window.saveStockEditFromDashboard('${nama.replace(/'/g, "\\'")}')">
        <i class="fas fa-save"></i> Simpan
      </button>
      <button class="btn btn-ghost flex-1 btn-sm" onclick="window.closeEditStockModal()">
        <i class="fas fa-times"></i> Batal
      </button>
    </div>
  `;

  modal.showModal();
  setTimeout(() => document.getElementById('editStockValueDashboard')?.focus(), 100);
};

window.saveStockEditFromDashboard = async function(nama) {
  const newStock = parseFloat(document.getElementById('editStockValueDashboard').value);

  if (isNaN(newStock) || newStock < 0) {
    showToast('Masukkan jumlah yang valid (minimal 0)!', 3000, 'error');
    return;
  }

  const key = nama.replace(/[^a-zA-Z0-9]/g, '_');

  try {
    const snapshot = await get(ref(db, 'stok_operasional/' + key));
    const kategori = snapshot.exists() ? snapshot.val().kategori : 'Barang Lainnya';
    const stokLama = snapshot.exists() ? snapshot.val().stok || 0 : 0;

    await set(ref(db, 'stok_operasional/' + key), { nama, stok: newStock, kategori });

    await saveChangeToHistory('Edit Manual', nama, stokLama, newStock);

    showToast(`✅ Stok "${nama}" diubah menjadi ${newStock}`, 2000, 'success');
    window.closeEditStockModal();
    loadStokOperasionalList();
  } catch (error) {
    console.error("Error update stok:", error);
    showToast('Gagal mengupdate stok: ' + error.message, 3000, 'error');
  }
};

window.closeEditStockModal = function() {
  const modal = document.getElementById('editStockModal');
  if (modal) modal.close();
};

window.goToStokPage = function() {
  if (typeof window.loadPage === 'function') {
    window.loadPage('stok');
  } else {
    showToast('Silakan buka halaman Stok Operasional dari menu', 2000);
  }
};

// ============================================================
// SECTION 9: NOTES FUNCTIONS
// ============================================================
function initNotes() {
  const textarea = document.getElementById('dashboardNotes');
  const charCount = document.getElementById('charCount');

  if (textarea) {
    textarea.addEventListener('input', function() {
      if (charCount) charCount.textContent = this.value.length;
      localStorage.setItem('dashboard_notes', this.value);
    });
  }

  const searchInput = document.getElementById('notesSearch');
  if (searchInput && textarea) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      if (keyword && textarea.value.toLowerCase().includes(keyword)) {
        textarea.classList.add('bg-amber-50');
        setTimeout(() => textarea.classList.remove('bg-amber-50'), 1000);
      }
    });
  }
}

window.clearNotes = function() {
  if (confirm('Hapus semua catatan? Tindakan ini tidak dapat dibatalkan.')) {
    const textarea = document.getElementById('dashboardNotes');
    if (textarea) {
      textarea.value = '';
      const charCount = document.getElementById('charCount');
      if (charCount) charCount.textContent = '0';
      localStorage.setItem('dashboard_notes', '');
      showToast('Catatan berhasil dihapus', 2000);
    }
  }
};

// ============================================================
// SECTION 10: QUICK ACTIONS
// ============================================================
window.quickAddStock = async (itemKey, amount) => editStok(itemKey, amount);

// ============================================================
// SECTION 11: STOCK MANAGEMENT
// ============================================================
export async function editListrik() {
  const inputListrik = document.getElementById('inputListrik');
  const nilaiBaru = parseFloat(inputListrik.value);

  if (isNaN(nilaiBaru) || nilaiBaru < 0) {
    showToast('Masukkan jumlah yang valid!', 3000, 'error');
    return;
  }

  try {
    const stokLama = parseFloat(document.getElementById('listrik').textContent) || 0;

    await set(ref(db, 'stok_operasional/LISTRIK'), { nama: "LISTRIK", stok: nilaiBaru });

    await saveChangeToHistory('Update Listrik', 'Listrik', stokLama, nilaiBaru);

    document.getElementById('listrik').textContent = nilaiBaru;
    inputListrik.value = '';
    showToast(`⚡ Listrik diupdate menjadi ${nilaiBaru} kWh`, 2000, 'success');
    updateTimestamp();
    updateStockPrediction();
  } catch (error) {
    console.error("Error update listrik:", error);
    showToast('Gagal mengupdate listrik!', 3000, 'error');
  }
}

export async function editStok(namaKey, perubahan) {
  try {
    const snapshot = await get(ref(db, 'stok_operasional/' + namaKey));
    let stokSekarang = snapshot.exists() ? snapshot.val().stok || 0 : 0;
    let namaAsli = snapshot.exists() ? snapshot.val().nama : namaKey.replace(/_/g, ' ');
    const stokBaru = Math.max(0, stokSekarang + perubahan);

    await set(ref(db, 'stok_operasional/' + namaKey), { nama: namaAsli, stok: stokBaru });

    const action = perubahan > 0 ? 'Penambahan Stok' : 'Pengurangan Stok';
    await saveChangeToHistory(action, namaAsli, stokSekarang, stokBaru);

    const elementId = namaKey === "GAS_LPG_50KG" ? "lpg50" : namaKey === "GAS_LPG_12KG" ? "lpg12" : "galon";
    const element = document.getElementById(elementId);
    if (element) element.textContent = stokBaru;

    const perubahanText = perubahan > 0 ? `+${perubahan}` : perubahan;
    showToast(`${namaAsli}: ${perubahanText} → Stok sekarang ${stokBaru}`, 2000);
    updateTimestamp();
    updateStockPrediction();
  } catch (error) {
    console.error("Error update stok:", error);
    showToast('Gagal mengupdate stok!', 3000, 'error');
  }
}

// ============================================================
// SECTION 12: NOTIFICATION & HELPER
// ============================================================
function checkBrowserNotification() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

function updateTimestamp() {
  const timestampEl = document.getElementById('lastUpdate');
  if (timestampEl) {
    timestampEl.innerHTML = `<i class="far fa-clock"></i> Terakhir update: ${new Date().toLocaleTimeString('id-ID')}`;
  }
}

// ============================================================
// SECTION 13: PREDIKSI STOK HABIS
// ============================================================
async function updateStockPrediction() {
  try {
    const stokSnapshot = await get(stokRef);
    const stokData = stokSnapshot.val() || {};

    const currentLpg50 = stokData['GAS_LPG_50KG']?.stok || 0;
    const currentLpg12 = stokData['GAS_LPG_12KG']?.stok || 0;
    const currentGalon = stokData['GALON_AIR']?.stok || 0;
    const currentListrik = stokData['LISTRIK']?.stok || 0;

    const lpg50DaysLeft = Math.floor(currentLpg50 / DAILY_USAGE.GAS_LPG_50KG);
    const lpg12DaysLeft = Math.floor(currentLpg12 / DAILY_USAGE.GAS_LPG_12KG);
    const galonDaysLeft = Math.floor(currentGalon / DAILY_USAGE.GALON_AIR);
    const listrikDaysLeft = Math.floor(currentListrik / DAILY_USAGE.LISTRIK);

    const getStatusClass = (days) => {
      if (days <= 2) return 'text-error font-bold';
      if (days <= 5) return 'text-warning font-semibold';
      return 'text-primary';
    };

    const predictionContainer = document.getElementById('stockPredictionList');
    if (predictionContainer) {
      predictionContainer.innerHTML = `
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-1.5">
              <i class="fas fa-fire text-amber-500 text-sm"></i>
              <span class="text-xs font-medium">LPG 50kg</span>
            </div>
            <div>
              <span class="text-xs font-bold ${getStatusClass(lpg50DaysLeft)}">${lpg50DaysLeft}</span>
              <span class="text-[10px] text-slate-400"> hari</span>
            </div>
          </div>
          <div class="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-1.5">
              <i class="fas fa-fire text-orange-500 text-sm"></i>
              <span class="text-xs font-medium">LPG 12kg</span>
            </div>
            <div>
              <span class="text-xs font-bold ${getStatusClass(lpg12DaysLeft)}">${lpg12DaysLeft}</span>
              <span class="text-[10px] text-slate-400"> hari</span>
            </div>
          </div>
          <div class="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-1.5">
              <i class="fas fa-tint text-blue-500 text-sm"></i>
              <span class="text-xs font-medium">Galon Air</span>
            </div>
            <div>
              <span class="text-xs font-bold ${getStatusClass(galonDaysLeft)}">${galonDaysLeft}</span>
              <span class="text-[10px] text-slate-400"> hari</span>
            </div>
          </div>
          <div class="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-1.5">
              <i class="fas fa-bolt text-yellow-500 text-sm"></i>
              <span class="text-xs font-medium">Listrik</span>
            </div>
            <div>
              <span class="text-xs font-bold ${getStatusClass(listrikDaysLeft)}">${listrikDaysLeft}</span>
              <span class="text-[10px] text-slate-400"> hari</span>
            </div>
          </div>
        </div>
        ${(lpg50DaysLeft <= 2 || lpg12DaysLeft <= 2 || galonDaysLeft <= 2 || listrikDaysLeft <= 2) ? `
          <div class="alert alert-warning py-1.5 mt-2">
            <i class="fas fa-exclamation-triangle text-xs"></i>
            <span class="text-[10px]">Stok akan segera habis! Segera lakukan pembelian.</span>
          </div>
        ` : ''}
      `;
    }
  } catch (error) {
    console.error('Prediksi error:', error);
  }
}

// ============================================================
// SECTION 14: CHECKLIST TIGA DATA HARIAN
// ============================================================
async function updateDailyDataChecklist() {
  try {
    const todayISO = getTodayISO();

    const absensiSnapshot = await get(absensiRef);
    const absensiData = absensiSnapshot.val() || {};
    const hasAbsensiToday = Object.values(absensiData).some(item => item.tanggalISO === todayISO);

    const sisaSnapshot = await get(sisaPengRef);
    const sisaData = sisaSnapshot.val() || {};
    const hasSisaToday = Object.values(sisaData).some(item => item.tanggalISO === todayISO);

    const omprengSnapshot = await get(omprengRef);
    const omprengData = omprengSnapshot.val() || {};
    const hasOmprengToday = Object.values(omprengData).some(item => item.tanggalISO === todayISO);

    updateChecklistUI(hasAbsensiToday, hasSisaToday, hasOmprengToday);
  } catch (error) {
    console.error('Error checking daily data:', error);
    const container = document.getElementById('dailyDataChecklist');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-2 text-slate-400">
          <i class="fas fa-exclamation-triangle text-xs"></i>
          <p class="text-[10px] mt-0.5">Gagal memuat data</p>
        </div>
      `;
    }
  }
}

function updateChecklistUI(hasAbsensi, hasSisa, hasOmpreng) {
  const container = document.getElementById('dailyDataChecklist');
  if (!container) return;

  const allCompleted = hasAbsensi && hasSisa && hasOmpreng;

  container.innerHTML = `
    <div class="space-y-2">
      <div class="flex items-center justify-between p-2 rounded-lg ${hasAbsensi ? 'bg-green-50' : 'bg-amber-50'} cursor-pointer hover:opacity-80 transition-all" onclick="window.goToPageWithAlert('absensi', 'Absensi Relawan')">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full flex items-center justify-center ${hasAbsensi ? 'bg-green-500' : 'bg-amber-500'} text-white">
            <i class="fas ${hasAbsensi ? 'fa-check' : 'fa-exclamation'} text-xs"></i>
          </div>
          <div>
            <p class="text-xs font-medium ${hasAbsensi ? 'text-green-700' : 'text-amber-700'}">Absensi Relawan</p>
            <p class="text-[10px] text-slate-400">Data kehadiran relawan</p>
          </div>
        </div>
        <div class="text-right">
          ${hasAbsensi ? '<span class="badge badge-success badge-xs">Sudah diisi</span>' : '<span class="badge badge-warning badge-xs">Belum diisi</span>'}
        </div>
      </div>

      <div class="flex items-center justify-between p-2 rounded-lg ${hasSisa ? 'bg-green-50' : 'bg-amber-50'} cursor-pointer hover:opacity-80 transition-all" onclick="window.goToPageWithAlert('sisa', 'Sisa Pengolahan')">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full flex items-center justify-center ${hasSisa ? 'bg-green-500' : 'bg-amber-500'} text-white">
            <i class="fas ${hasSisa ? 'fa-check' : 'fa-exclamation'} text-xs"></i>
          </div>
          <div>
            <p class="text-xs font-medium ${hasSisa ? 'text-green-700' : 'text-amber-700'}">Sisa Pengolahan</p>
            <p class="text-[10px] text-slate-400">Data sisa makanan</p>
          </div>
        </div>
        <div class="text-right">
          ${hasSisa ? '<span class="badge badge-success badge-xs">Sudah diisi</span>' : '<span class="badge badge-warning badge-xs">Belum diisi</span>'}
        </div>
      </div>

      <div class="flex items-center justify-between p-2 rounded-lg ${hasOmpreng ? 'bg-green-50' : 'bg-amber-50'} cursor-pointer hover:opacity-80 transition-all" onclick="window.goToPageWithAlert('ompreng', 'Sampah Ompreng')">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full flex items-center justify-center ${hasOmpreng ? 'bg-green-500' : 'bg-amber-500'} text-white">
            <i class="fas ${hasOmpreng ? 'fa-check' : 'fa-exclamation'} text-xs"></i>
          </div>
          <div>
            <p class="text-xs font-medium ${hasOmpreng ? 'text-green-700' : 'text-amber-700'}">Sampah Ompreng</p>
            <p class="text-[10px] text-slate-400">Data sampah dapur</p>
          </div>
        </div>
        <div class="text-right">
          ${hasOmpreng ? '<span class="badge badge-success badge-xs">Sudah diisi</span>' : '<span class="badge badge-warning badge-xs">Belum diisi</span>'}
        </div>
      </div>

      <div class="mt-3 pt-2 border-t border-slate-100 text-center">
        ${allCompleted ?
          '<span class="badge badge-success gap-1"><i class="fas fa-check-circle"></i> Lengkap! Semua data sudah diisi hari ini</span>' :
          '<span class="badge badge-warning gap-1"><i class="fas fa-clock"></i> Masih ada data yang belum diisi</span>'}
      </div>
    </div>
  `;
}

window.goToPageWithAlert = function(page, dataName) {
  if (typeof window.loadPage === 'function') {
    window.loadPage(page);
    showToast(`📝 Silakan isi data ${dataName} untuk hari ini`, 2000, 'info');
  } else {
    showToast(`Silakan buka halaman ${dataName} dari menu`, 2000);
  }
};

// ============================================================
// SECTION 15: DAILY REPORT & EXPORT
// ============================================================
window.showDailyReport = async function() {
  const modal = document.getElementById('reportModal');
  const reportContent = document.getElementById('reportContent');

  if (!modal || !reportContent) return;

  reportContent.innerHTML = `
    <div class="text-center py-4">
      <span class="loading loading-spinner loading-sm text-primary"></span>
      <p class="mt-1 text-slate-500 text-xs">Memuat data laporan...</p>
    </div>
  `;
  modal.showModal();

  try {
    const [stokSnap, sisaSnap, omprengSnap] = await Promise.all([get(stokRef), get(sisaPengRef), get(omprengRef)]);
    const stokData = stokSnap.val() || {};
    const todayISO = getTodayISO();
    const todayDisplay = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const todaySisa = Object.values(sisaSnap.val() || {}).find(d => d.tanggalISO === todayISO) || {};
    const todayOmpreng = Object.values(omprengSnap.val() || {}).find(d => d.tanggalISO === todayISO) || {};

    const totalSisa = (todaySisa.pokok || 0) + (todaySisa.sayur || 0) + (todaySisa.laukpauk || 0) + (todaySisa.lauknabati || 0) + (todaySisa.buah || 0);
    const totalOmpreng = (todayOmpreng.pokok || 0) + (todayOmpreng.sayur || 0) + (todayOmpreng.laukpauk || 0) + (todayOmpreng.lauknabati || 0) + (todayOmpreng.buah || 0);

    reportContent.innerHTML = `
      <div class="alert alert-info shadow-md py-2 text-sm">
        <i class="fas fa-calendar-day"></i>
        <span class="font-medium">Tanggal Laporan: ${todayDisplay}</span>
      </div>
      <div class="bg-slate-50 rounded-lg p-3">
        <h4 class="font-semibold text-slate-700 flex items-center gap-2 mb-2 text-sm">
          <i class="fas fa-boxes text-primary"></i> Stok Operasional Saat Ini
        </h4>
        <div class="grid grid-cols-2 gap-1 text-xs">
          <div class="text-slate-500">LPG 50kg:</div><div class="font-semibold">${stokData['GAS_LPG_50KG']?.stok || 0} unit</div>
          <div class="text-slate-500">LPG 12kg:</div><div class="font-semibold">${stokData['GAS_LPG_12KG']?.stok || 0} unit</div>
          <div class="text-slate-500">Galon Air:</div><div class="font-semibold">${stokData['GALON_AIR']?.stok || 0} unit</div>
          <div class="text-slate-500">Listrik:</div><div class="font-semibold">${stokData['LISTRIK']?.stok || 0} kWh</div>
        </div>
      </div>
      <div class="bg-slate-50 rounded-lg p-3">
        <h4 class="font-semibold text-slate-700 flex items-center gap-2 mb-2 text-sm">
          <i class="fas fa-recycle text-primary"></i> Sisa Pengolahan
        </h4>
        <div class="grid grid-cols-2 gap-1 text-xs">
          <div class="text-slate-500">Makanan Pokok:</div><div class="font-semibold">${todaySisa.pokok || 0} kg</div>
          <div class="text-slate-500">Sayur:</div><div class="font-semibold">${todaySisa.sayur || 0} kg</div>
          <div class="text-slate-500">Lauk Pauk:</div><div class="font-semibold">${todaySisa.laukpauk || 0} kg</div>
          <div class="text-slate-500">Lauk Nabati:</div><div class="font-semibold">${todaySisa.lauknabati || 0} kg</div>
          <div class="text-slate-500">Buah/Susu:</div><div class="font-semibold">${todaySisa.buah || 0} kg</div>
          <div class="border-t pt-1 mt-1 font-semibold text-primary">Total:</div><div class="border-t pt-1 mt-1 font-bold text-primary">${totalSisa} kg</div>
        </div>
      </div>
      <div class="bg-slate-50 rounded-lg p-3">
        <h4 class="font-semibold text-slate-700 flex items-center gap-2 mb-2 text-sm">
          <i class="fas fa-trash-alt text-primary"></i> Sampah Ompreng
        </h4>
        <div class="grid grid-cols-2 gap-1 text-xs">
          <div class="text-slate-500">Makanan Pokok:</div><div class="font-semibold">${todayOmpreng.pokok || 0} kg</div>
          <div class="text-slate-500">Sayur:</div><div class="font-semibold">${todayOmpreng.sayur || 0} kg</div>
          <div class="text-slate-500">Lauk Pauk:</div><div class="font-semibold">${todayOmpreng.laukpauk || 0} kg</div>
          <div class="text-slate-500">Lauk Nabati:</div><div class="font-semibold">${todayOmpreng.lauknabati || 0} kg</div>
          <div class="text-slate-500">Buah/Susu:</div><div class="font-semibold">${todayOmpreng.buah || 0} kg</div>
          <div class="border-t pt-1 mt-1 font-semibold text-primary">Total:</div><div class="border-t pt-1 mt-1 font-bold text-primary">${totalOmpreng} kg</div>
        </div>
      </div>
      <div class="bg-slate-50 rounded-lg p-3">
        <h4 class="font-semibold text-slate-700 flex items-center gap-2 mb-2 text-sm">
          <i class="fas fa-sticky-note text-primary"></i> Catatan
        </h4>
        <div class="text-xs text-slate-600 p-1.5 bg-white rounded">
          ${document.getElementById('dashboardNotes')?.value || '<em class="text-slate-400">Tidak ada catatan</em>'}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading report:', error);
    reportContent.innerHTML = '<div class="alert alert-error">Gagal memuat data laporan</div>';
  }
};

window.closeModal = () => document.getElementById('reportModal')?.close();

window.exportToExcel = async function() {
  try {
    const [stokSnap, sisaSnap, omprengSnap] = await Promise.all([get(stokRef), get(sisaPengRef), get(omprengRef)]);
    const stokData = stokSnap.val() || {};
    const todayISO = getTodayISO();
    const todaySisa = Object.values(sisaSnap.val() || {}).find(d => d.tanggalISO === todayISO) || {};
    const todayOmpreng = Object.values(omprengSnap.val() || {}).find(d => d.tanggalISO === todayISO) || {};

    const csvRows = [
      ['=== LAPORAN ASLAP ==='],
      [`Tanggal: ${new Date().toLocaleDateString('id-ID')}`], [],
      ['=== STOK OPERASIONAL ==='],
      ['Item', 'Stok', 'Unit'],
      ['LPG 50kg', stokData['GAS_LPG_50KG']?.stok || 0, 'Unit'],
      ['LPG 12kg', stokData['GAS_LPG_12KG']?.stok || 0, 'Unit'],
      ['Galon Air', stokData['GALON_AIR']?.stok || 0, 'Unit'],
      ['Listrik', stokData['LISTRIK']?.stok || 0, 'kWh'], [],
      ['=== SISA PENGOLAHAN ==='],
      ['Kategori', 'Jumlah (kg)'],
      ['Makanan Pokok', todaySisa.pokok || 0],
      ['Sayur', todaySisa.sayur || 0],
      ['Lauk Pauk', todaySisa.laukpauk || 0],
      ['Lauk Nabati', todaySisa.lauknabati || 0],
      ['Buah/Susu', todaySisa.buah || 0], [],
      ['=== SAMPAH OMPRENG ==='],
      ['Kategori', 'Jumlah (kg)'],
      ['Makanan Pokok', todayOmpreng.pokok || 0],
      ['Sayur', todayOmpreng.sayur || 0],
      ['Lauk Pauk', todayOmpreng.laukpauk || 0],
      ['Lauk Nabati', todayOmpreng.lauknabati || 0],
      ['Buah/Susu', todayOmpreng.buah || 0]
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_aslap_${todayISO}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('✅ Data berhasil diexport ke CSV', 2000, 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Gagal mengexport data', 3000, 'error');
  }
};

// ============================================================
// SECTION 19: HELPER & TREND CHART
// ============================================================
async function initTrendChart() {
  const snapshot = await get(stokRef);
  const stokData = snapshot.val() || {};

  const currentStok = {
    lpg50: stokData['GAS_LPG_50KG']?.stok || 0,
    galon: stokData['GALON_AIR']?.stok || 0,
    listrik: stokData['LISTRIK']?.stok || 0
  };

  const labels = [];
  for (let i = currentChartDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
  }

  const datasets = [
    {
      label: 'LPG 50kg',
      data: labels.map((_, idx) => Math.max(0, currentStok.lpg50 - (currentChartDays - 1 - idx) * DAILY_USAGE.GAS_LPG_50KG)),
      borderColor: '#1e3a5f',
      backgroundColor: 'rgba(30, 58, 95, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Galon Air',
      data: labels.map((_, idx) => Math.max(0, currentStok.galon - (currentChartDays - 1 - idx) * DAILY_USAGE.GALON_AIR)),
      borderColor: '#2c5282',
      backgroundColor: 'rgba(44, 82, 130, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Listrik (kWh)',
      data: labels.map((_, idx) => Math.max(0, currentStok.listrik - (currentChartDays - 1 - idx) * DAILY_USAGE.LISTRIK)),
      borderColor: '#3182ce',
      backgroundColor: 'rgba(49, 130, 206, 0.1)',
      tension: 0.4,
      fill: true
    }
  ];

  const ctx = document.getElementById('trendChart');
  if (ctx) {
    if (chartTrend) chartTrend.destroy();
    chartTrend = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 9 } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} unit` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 9 } }, title: { display: true, text: 'Jumlah', font: { size: 9 } } },
          x: { ticks: { font: { size: 9, rotation: 45, maxRotation: 45 } } }
        }
      }
    });
  }
}

window.changeChartDays = function() {
  const select = document.getElementById('chartFilterDays');
  const customDiv = document.getElementById('customDateRange');
  const value = select.value;

  if (value === 'custom') {
    customDiv.classList.remove('hidden');
  } else {
    customDiv.classList.add('hidden');
    currentChartDays = parseInt(value);
    initTrendChart();
  }
};

window.applyCustomDate = function() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    showToast('Pilih kedua tanggal!', 2000, 'error');
    return;
  }

  chartStartDate = new Date(startDate);
  chartEndDate = new Date(endDate);

  const diffTime = Math.abs(chartEndDate - chartStartDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  currentChartDays = diffDays;
  initTrendChart();
};
// ============================================================
// RIWAYAT PERUBAHAN (Menggunakan activity_logs dari semua halaman)
// ============================================================
function loadHistoryFromFirebase() {
  const logsRef = ref(db, 'activity_logs');

  onValue(logsRef, (snapshot) => {
    const data = snapshot.val() || {};
    
    // Hanya ambil yang module = "stok"
    changeHistory = Object.values(data)
      .filter(log => log.module === "stok")
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    renderHistoryTimeline();
  });
}

function renderHistoryTimeline() {
  const container = document.getElementById('historyTimeline');
  if (!container) return;

  let filtered = changeHistory;
  if (currentFilterDate) {
    filtered = changeHistory.filter(item => item.timestamp.startsWith(currentFilterDate));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i class="fas fa-history text-4xl mb-3 opacity-30"></i>
        <p class="text-sm">Belum ada riwayat perubahan stok</p>
      </div>`;
    return;
  }

  let html = `<div class="space-y-4">`;

  filtered.forEach(item => {
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    html += `
      <div class="flex gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div class="text-right w-20 text-xs text-slate-500 flex-shrink-0">
          ${dateStr}<br>
          <span class="font-medium">${timeStr}</span>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="badge badge-sm ${item.action === 'create' ? 'badge-success' : 'badge-info'}">
              ${item.action.toUpperCase()}
            </span>
            <span class="font-medium text-slate-700">${escapeHtml(item.description)}</span>
          </div>
          <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <i class="fas fa-user"></i>
            Oleh: <strong>${item.user?.name || 'Unknown'}</strong>
          </div>
        </div>
      </div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// Filter functions
window.filterHistoryByDate = function() {
  const input = document.getElementById('historyDateFilter').value;
  currentFilterDate = input ? input : null;
  renderHistoryTimeline();
};

window.showAllHistory = function() {
  currentFilterDate = null;
  document.getElementById('historyDateFilter').value = '';
  renderHistoryTimeline();
};

window.clearHistory = async function() {
  if (confirm('⚠️ Hapus SEMUA riwayat perubahan?\nTindakan ini tidak dapat dibatalkan!')) {
    await set(ref(db, 'activity_logs'), null);
    showToast('Riwayat berhasil dihapus', 2000, 'success');
  }
};

// ============================================================
// JALANKAN SAAT HALAMAN DIMUAT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initializePage().then(() => {
    initDashboard();
  });
});