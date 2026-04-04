import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, stokRef } from "./firebase-init.js";
import { daftarBarangDefault, kategoriBarang } from "./data.js";
import { updateDashboard } from "./dashboard.js";
import { showToast } from "./utils.js";

let currentPage = 'dashboard';
let editingStock = null;
let activeFilters = {}; // Menyimpan filter per kategori

export function setCurrentPage(page) {
  currentPage = page;
}

export function loadStokPage() {
  return `
    <style>
      .stok-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      }
      
      .stok-form {
        background: white;
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 32px;
        box-shadow: var(--card-shadow);
      }
      
      .form-grid {
        display: grid;
        grid-template-columns: 2fr 1fr auto;
        gap: 12px;
        align-items: end;
      }
      
      .kategori-section {
        margin-bottom: 32px;
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: var(--card-shadow);
      }
      
      .kategori-header {
        background: var(--gray-50);
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        border-bottom: 1px solid var(--gray-200);
      }
      
      .kategori-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .kategori-title i {
        font-size: 20px;
      }
      
      .filter-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        background: white;
        padding: 6px 12px;
        border-radius: 40px;
        border: 1px solid var(--gray-200);
      }
      
      .filter-controls label {
        font-size: 12px;
        color: var(--gray-500);
        margin: 0;
      }
      
      .filter-input {
        width: 70px;
        padding: 6px 10px;
        margin: 0;
        font-size: 13px;
        text-align: center;
        border-radius: 20px;
      }
      
      .filter-badge {
        background: var(--primary);
        color: white;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 11px;
        margin-left: 8px;
      }
      
      .clear-filter {
        background: none;
        color: var(--gray-500);
        padding: 4px 8px;
        width: auto;
        font-size: 11px;
        box-shadow: none;
      }
      
      .clear-filter:hover {
        background: var(--gray-100);
        transform: none;
        color: var(--danger);
      }
      
      .stok-table-wrapper {
        overflow-x: auto;
      }
      
      .stok-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .stok-table th {
        background: var(--gray-50);
        padding: 14px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 13px;
        color: var(--gray-600);
        border-bottom: 1px solid var(--gray-200);
      }
      
      .stok-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--gray-100);
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .stok-table tr:hover td {
        background: #f0fdf4;
      }
      
      .stok-table tr td:first-child {
        font-weight: 500;
      }
      
      .stok-table tr td:last-child {
        text-align: right;
      }
      
      .editable-hint {
        font-size: 11px;
        color: var(--gray-400);
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .editable-hint i {
        font-size: 10px;
      }
      
      .low-stock {
        color: var(--danger);
        font-weight: 700;
        background: var(--danger-bg);
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
      }
      
      .normal-stock {
        color: var(--primary);
        font-weight: 600;
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        background: var(--success-bg);
        font-size: 13px;
      }
      
      .stock-number {
        font-weight: 700;
        font-size: 15px;
      }
      
      .two-columns {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
      }
      
      .empty-filter {
        text-align: center;
        padding: 40px;
        color: var(--gray-400);
        font-style: italic;
      }
      
      .edit-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .edit-modal-content {
        background: white;
        border-radius: 24px;
        padding: 28px;
        width: 90%;
        max-width: 400px;
        animation: modalFadeIn 0.2s ease;
      }
      
      @keyframes modalFadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .edit-modal h3 {
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .edit-modal input {
        margin-bottom: 20px;
      }
      
      .edit-modal-buttons {
        display: flex;
        gap: 12px;
      }
      
      .edit-modal-buttons button {
        flex: 1;
      }
      
      .btn-cancel {
        background: var(--gray-400);
      }
      
      .btn-cancel:hover {
        background: var(--gray-500);
      }
      
      .filter-info {
        font-size: 12px;
        color: var(--gray-500);
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .global-reset {
        background: var(--gray-100);
        color: var(--gray-600);
        padding: 6px 12px;
        font-size: 12px;
        width: auto;
        margin-left: auto;
      }
      
      .global-reset:hover {
        background: var(--gray-200);
      }
      
      @media (max-width: 1024px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
        
        .two-columns {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .kategori-header {
          flex-direction: column;
          align-items: flex-start;
        }
      }
      
      @media (max-width: 768px) {
        .stok-table th, 
        .stok-table td {
          padding: 8px 12px;
          font-size: 13px;
        }
      }
    </style>
    
    <h2 class="text-3xl font-semibold mb-6">Sisa Stok Operasional</h2>
    
    <!-- Form Input Stok - Tanpa Dropdown -->
    <div class="stok-form">
      <div class="form-grid">
        <input id="namaBarangBaru" type="text" placeholder="Nama barang baru">
        <select id="jenisStok">
          <option value="masuk">➕ Tambah Stok</option>
          <option value="keluar">➖ Kurangi Stok</option>
        </select>
        <input id="jumlahStok" type="number" step="0.01" placeholder="Jumlah">
        <button onclick="window.simpanStok()">Simpan</button>
      </div>
      <div class="editable-hint">
        <i class="fas fa-mouse-pointer"></i>
        <span>💡 Klik dua kali pada angka stok untuk mengedit langsung</span>
      </div>
    </div>
    
    <!-- Tabel Stok per Kategori - 2 Kolom -->
    <div id="stokKategoriContainer"></div>
  `;
}

export function initStok() {
  loadStokWithCategories();
}

window.simpanStok = function() {
  let nama = document.getElementById('namaBarangBaru').value.trim();

  const jenis = document.getElementById('jenisStok').value;
  let jumlah = parseFloat(document.getElementById('jumlahStok').value);

  if (!nama) {
    alert("Masukkan nama barang!");
    return;
  }
  
  if (!jumlah || isNaN(jumlah)) {
    alert("Masukkan jumlah yang valid!");
    return;
  }

  const key = nama.replace(/[^a-zA-Z0-9]/g, '_');

  onValue(ref(db, 'stok_operasional/' + key), (snap) => {
    let stokSekarang = snap.exists() ? snap.val().stok : 0;
    let kategoriSekarang = snap.exists() ? snap.val().kategori : null;
    
    if (jenis === 'keluar') jumlah = -jumlah;
    const stokBaru = Math.max(0, stokSekarang + jumlah);
    
    // Tentukan kategori
    let kategori = kategoriSekarang;
    if (!kategori) {
      // Cek apakah barang sudah ada di kategori default
      let found = false;
      for (const [cat, items] of Object.entries(kategoriBarang)) {
        if (items.includes(nama)) {
          kategori = cat;
          found = true;
          break;
        }
      }
      if (!found) {
        kategori = "Barang Lainnya";
        // Tambahkan ke kategori Barang Lainnya jika belum ada
        if (!kategoriBarang["Barang Lainnya"].includes(nama)) {
          kategoriBarang["Barang Lainnya"].push(nama);
        }
      }
    }

    set(ref(db, 'stok_operasional/' + key), { 
      nama: nama, 
      stok: stokBaru,
      kategori: kategori
    });

    showToast(`Stok "${nama}" berhasil diupdate menjadi ${stokBaru}`);

    document.getElementById('namaBarangBaru').value = '';
    document.getElementById('jumlahStok').value = '';

    loadStokWithCategories();
    
    if (currentPage === 'dashboard') {
      updateDashboard();
    }
  }, { onlyOnce: true });
};

// Fungsi untuk filter per kategori
window.applyFilter = function(kategori) {
  const input = document.getElementById(`filter_${kategori.replace(/\s/g, '_')}`);
  const value = parseInt(input.value);
  
  if (isNaN(value)) {
    // Hapus filter jika input kosong
    delete activeFilters[kategori];
  } else {
    activeFilters[kategori] = value;
  }
  
  // Refresh tampilan dengan filter
  loadStokWithCategories();
};

window.clearFilter = function(kategori) {
  delete activeFilters[kategori];
  const input = document.getElementById(`filter_${kategori.replace(/\s/g, '_')}`);
  if (input) input.value = '';
  loadStokWithCategories();
};

window.resetAllFilters = function() {
  activeFilters = {};
  // Reset semua input filter
  document.querySelectorAll('.filter-input').forEach(input => {
    input.value = '';
  });
  loadStokWithCategories();
  showToast('Semua filter direset');
};

// Fungsi untuk edit stok langsung (double click)
window.editStockDirect = function(nama, currentStock) {
  // Hapus modal jika sudah ada
  const existingModal = document.querySelector('.edit-modal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.className = 'edit-modal';
  modal.innerHTML = `
    <div class="edit-modal-content">
      <h3>
        <i class="fas fa-edit" style="color: var(--primary);"></i>
        Edit Stok: ${nama}
      </h3>
      <input type="number" id="editStockValue" step="0.01" value="${currentStock}" placeholder="Jumlah stok baru">
      <div class="edit-modal-buttons">
        <button onclick="window.saveStockEdit('${nama.replace(/'/g, "\\'")}')" style="background: var(--primary);">Simpan</button>
        <button onclick="this.closest('.edit-modal').remove()" class="btn-cancel">Batal</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus pada input
  setTimeout(() => {
    const input = document.getElementById('editStockValue');
    if (input) input.focus();
  }, 100);
  
  // Tutup modal jika klik di luar
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
};

window.saveStockEdit = async function(nama) {
  const newStock = parseFloat(document.getElementById('editStockValue').value);
  
  if (isNaN(newStock) || newStock < 0) {
    alert("Masukkan jumlah yang valid (minimal 0)!");
    return;
  }
  
  const key = nama.replace(/[^a-zA-Z0-9]/g, '_');
  
  try {
    // Ambil data lama untuk mendapatkan kategori
    const snapshot = await get(ref(db, 'stok_operasional/' + key));
    let kategori = snapshot.exists() ? snapshot.val().kategori : null;
    
    if (!kategori) {
      // Cek kategori default
      let found = false;
      for (const [cat, items] of Object.entries(kategoriBarang)) {
        if (items.includes(nama)) {
          kategori = cat;
          found = true;
          break;
        }
      }
      if (!found) {
        kategori = "Barang Lainnya";
        if (!kategoriBarang["Barang Lainnya"].includes(nama)) {
          kategoriBarang["Barang Lainnya"].push(nama);
        }
      }
    }
    
    await set(ref(db, 'stok_operasional/' + key), { 
      nama: nama, 
      stok: newStock,
      kategori: kategori
    });
    
    showToast(`Stok "${nama}" diubah menjadi ${newStock}`);
    
    // Tutup modal
    const modal = document.querySelector('.edit-modal');
    if (modal) modal.remove();
    
    // Refresh tampilan
    loadStokWithCategories();
    
    if (currentPage === 'dashboard') {
      updateDashboard();
    }
  } catch (error) {
    console.error("Error update stok:", error);
    alert("Gagal mengupdate stok: " + error.message);
  }
};

function loadStokWithCategories() {
  onValue(stokRef, (snapshot) => {
    const data = snapshot.val() || {};
    
    // Buat map untuk menyimpan stok berdasarkan nama
    const stockMap = {};
    const kategoriMap = {};
    Object.values(data).forEach(item => {
      stockMap[item.nama] = item.stok || 0;
      kategoriMap[item.nama] = item.kategori;
    });
    
    // Update kategoriBarang berdasarkan data dari Firebase
    for (const [nama, kategori] of Object.entries(kategoriMap)) {
      if (kategori && kategori !== "Barang Lainnya") {
        let found = false;
        for (const items of Object.values(kategoriBarang)) {
          if (items.includes(nama)) {
            found = true;
            break;
          }
        }
        if (!found && kategoriBarang[kategori]) {
          if (!kategoriBarang[kategori].includes(nama)) {
            kategoriBarang[kategori].push(nama);
          }
        }
      } else if (kategori === "Barang Lainnya") {
        if (!kategoriBarang["Barang Lainnya"].includes(nama)) {
          kategoriBarang["Barang Lainnya"].push(nama);
        }
      }
    }
    
    // Filter kategori yang memiliki item
    const kategoriEntries = Object.entries(kategoriBarang)
      .filter(([_, items]) => items.length > 0);
    
    const midPoint = Math.ceil(kategoriEntries.length / 2);
    const leftCategories = kategoriEntries.slice(0, midPoint);
    const rightCategories = kategoriEntries.slice(midPoint);
    
    // Hitung total filter aktif
    const activeFilterCount = Object.keys(activeFilters).length;
    
    function renderCategoryList(categories) {
      return categories.map(([kategori, items]) => {
        // Filter item berdasarkan stok jika ada filter untuk kategori ini
        const filterValue = activeFilters[kategori];
        let itemsWithStock = items.map(item => ({
          nama: item,
          stok: stockMap[item] || 0
        })).sort((a, b) => a.nama.localeCompare(b.nama));
        
        // Terapkan filter jika ada
        if (filterValue !== undefined) {
          itemsWithStock = itemsWithStock.filter(item => item.stok <= filterValue);
        }
        
        const hasFilter = filterValue !== undefined;
        const currentFilterValue = filterValue || '';
        
        if (itemsWithStock.length === 0 && !hasFilter) return '';
        
        return `
          <div class="kategori-section">
            <div class="kategori-header">
              <div class="kategori-title">
                <i class="fas ${getCategoryIcon(kategori)}"></i>
                ${kategori}
                <span class="filter-badge">${itemsWithStock.length} / ${items.length} item</span>
              </div>
              <div class="filter-controls">
                <i class="fas fa-filter" style="font-size: 12px; color: var(--gray-500);"></i>
                <label>Stok ≤</label>
                <input 
                  type="number" 
                  id="filter_${kategori.replace(/\s/g, '_')}" 
                  class="filter-input" 
                  placeholder="all"
                  value="${currentFilterValue}"
                  onkeypress="if(event.key === 'Enter') window.applyFilter('${kategori}')"
                >
                <button onclick="window.applyFilter('${kategori}')" style="width: auto; padding: 6px 12px; font-size: 12px;">Filter</button>
                ${hasFilter ? `<button onclick="window.clearFilter('${kategori}')" class="clear-filter"><i class="fas fa-times"></i></button>` : ''}
              </div>
            </div>
            ${itemsWithStock.length > 0 ? `
              <div class="stok-table-wrapper">
                <table class="stok-table">
                  <thead>
                    <tr>
                      <th style="width: 70%">Nama Barang</th>
                      <th style="width: 30%">Sisa Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsWithStock.map(item => {
                      const stok = item.stok;
                      const stockClass = stok < 5 ? 'low-stock' : 'normal-stock';
                      return `
                        <tr ondblclick="window.editStockDirect('${item.nama.replace(/'/g, "\\'")}', ${stok})" style="cursor: pointer;">
                          <td>${item.nama}</td>
                          <td class="text-right">
                            <span class="${stockClass}">
                              <span class="stock-number">${stok}</span>
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="empty-filter">
                <i class="fas fa-search" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                Tidak ada barang dengan stok ≤ ${filterValue}
              </div>
            `}
          </div>
        `;
      }).join('');
    }
    
    const filterInfoHtml = activeFilterCount > 0 ? `
      <div class="filter-info">
        <i class="fas fa-filter"></i>
        <span>Filter aktif pada ${activeFilterCount} kategori</span>
        <button onclick="window.resetAllFilters()" class="global-reset">
          <i class="fas fa-undo-alt"></i> Reset Semua Filter
        </button>
      </div>
    ` : '';
    
    const html = `
      ${filterInfoHtml}
      <div class="two-columns">
        <div class="left-column">
          ${renderCategoryList(leftCategories)}
        </div>
        <div class="right-column">
          ${renderCategoryList(rightCategories)}
        </div>
      </div>
    `;
    
    const container = document.getElementById('stokKategoriContainer');
    if (container) {
      container.innerHTML = html;
    }
  });
}

function getCategoryIcon(kategori) {
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