import { ref, onValue, get, set, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, stokRef, sisaPengRef, omprengRef } from "./firebase-init.js";
import { googleDocsLinks } from "./config.js";
import { showToast, getTodayISO } from "./utils.js";

// Export googleDocsLinks ke window
window.googleDocsLinks = googleDocsLinks;

let chartSisa = null;
let chartOmpreng = null;
let chartTrend = null;
let stokHistory = [];
let historyIndex = -1;
let lowStockAlertShown = false;
let currentMetric = 'sisa'; // 'sisa' or 'ompreng'

// Threshold stok minimum
const STOCK_THRESHOLDS = {
  'GAS_LPG_50KG': 2,
  'GAS_LPG_12KG': 2,
  'GALON_AIR': 15,
  'LISTRIK': 80
};

export function loadDashboard() {
  const savedNotes = localStorage.getItem('dashboard_notes') || '';
  
  return `
    <style>
      .dashboard-two-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 32px;
      }
      
      .notes-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      
      .notes-header h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
      }
      
      .notes-header h3 i {
        color: var(--primary);
      }
      
      .notes-actions {
        display: flex;
        gap: 8px;
      }
      
      .notes-actions button {
        padding: 6px 12px;
        font-size: 12px;
        width: auto;
        background: var(--gray-100);
        color: var(--gray-700);
        border: none;
        border-radius: 20px;
        cursor: pointer;
      }
      
      .notes-actions button:hover {
        background: var(--gray-200);
        transform: none;
        box-shadow: none;
      }
      
      .notes-search {
        margin-bottom: 12px;
      }
      
      .notes-search input {
        width: 100%;
        padding: 8px 12px;
        border: 1.5px solid var(--gray-200);
        border-radius: 10px;
        font-size: 13px;
        transition: var(--transition);
      }
      
      .notes-search input:focus {
        outline: none;
        border-color: var(--primary);
      }
      
      .notes-textarea {
        width: 100%;
        min-height: 280px;
        padding: 12px;
        border: 1.5px solid var(--gray-200);
        border-radius: 12px;
        font-size: 14px;
        font-family: inherit;
        resize: vertical;
        transition: var(--transition);
      }
      
      .notes-textarea:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
      }
      
      .char-count {
        font-size: 11px;
        color: var(--gray-400);
        margin-top: 8px;
        text-align: right;
      }
      
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 24px;
      }
      
      .kpi-card {
        background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
        border-radius: 20px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        color: white;
        box-shadow: var(--card-shadow);
        transition: transform 0.2s;
        cursor: pointer;
      }
      
      .kpi-card:hover {
        transform: translateY(-2px);
      }
      
      .kpi-card:last-child {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      }
      
      .kpi-icon {
        font-size: 32px;
      }
      
      .kpi-info {
        display: flex;
        flex-direction: column;
      }
      
      .kpi-value {
        font-size: 28px;
        font-weight: bold;
      }
      
      .kpi-label {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .quick-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        padding: 16px;
        border-radius: 20px;
        border: 1px solid #bbf7d0;
      }
      
      .quick-btn {
        background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
        padding: 10px 20px;
        border-radius: 40px;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.3s;
        cursor: pointer;
        border: none;
        color: white;
        box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
      }
      
      .quick-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
      }
      
      .quick-btn:nth-child(3) {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
      }
      
      .quick-btn:nth-child(4) {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
      
      .quick-btn:nth-child(5) {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
      }
      
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
      
      .dash-card {
        background: white;
        border-radius: 20px;
        padding: 20px;
        box-shadow: var(--card-shadow);
        border: 1px solid rgba(0,0,0,0.05);
        text-align: center;
      }
      
      /* Stok Operasional List di Dashboard */
      .stok-operasional-list {
        background: white;
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: var(--card-shadow);
        border: 1px solid rgba(0,0,0,0.05);
      }
      
      .stok-operasional-list h3 {
        font-size: 16px;
        margin-bottom: 16px;
        color: var(--gray-700);
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--gray-100);
      }
      
      .stok-operasional-list h3 i {
        color: var(--primary);
      }
      
      .stok-operasional-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
        max-height: 400px;
        overflow-y: auto;
        padding-right: 8px;
      }
      
      .stok-operasional-grid::-webkit-scrollbar {
        width: 6px;
      }
      
      .stok-operasional-grid::-webkit-scrollbar-track {
        background: var(--gray-100);
        border-radius: 10px;
      }
      
      .stok-operasional-grid::-webkit-scrollbar-thumb {
        background: var(--gray-400);
        border-radius: 10px;
      }
      
      .stok-item {
        background: var(--gray-50);
        border-radius: 12px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s;
        border: 1px solid var(--gray-100);
        cursor: pointer;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .stok-item:hover {
        background: white;
        border-color: var(--primary-light);
        transform: translateX(4px);
      }
      
      .stok-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .stok-nama {
        font-weight: 600;
        font-size: 14px;
        color: var(--gray-700);
      }
      
      .stok-kategori {
        font-size: 11px;
        color: var(--gray-400);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .stok-value {
        font-weight: 700;
        font-size: 16px;
      }
      
      .stok-value.low {
        color: #dc2626;
        background: #fee2e2;
        padding: 4px 12px;
        border-radius: 20px;
      }
      
      .stok-value.normal {
        color: var(--primary);
        background: #dcfce7;
        padding: 4px 12px;
        border-radius: 20px;
      }
      
      .stok-unit {
        font-size: 10px;
        font-weight: normal;
        margin-left: 4px;
      }
      
      .refresh-stok-btn {
        margin-left: auto;
        background: var(--gray-100);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .refresh-stok-btn:hover {
        background: var(--primary);
        color: white;
      }
      
      .lihat-semua-btn {
        margin-top: 16px;
        text-align: center;
        padding-top: 12px;
        border-top: 1px solid var(--gray-100);
      }
      
      .lihat-semua-btn button {
        background: none;
        color: var(--primary);
        padding: 8px;
        width: auto;
        font-size: 13px;
        box-shadow: none;
        border: none;
        cursor: pointer;
      }
      
      .lihat-semua-btn button:hover {
        background: var(--gray-100);
        transform: none;
      }
      
      .low-stock-list {
        background: white;
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: var(--card-shadow);
        border: 1px solid rgba(0,0,0,0.05);
        display: none;
      }
      
      .low-stock-list h3 {
        font-size: 14px;
        margin-bottom: 16px;
        color: #f59e0b;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .low-stock-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .low-stock-item {
        background: #fef3c7;
        border-radius: 12px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-left: 4px solid #f59e0b;
      }
      
      .low-stock-name {
        font-weight: 600;
        color: #92400e;
      }
      
      .low-stock-value {
        font-weight: bold;
        color: #dc2626;
      }
      
      .chart-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 32px;
      }
      
      .chart-card {
        background: white;
        border-radius: 20px;
        padding: 20px;
        box-shadow: var(--card-shadow);
        border: 1px solid rgba(0,0,0,0.05);
      }
      
      .chart-card h3 {
        font-size: 14px;
        margin-bottom: 16px;
        color: var(--gray-600);
      }
      
      .chart-card canvas {
        max-height: 250px;
        width: 100%;
      }
      
      .timestamp {
        text-align: right;
        font-size: 11px;
        color: var(--gray-400);
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--gray-100);
      }
      
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .modal.active {
        display: flex;
      }
      
      .modal-content {
        background: white;
        border-radius: 20px;
        padding: 24px;
        max-width: 700px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--gray-100);
      }
      
      .modal-close {
        cursor: pointer;
        font-size: 24px;
        color: var(--gray-400);
      }
      
      .report-item {
        padding: 12px;
        border-bottom: 1px solid var(--gray-100);
      }
      
      .report-subsection {
        margin-top: 16px;
        margin-bottom: 16px;
      }
      
      .report-subsection h4 {
        margin-bottom: 12px;
        color: var(--primary);
      }
      
      .stock-detail-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--gray-100);
      }
      
      .stock-detail-item:last-child {
        border-bottom: none;
      }
      
      .stock-detail-name {
        font-weight: 500;
      }
      
      .stock-detail-value {
        font-weight: bold;
        color: var(--primary);
      }
      
      @media (max-width: 1024px) {
        .dashboard-two-columns {
          grid-template-columns: 1fr;
        }
        
        .chart-container {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 768px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
        
        .kpi-grid {
          grid-template-columns: 1fr;
        }
        
        .stok-operasional-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
    
    <h1 class="text-4xl font-bold text-green-700 mb-2">Dashboard ASLAP</h1>
    <p class="text-gray-600 mb-8">${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" onclick="window.showTotalStockDetail()">
        <div class="kpi-icon">📦</div>
        <div class="kpi-info">
          <span class="kpi-value" id="totalStok">0</span>
          <span class="kpi-label">Total Stok</span>
        </div>
      </div>
      <div class="kpi-card" id="lowStockTrigger" onclick="window.toggleLowStockList()">
        <div class="kpi-icon">⚠️</div>
        <div class="kpi-info">
          <span class="kpi-value" id="stokMenipis">0</span>
          <span class="kpi-label">Stok Menipis <i class="fas fa-chevron-down" style="font-size: 10px;"></i></span>
        </div>
      </div>
      <div class="kpi-card" onclick="window.toggleMetric()">
        <div class="kpi-icon" id="metricIcon">📊</div>
        <div class="kpi-info">
          <span class="kpi-value" id="rataMetric">0</span>
          <span class="kpi-label" id="metricLabel">Rata-rata Sisa (kg)</span>
        </div>
      </div>
    </div>
    
    <!-- Low Stock List (Hidden by default) -->
    <div class="low-stock-list" id="lowStockContainer">
      <h3><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Stok Operasional Menipis</h3>
      <div class="low-stock-items" id="lowStockItems"></div>
    </div>
    
    <!-- Two Columns: Left (Stok Cards + Quick Actions) dan Right (Notes) -->
    <div class="dashboard-two-columns">
      <!-- Left Column -->
      <div>
        <!-- Quick Actions (dalam card terpisah, tidak full width) -->
        <div class="quick-actions-wrapper">
          <div class="quick-actions">
            <button class="quick-btn" onclick="window.quickAddStock('GAS_LPG_50KG', 5)">
              <i class="fas fa-plus-circle"></i> +5 LPG 50kg
            </button>
            <button class="quick-btn" onclick="window.quickAddStock('GALON_AIR', 10)">
              <i class="fas fa-plus-circle"></i> +10 Galon
            </button>
            <button class="quick-btn" onclick="window.showDailyReport()">
              <i class="fas fa-chart-line"></i> Laporan Harian
            </button>
            <button class="quick-btn" onclick="window.exportToExcel()">
              <i class="fas fa-file-excel"></i> Export Excel
            </button>
            <button class="quick-btn" onclick="window.undoLastStock()">
              <i class="fas fa-undo-alt"></i> Undo
            </button>
          </div>
        </div>
        
        <!-- Stok Cards Grid -->
        <div class="dashboard-grid">
          <div class="dash-card">
            <h3>GAS LPG 50KG</h3>
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0;">
              <button onclick="window.editStok('GAS_LPG_50KG', -1)" style="background: #ef4444; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; color: white;">-</button>
              <p id="lpg50" class="dash-value normal" style="margin: 0; min-width: 60px; font-size: 24px; font-weight: bold;">0</p>
              <button onclick="window.editStok('GAS_LPG_50KG', 1)" style="background: #22c55e; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; color: white;">+</button>
            </div>
            <small>Unit</small>
          </div>
          <div class="dash-card">
            <h3>GAS LPG 12KG</h3>
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0;">
              <button onclick="window.editStok('GAS_LPG_12KG', -1)" style="background: #ef4444; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; color: white;">-</button>
              <p id="lpg12" class="dash-value normal" style="margin: 0; min-width: 60px; font-size: 24px; font-weight: bold;">0</p>
              <button onclick="window.editStok('GAS_LPG_12KG', 1)" style="background: #22c55e; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; color: white;">+</button>
            </div>
            <small>Unit</small>
          </div>
          <div class="dash-card">
            <h3>GALON AIR</h3>
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0;">
              <button onclick="window.editStok('GALON_AIR', -1)" style="background: #ef4444; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; color: white;">-</button>
              <p id="galon" class="dash-value normal" style="margin: 0; min-width: 60px; font-size: 24px; font-weight: bold;">0</p>
              <button onclick="window.editStok('GALON_AIR', 1)" style="background: #22c55e; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; color: white;">+</button>
            </div>
            <small>Unit</small>
          </div>
          <div class="dash-card">
            <h3>LISTRIK</h3>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 10px 0; flex-wrap: wrap;">
              <input type="number" id="inputListrik" placeholder="Jumlah (kWh)" style="width: 100px; text-align: center; padding: 8px; border: 1.5px solid var(--gray-200); border-radius: 8px;">
              <button onclick="window.editListrik()" style="background: #3b82f6; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; color: white;">Update</button>
            </div>
            <p id="listrik" class="dash-value normal" style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">0</p>
            <small>kWh/Token</small>
          </div>
        </div>
      </div>
      
      <!-- Right Column: Notes Card -->
      <div class="dash-card" style="display: flex; flex-direction: column;">
        <div class="notes-header">
          <h3>
            <i class="fas fa-sticky-note"></i>
            Catatan & To-Do List
          </h3>
          <div class="notes-actions">
            <button onclick="window.clearNotes()">
              <i class="fas fa-trash-alt"></i> Hapus
            </button>
          </div>
        </div>
        <div class="notes-search">
          <input type="text" id="notesSearch" placeholder="🔍 Cari catatan..." />
        </div>
        <textarea 
          id="dashboardNotes" 
          class="notes-textarea" 
          placeholder="Tulis catatan atau to-do list di sini...&#10;&#10;Contoh:&#10;✓ Beli bahan baku&#10;✓ Cek stok LPG&#10;✓ Rapat tim jam 14:00"
        >${savedNotes}</textarea>
        <div class="char-count">
          <span id="charCount">${savedNotes.length}</span> karakter
        </div>
      </div>
    </div>
    
    <!-- Stok Operasional List -->
    <div class="stok-operasional-list">
      <h3>
        <i class="fas fa-boxes"></i>
        Stok Operasional Terbaru
        <span class="refresh-stok-btn" onclick="window.refreshRandomStok()">
          <i class="fas fa-random"></i> Random
        </span>
        <span style="font-size: 11px; background: var(--gray-100); padding: 2px 8px; border-radius: 20px;" id="totalItemStok">0 item</span>
      </h3>
      <div class="stok-operasional-grid" id="stokOperasionalGrid">
        <div style="text-align: center; padding: 20px; color: var(--gray-400);">
          <i class="fas fa-spinner fa-pulse"></i> Memuat data...
        </div>
      </div>
      <div class="lihat-semua-btn">
        <button onclick="window.goToStokPage()">
          <i class="fas fa-arrow-right"></i> Lihat Semua Stok Operasional
        </button>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="chart-container">
      <div class="chart-card">
        <h3><i class="fas fa-chart-line"></i> Trend Stok 7 Hari</h3>
        <canvas id="trendChart"></canvas>
      </div>
      <div class="chart-card">
        <h3><i class="fas fa-chart-bar"></i> Sisa Pengolahan (kg)</h3>
        <canvas id="chartSisa"></canvas>
      </div>
      <div class="chart-card">
        <h3><i class="fas fa-chart-bar"></i> Sampah Ompreng (kg)</h3>
        <canvas id="chartOmpreng"></canvas>
      </div>
    </div>
    
    <div class="timestamp" id="lastUpdate">
      Terakhir update: --
    </div>
    
    <!-- Modal untuk Laporan Harian -->
    <div id="reportModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Laporan Harian</h2>
          <span class="modal-close" onclick="window.closeModal()">&times;</span>
        </div>
        <div id="reportContent"></div>
      </div>
    </div>
    
    <!-- Modal untuk Edit Stok -->
    <div id="editStockModal" class="modal">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 id="editStockTitle">Edit Stok</h3>
          <span class="modal-close" onclick="window.closeEditStockModal()">&times;</span>
        </div>
        <div id="editStockContent"></div>
      </div>
    </div>
  `;
}

export function initDashboard() {
  updateDashboard();
  initNotes();
  initNotesSearch();
  checkBrowserNotification();
  loadStokOperasionalList();
}

export function updateDashboard() {
  updateTimestamp();

  onValue(stokRef, (snap) => {
    const d = snap.val() || {};
    const lpg50 = document.getElementById('lpg50');
    const lpg12 = document.getElementById('lpg12');
    const galon = document.getElementById('galon');
    const listrik = document.getElementById('listrik');
    
    const stokValues = {
      'GAS_LPG_50KG': d['GAS_LPG_50KG']?.stok || 0,
      'GAS_LPG_12KG': d['GAS_LPG_12KG']?.stok || 0,
      'GALON_AIR': d['GALON_AIR']?.stok || 0,
      'LISTRIK': d['LISTRIK']?.stok || 0
    };
    
    if (lpg50) lpg50.textContent = stokValues['GAS_LPG_50KG'];
    if (lpg12) lpg12.textContent = stokValues['GAS_LPG_12KG'];
    if (galon) galon.textContent = stokValues['GALON_AIR'];
    if (listrik) listrik.textContent = stokValues['LISTRIK'];
    
    updateKPI(stokValues);
    updateLowStockList(stokValues);
    checkLowStock(stokValues);
    saveToHistory(stokValues);
  });

  onValue(sisaPengRef, (snap) => {
    const data = snap.val() || {};
    const sortedData = Object.values(data).sort((a, b) => new Date(a.tanggalISO) - new Date(b.tanggalISO));
    const dates = sortedData.slice(-7).map(item => item.tanggalDisplay);
    const datasets = ["pokok","sayur","laukpauk","lauknabati","buah"].map((key, i) => ({
      label: ["Makanan Pokok","Sayur","Lauk Pauk","Lauk Nabati","Buah/Susu"][i],
      data: sortedData.slice(-7).map(item => item[key] || 0),
      backgroundColor: ['#16a34a','#eab308','#ef4444','#8b5cf6','#ec4899'][i],
      borderRadius: 4,
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
          aspectRatio: 1.8,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: { font: { size: 10 }, boxWidth: 10 }
            },
            tooltip: { bodyFont: { size: 11 } }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              title: { display: true, text: 'kg', font: { size: 10 } }
            },
            x: { 
              ticks: { font: { size: 10, rotation: 45, maxRotation: 45 } }
            }
          }
        }
      });
      
      updateRataMetric(data, null);
    }
  });

  onValue(omprengRef, (snap) => {
    const data = snap.val() || {};
    const sortedData = Object.values(data).sort((a, b) => new Date(a.tanggalISO) - new Date(b.tanggalISO));
    const dates = sortedData.slice(-7).map(item => item.tanggalDisplay);
    const datasets = ["pokok","sayur","laukpauk","lauknabati","buah"].map((key, i) => ({
      label: ["Makanan Pokok","Sayur","Lauk Pauk","Lauk Nabati","Buah/Susu"][i],
      data: sortedData.slice(-7).map(item => item[key] || 0),
      backgroundColor: ['#f97316','#f59e0b','#dc2626','#7c3aed','#db2777'][i],
      borderRadius: 4,
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
          aspectRatio: 1.8,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: { font: { size: 10 }, boxWidth: 10 }
            },
            tooltip: { bodyFont: { size: 11 } }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              ticks: { font: { size: 10 } },
              title: { display: true, text: 'kg', font: { size: 10 } }
            },
            x: { 
              ticks: { font: { size: 10, rotation: 45, maxRotation: 45 } }
            }
          }
        }
      });
      
      updateRataMetric(null, data);
    }
  });
  
  initTrendChart();
}

// ==================== TOTAL STOK DETAIL ====================
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
      <div class="report-item" style="background: linear-gradient(135deg, var(--primary) 0%, #059669 100%); color: white; border-radius: 12px; margin-bottom: 16px;">
        <strong>📊 TOTAL STOK KESELURUHAN: ${grandTotal}</strong>
      </div>
      <div class="report-subsection">
        <h4><i class="fas fa-boxes"></i> Rincian per Item</h4>
        ${allStoks.map(item => `
          <div class="stock-detail-item">
            <span class="stock-detail-name">${escapeHtml(item.nama)}</span>
            <span class="stock-detail-value">${item.stok}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    modal.classList.add('active');
  } catch (error) {
    console.error('Error:', error);
    showToast('Gagal memuat detail stok');
  }
};

// ==================== TOGGLE LOW STOCK LIST ====================
window.toggleLowStockList = function() {
  const container = document.getElementById('lowStockContainer');
  const chevron = document.querySelector('#lowStockTrigger .fa-chevron-down');
  
  if (container) {
    if (container.style.display === 'none' || container.style.display === '') {
      container.style.display = 'block';
      if (chevron) chevron.className = 'fas fa-chevron-up';
    } else {
      container.style.display = 'none';
      if (chevron) chevron.className = 'fas fa-chevron-down';
    }
  }
};

// ==================== TOGGLE METRIC (SISA / OMPRENG) ====================
window.toggleMetric = function() {
  currentMetric = currentMetric === 'sisa' ? 'ompreng' : 'sisa';
  const metricLabel = document.getElementById('metricLabel');
  const metricIcon = document.getElementById('metricIcon');
  
  if (currentMetric === 'sisa') {
    metricLabel.innerHTML = 'Rata-rata Sisa (kg)';
    metricIcon.innerHTML = '📊';
  } else {
    metricLabel.innerHTML = 'Rata-rata Ompreng (kg)';
    metricIcon.innerHTML = '🗑️';
  }
  
  get(sisaPengRef).then(snap => updateRataMetric(snap.val(), null));
  get(omprengRef).then(snap => updateRataMetric(null, snap.val()));
};

function updateRataMetric(sisaData, omprengData) {
  const rataMetricEl = document.getElementById('rataMetric');
  if (!rataMetricEl) return;
  
  if (currentMetric === 'sisa' && sisaData) {
    const allValues = Object.values(sisaData);
    if (allValues.length > 0) {
      const total = allValues.reduce((sum, item) => {
        return sum + (item.pokok || 0) + (item.sayur || 0) + (item.laukpauk || 0) + 
               (item.lauknabati || 0) + (item.buah || 0);
      }, 0);
      const avg = (total / allValues.length).toFixed(1);
      rataMetricEl.textContent = avg;
    } else {
      rataMetricEl.textContent = '0';
    }
  } else if (currentMetric === 'ompreng' && omprengData) {
    const allValues = Object.values(omprengData);
    if (allValues.length > 0) {
      const total = allValues.reduce((sum, item) => {
        return sum + (item.pokok || 0) + (item.sayur || 0) + (item.laukpauk || 0) + 
               (item.lauknabati || 0) + (item.buah || 0);
      }, 0);
      const avg = (total / allValues.length).toFixed(1);
      rataMetricEl.textContent = avg;
    } else {
      rataMetricEl.textContent = '0';
    }
  }
}

// ==================== STOK OPERASIONAL LIST (RANDOM) ====================
let currentRandomStoks = [];

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
    
    const totalItem = stokArray.length;
    const totalItemEl = document.getElementById('totalItemStok');
    if (totalItemEl) totalItemEl.textContent = `${totalItem} item`;
    
    currentRandomStoks = stokArray;
    displayRandomStok();
  });
}

function displayRandomStok() {
  const gridContainer = document.getElementById('stokOperasionalGrid');
  if (!gridContainer) return;
  
  if (currentRandomStoks.length === 0) {
    gridContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--gray-400);">
        <i class="fas fa-box-open"></i>
        <p>Belum ada data stok operasional</p>
        <small>Tambahkan stok di halaman Stok Operasional</small>
      </div>
    `;
    return;
  }
  
  const shuffled = [...currentRandomStoks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  const displayItems = shuffled.slice(0, 8);
  
  gridContainer.innerHTML = displayItems.map(item => {
    const isLowStock = item.stok < 5;
    const stockClass = isLowStock ? 'low' : 'normal';
    const unit = getUnitForItem(item.nama);
    
    return `
      <div class="stok-item" onclick="window.editStockDirectFromDashboard('${item.nama.replace(/'/g, "\\'")}', ${item.stok})">
        <div class="stok-info">
          <span class="stok-nama">${escapeHtml(item.nama)}</span>
          <span class="stok-kategori">
            <i class="fas ${getCategoryIconForDashboard(item.kategori)}" style="font-size: 10px;"></i>
            ${item.kategori}
          </span>
        </div>
        <div class="stok-value ${stockClass}">
          ${item.stok} <span class="stok-unit">${unit}</span>
        </div>
      </div>
    `;
  }).join('');
}

window.refreshRandomStok = function() {
  displayRandomStok();
  showToast('Stok operasional diacak!');
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getUnitForItem(nama) {
  const lowerNama = nama.toLowerCase();
  if (lowerNama.includes('liter') || lowerNama.includes('kilo') || lowerNama.includes('kg')) return '';
  if (lowerNama.includes('lembar') || lowerNama.includes('roll')) return '';
  if (lowerNama.includes('botol')) return '';
  return 'pcs';
}

function getCategoryIconForDashboard(kategori) {
  const icons = {
    "Pembersih & Deterjen": "fa-soap",
    "Perlengkapan Kebersihan": "fa-broom",
    "Plastik & Kresek": "fa-shopping-bag",
    "Alat Pelindung & Masker": "fa-head-side-mask",
    "Kebutuhan Umum": "fa-box",
    "Utility & Gas": "fa-gas-pump",
    "Barang Lainnya": "fa-archive"
  };
  return icons[kategori] || "fa-boxes";
}

window.editStockDirectFromDashboard = function(nama, currentStock) {
  const modal = document.getElementById('editStockModal');
  const editTitle = document.getElementById('editStockTitle');
  const editContent = document.getElementById('editStockContent');
  
  if (!modal || !editContent) return;
  
  editTitle.innerHTML = `<i class="fas fa-edit" style="color: var(--primary);"></i> Edit Stok: ${escapeHtml(nama)}`;
  editContent.innerHTML = `
    <input type="number" id="editStockValueDashboard" step="0.01" value="${currentStock}" placeholder="Jumlah stok baru" style="width: 100%; margin-bottom: 20px; padding: 10px; border: 1.5px solid var(--gray-200); border-radius: 10px;">
    <div style="display: flex; gap: 12px;">
      <button onclick="window.saveStockEditFromDashboard('${nama.replace(/'/g, "\\'")}')" style="flex: 1; background: var(--primary); color: white; padding: 10px; border-radius: 10px; border: none; cursor: pointer;">Simpan</button>
      <button onclick="window.closeEditStockModal()" style="flex: 1; background: var(--gray-400); color: white; padding: 10px; border-radius: 10px; border: none; cursor: pointer;">Batal</button>
    </div>
  `;
  
  modal.classList.add('active');
  
  setTimeout(() => {
    const input = document.getElementById('editStockValueDashboard');
    if (input) input.focus();
  }, 100);
};

window.saveStockEditFromDashboard = async function(nama) {
  const newStock = parseFloat(document.getElementById('editStockValueDashboard').value);
  
  if (isNaN(newStock) || newStock < 0) {
    alert("Masukkan jumlah yang valid (minimal 0)!");
    return;
  }
  
  const key = nama.replace(/[^a-zA-Z0-9]/g, '_');
  
  try {
    const snapshot = await get(ref(db, 'stok_operasional/' + key));
    let kategori = snapshot.exists() ? snapshot.val().kategori : 'Barang Lainnya';
    
    await set(ref(db, 'stok_operasional/' + key), { 
      nama: nama, 
      stok: newStock,
      kategori: kategori
    });
    
    showToast(`Stok "${nama}" diubah menjadi ${newStock}`);
    closeEditStockModal();
    loadStokOperasionalList();
  } catch (error) {
    console.error("Error update stok:", error);
    alert("Gagal mengupdate stok: " + error.message);
  }
};

window.closeEditStockModal = function() {
  const modal = document.getElementById('editStockModal');
  if (modal) modal.classList.remove('active');
};

window.goToStokPage = function() {
  if (typeof window.loadPage === 'function') {
    window.loadPage('stok');
  } else {
    showToast('Silakan buka halaman Stok Operasional dari menu');
  }
};

// ==================== LOW STOCK LIST ====================
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
        <div class="low-stock-item">
          <span class="low-stock-name">⚠️ ${item.name}</span>
          <span class="low-stock-value">${item.stok} / ${item.threshold}</span>
        </div>
      `).join('');
    } else {
      itemsContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--gray-400);">✅ Semua stok aman</div>';
    }
  }
}

// ==================== KPI FUNCTIONS ====================
function updateKPI(stokValues) {
  const total = Object.values(stokValues).reduce((a, b) => a + b, 0);
  const totalStokEl = document.getElementById('totalStok');
  if (totalStokEl) totalStokEl.textContent = total;
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
    const message = `⚠️ Stok menipis:\n${lowStokItems.join('\n')}`;
    showToast(message, 5000);
    sendBrowserNotification('Peringatan Stok', message);
    lowStockAlertShown = true;
    setTimeout(() => { lowStockAlertShown = false; }, 300000);
  }
}

// ==================== HISTORY / UNDO ====================
function saveToHistory(stokData) {
  stokHistory = stokHistory.slice(0, historyIndex + 1);
  stokHistory.push(JSON.stringify(stokData));
  if (stokHistory.length > 50) stokHistory.shift();
  historyIndex = stokHistory.length - 1;
}

window.undoLastStock = async function() {
  if (historyIndex > 0) {
    historyIndex--;
    const prevState = JSON.parse(stokHistory[historyIndex]);
    
    for (const [key, value] of Object.entries(prevState)) {
      await set(ref(db, `stok_operasional/${key}`), {
        nama: key.replace(/_/g, ' '),
        stok: value
      });
    }
    
    showToast('Berhasil mengembalikan perubahan sebelumnya');
    updateTimestamp();
  } else {
    showToast('Tidak ada riwayat untuk di-undo');
  }
};

// ==================== NOTES / TO-DO LIST ====================
function initNotes() {
  const textarea = document.getElementById('dashboardNotes');
  const charCount = document.getElementById('charCount');
  
  if (textarea) {
    textarea.addEventListener('input', function() {
      const count = this.value.length;
      if (charCount) charCount.textContent = count;
      localStorage.setItem('dashboard_notes', this.value);
    });
  }
}

function initNotesSearch() {
  const searchInput = document.getElementById('notesSearch');
  const textarea = document.getElementById('dashboardNotes');
  
  if (searchInput && textarea) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      const content = textarea.value;
      
      if (keyword && content.toLowerCase().includes(keyword)) {
        textarea.style.backgroundColor = '#fef3c7';
        setTimeout(() => {
          textarea.style.backgroundColor = '';
        }, 1000);
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
      showToast('Catatan berhasil dihapus');
    }
  }
};

// ==================== QUICK ACTIONS ====================
window.quickAddStock = async function(itemKey, amount) {
  await editStok(itemKey, amount);
};

// ==================== TREND CHART ====================
async function initTrendChart() {
  const snapshot = await get(stokRef);
  const stokData = snapshot.val() || {};
  
  const currentStok = {
    lpg50: stokData['GAS_LPG_50KG']?.stok || 0,
    lpg12: stokData['GAS_LPG_12KG']?.stok || 0,
    galon: stokData['GALON_AIR']?.stok || 0,
    listrik: stokData['LISTRIK']?.stok || 0
  };
  
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
  }
  
  const trendData = {
    lpg50: [currentStok.lpg50 - 3, currentStok.lpg50 - 2, currentStok.lpg50 - 1, currentStok.lpg50, currentStok.lpg50, currentStok.lpg50, currentStok.lpg50],
    galon: [currentStok.galon - 8, currentStok.galon - 6, currentStok.galon - 4, currentStok.galon - 2, currentStok.galon, currentStok.galon, currentStok.galon],
    listrik: [currentStok.listrik - 15, currentStok.listrik - 10, currentStok.listrik - 5, currentStok.listrik, currentStok.listrik, currentStok.listrik, currentStok.listrik]
  };
  
  Object.keys(trendData).forEach(key => {
    trendData[key] = trendData[key].map(v => Math.max(0, v));
  });
  
  const datasets = [
    {
      label: 'LPG 50kg',
      data: trendData.lpg50,
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Galon Air',
      data: trendData.galon,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Listrik (kWh)',
      data: trendData.listrik,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
        aspectRatio: 1.8,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 10 } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} unit` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } }, title: { display: true, text: 'Jumlah', font: { size: 10 } } },
          x: { ticks: { font: { size: 10, rotation: 45, maxRotation: 45 } } }
        }
      }
    });
  }
}

// ==================== DAILY REPORT ====================
window.showDailyReport = async function() {
  const modal = document.getElementById('reportModal');
  const reportContent = document.getElementById('reportContent');
  
  if (!modal || !reportContent) return;
  
  reportContent.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-pulse"></i> Memuat data...</div>';
  modal.classList.add('active');
  
  try {
    const stokSnap = await get(stokRef);
    const stokData = stokSnap.val() || {};
    
    const todayISO = getTodayISO();
    const todayDisplay = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const sisaSnap = await get(sisaPengRef);
    const sisaData = sisaSnap.val() || {};
    const todaySisa = Object.values(sisaData).find(d => d.tanggalISO === todayISO) || {};
    
    const omprengSnap = await get(omprengRef);
    const omprengData = omprengSnap.val() || {};
    const todayOmpreng = Object.values(omprengData).find(d => d.tanggalISO === todayISO) || {};
    
    const html = `
      <div class="report-item">
        <strong>📅 Tanggal Laporan:</strong> ${todayDisplay}
      </div>
      
      <div class="report-subsection">
        <h4><i class="fas fa-boxes"></i> Stok Operasional Saat Ini</h4>
        <div class="report-item">
          • LPG 50kg: <strong>${stokData['GAS_LPG_50KG']?.stok || 0} unit</strong><br/>
          • LPG 12kg: <strong>${stokData['GAS_LPG_12KG']?.stok || 0} unit</strong><br/>
          • Galon Air: <strong>${stokData['GALON_AIR']?.stok || 0} unit</strong><br/>
          • Listrik: <strong>${stokData['LISTRIK']?.stok || 0} kWh</strong>
        </div>
      </div>
      
      <div class="report-subsection">
        <h4><i class="fas fa-recycle"></i> Sisa Pengolahan (${todayDisplay})</h4>
        <div class="report-item">
          • Makanan Pokok: <strong>${todaySisa.pokok || 0} kg</strong><br/>
          • Sayur: <strong>${todaySisa.sayur || 0} kg</strong><br/>
          • Lauk Pauk: <strong>${todaySisa.laukpauk || 0} kg</strong><br/>
          • Lauk Nabati: <strong>${todaySisa.lauknabati || 0} kg</strong><br/>
          • Buah/Susu: <strong>${todaySisa.buah || 0} kg</strong><br/>
          <hr style="margin: 8px 0;">
          <strong>Total: ${(todaySisa.pokok || 0) + (todaySisa.sayur || 0) + (todaySisa.laukpauk || 0) + (todaySisa.lauknabati || 0) + (todaySisa.buah || 0)} kg</strong>
        </div>
      </div>
      
      <div class="report-subsection">
        <h4><i class="fas fa-trash-alt"></i> Sampah Ompreng (${todayDisplay})</h4>
        <div class="report-item">
          • Makanan Pokok: <strong>${todayOmpreng.pokok || 0} kg</strong><br/>
          • Sayur: <strong>${todayOmpreng.sayur || 0} kg</strong><br/>
          • Lauk Pauk: <strong>${todayOmpreng.laukpauk || 0} kg</strong><br/>
          • Lauk Nabati: <strong>${todayOmpreng.lauknabati || 0} kg</strong><br/>
          • Buah/Susu: <strong>${todayOmpreng.buah || 0} kg</strong><br/>
          <hr style="margin: 8px 0;">
          <strong>Total: ${(todayOmpreng.pokok || 0) + (todayOmpreng.sayur || 0) + (todayOmpreng.laukpauk || 0) + (todayOmpreng.lauknabati || 0) + (todayOmpreng.buah || 0)} kg</strong>
        </div>
      </div>
      
      <div class="report-subsection">
        <h4><i class="fas fa-sticky-note"></i> Catatan</h4>
        <div class="report-item">
          ${document.getElementById('dashboardNotes')?.value || '<em>Tidak ada catatan</em>'}
        </div>
      </div>
    `;
    
    reportContent.innerHTML = html;
  } catch (error) {
    console.error('Error loading report:', error);
    reportContent.innerHTML = '<div class="report-item" style="color:red;">Gagal memuat data laporan</div>';
  }
};

window.closeModal = function() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.remove('active');
};

// ==================== EXPORT FUNCTIONS ====================
window.exportToExcel = async function() {
  try {
    const stokSnap = await get(stokRef);
    const stokData = stokSnap.val() || {};
    
    const sisaSnap = await get(sisaPengRef);
    const sisaData = sisaSnap.val() || {};
    const todayISO = getTodayISO();
    const todaySisa = Object.values(sisaData).find(d => d.tanggalISO === todayISO) || {};
    
    const omprengSnap = await get(omprengRef);
    const omprengData = omprengSnap.val() || {};
    const todayOmpreng = Object.values(omprengData).find(d => d.tanggalISO === todayISO) || {};
    
    const csvData = [
      ['=== STOK OPERASIONAL ==='],
      ['Item', 'Stok', 'Unit'],
      ['LPG 50kg', stokData['GAS_LPG_50KG']?.stok || 0, 'Unit'],
      ['LPG 12kg', stokData['GAS_LPG_12KG']?.stok || 0, 'Unit'],
      ['Galon Air', stokData['GALON_AIR']?.stok || 0, 'Unit'],
      ['Listrik', stokData['LISTRIK']?.stok || 0, 'kWh'],
      [],
      ['=== SISA PENGOLAHAN (Hari Ini) ==='],
      ['Kategori', 'Jumlah (kg)'],
      ['Makanan Pokok', todaySisa.pokok || 0],
      ['Sayur', todaySisa.sayur || 0],
      ['Lauk Pauk', todaySisa.laukpauk || 0],
      ['Lauk Nabati', todaySisa.lauknabati || 0],
      ['Buah/Susu', todaySisa.buah || 0],
      [],
      ['=== SAMPAH OMPRENG (Hari Ini) ==='],
      ['Kategori', 'Jumlah (kg)'],
      ['Makanan Pokok', todayOmpreng.pokok || 0],
      ['Sayur', todayOmpreng.sayur || 0],
      ['Lauk Pauk', todayOmpreng.laukpauk || 0],
      ['Lauk Nabati', todayOmpreng.lauknabati || 0],
      ['Buah/Susu', todayOmpreng.buah || 0]
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan_aslap_${getTodayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Data berhasil diexport ke CSV');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Gagal mengexport data');
  }
};

// ==================== NOTIFICATION ====================
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

// ==================== TIMESTAMP ====================
function updateTimestamp() {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('id-ID');
  const timestampEl = document.getElementById('lastUpdate');
  if (timestampEl) {
    timestampEl.textContent = `Terakhir update: ${timestamp}`;
  }
}

// ==================== STOCK FUNCTIONS ====================
export async function editListrik() {
  const inputListrik = document.getElementById('inputListrik');
  const nilaiBaru = parseFloat(inputListrik.value);
  
  if (isNaN(nilaiBaru) || nilaiBaru < 0) {
    alert("Masukkan jumlah yang valid!");
    return;
  }
  
  try {
    await set(ref(db, 'stok_operasional/LISTRIK'), { 
      nama: "LISTRIK", 
      stok: nilaiBaru 
    });
    
    document.getElementById('listrik').textContent = nilaiBaru;
    inputListrik.value = '';
    showToast(`Listrik diupdate menjadi ${nilaiBaru} kWh/Token`);
    updateTimestamp();
  } catch (error) {
    console.error("Error update listrik:", error);
    alert("Gagal mengupdate listrik!");
  }
}

export async function editStok(namaKey, perubahan) {
  const key = namaKey;
  
  try {
    const snapshot = await get(ref(db, 'stok_operasional/' + key));
    let stokSekarang = 0;
    let namaAsli = "";
    
    if (snapshot.exists()) {
      stokSekarang = snapshot.val().stok || 0;
      namaAsli = snapshot.val().nama || "";
    } else {
      if (key === "GAS_LPG_50KG") namaAsli = "GAS LPG 50KG";
      else if (key === "GAS_LPG_12KG") namaAsli = "GAS LPG 12KG";
      else if (key === "GALON_AIR") namaAsli = "GALON AIR";
    }
    
    const stokBaru = Math.max(0, stokSekarang + perubahan);
    
    await set(ref(db, 'stok_operasional/' + key), { 
      nama: namaAsli, 
      stok: stokBaru 
    });
    
    const elementId = key === "GAS_LPG_50KG" ? "lpg50" :
                      key === "GAS_LPG_12KG" ? "lpg12" : "galon";
    const element = document.getElementById(elementId);
    if (element) element.textContent = stokBaru;
    
    const perubahanText = perubahan > 0 ? `+${perubahan}` : perubahan;
    showToast(`${namaAsli}: ${perubahanText} → Stok sekarang ${stokBaru}`);
    updateTimestamp();
    
  } catch (error) {
    console.error("Error update stok:", error);
    alert("Gagal mengupdate stok!");
  }
}