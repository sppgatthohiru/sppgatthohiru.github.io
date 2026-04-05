// ============================================================
// STOK.JS - Halaman Manajemen Stok Operasional
// ============================================================
import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, stokRef } from "./firebase-init.js";
import { kategoriBarang, getCategoryIcon } from "./data.js";
import { updateDashboard } from "./dashboard.js";
import { showToast, escapeHtml } from "./utils.js";

// ============================================================
// GLOBAL VARIABLES
// ============================================================
let currentPage = 'dashboard';
let activeFilters = {};

// ============================================================
// LOAD STOK PAGE HTML
// ============================================================
export function loadStokPage() {
  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gradient">Manajemen Stok Operasional</h1>
          <p class="text-slate-500 mt-1">Kelola stok barang dapur dengan mudah</p>
        </div>
        <div class="badge badge-primary badge-lg gap-2">
          <i class="fas fa-boxes"></i> Real-time
        </div>
      </div>
      
      <!-- Form Input Stok -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-6">
          <h3 class="font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <i class="fas fa-plus-circle text-primary"></i> Tambah / Kurangi Stok
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text text-slate-600">Nama Barang</span>
              </label>
              <input id="namaBarangBaru" type="text" placeholder="Contoh: Sabun Cuci Piring" class="input input-bordered w-full focus:border-primary">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text text-slate-600">Jenis Transaksi</span>
              </label>
              <select id="jenisStok" class="select select-bordered w-full">
                <option value="masuk">➕ Tambah Stok (Masuk)</option>
                <option value="keluar">➖ Kurangi Stok (Keluar)</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text text-slate-600">Jumlah</span>
              </label>
              <input id="jumlahStok" type="number" step="0.01" placeholder="0" class="input input-bordered w-full">
            </div>
            <div class="form-control">
              <label class="label opacity-0">Action</label>
              <button onclick="window.simpanStok()" class="btn btn-primary">
                <i class="fas fa-save"></i> Simpan
              </button>
            </div>
          </div>
          <div class="text-xs text-slate-400 mt-3 flex items-center gap-2">
            <i class="fas fa-mouse-pointer"></i>
            <span>💡 Klik dua kali pada angka stok untuk mengedit langsung</span>
          </div>
        </div>
      </div>
      
      <!-- Filter Info Bar -->
      <div id="filterInfoBar"></div>
      
      <!-- Stok Kategori Container -->
      <div id="stokKategoriContainer" class="grid grid-cols-1 lg:grid-cols-2 gap-6"></div>
    </div>
  `;
}

// ============================================================
// INIT STOK PAGE
// ============================================================
export function initStok() {
  loadStokWithCategories();
}

export function setCurrentPage(page) {
  currentPage = page;
}

// ============================================================
// SIMPAN STOK
// ============================================================
window.simpanStok = function() {
  const nama = document.getElementById('namaBarangBaru').value.trim();
  const jenis = document.getElementById('jenisStok').value;
  let jumlah = parseFloat(document.getElementById('jumlahStok').value);

  if (!nama) {
    showToast('Masukkan nama barang!', 3000, 'error');
    return;
  }
  
  if (!jumlah || isNaN(jumlah)) {
    showToast('Masukkan jumlah yang valid!', 3000, 'error');
    return;
  }

  const key = nama.replace(/[^a-zA-Z0-9]/g, '_');

  onValue(ref(db, 'stok_operasional/' + key), (snap) => {
    let stokSekarang = snap.exists() ? snap.val().stok : 0;
    let kategoriSekarang = snap.exists() ? snap.val().kategori : null;
    
    if (jenis === 'keluar') jumlah = -jumlah;
    const stokBaru = Math.max(0, stokSekarang + jumlah);
    
    let kategori = kategoriSekarang;
    if (!kategori) {
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

    set(ref(db, 'stok_operasional/' + key), { nama, stok: stokBaru, kategori });
    showToast(`✅ Stok "${nama}" berhasil diupdate menjadi ${stokBaru}`, 2000, 'success');

    document.getElementById('namaBarangBaru').value = '';
    document.getElementById('jumlahStok').value = '';

    loadStokWithCategories();
    if (currentPage === 'dashboard' && typeof updateDashboard === 'function') updateDashboard();
  }, { onlyOnce: true });
};

// ============================================================
// FILTER FUNCTIONS
// ============================================================
window.applyFilter = function(kategori) {
  const input = document.getElementById(`filter_${kategori.replace(/\s/g, '_')}`);
  const value = parseInt(input?.value);
  if (isNaN(value)) delete activeFilters[kategori];
  else activeFilters[kategori] = value;
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
  document.querySelectorAll('.filter-input').forEach(input => input.value = '');
  loadStokWithCategories();
  showToast('Semua filter direset', 2000, 'info');
};

// ============================================================
// EDIT STOCK DIRECT
// ============================================================
window.editStockDirect = function(nama, currentStock) {
  const existingModal = document.getElementById('editStockDirectModal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'editStockDirectModal';
  modal.className = 'modal modal-open';
  modal.innerHTML = `
    <div class="modal-box">
      <h3 class="font-bold text-lg flex items-center gap-2">
        <i class="fas fa-edit text-primary"></i>
        Edit Stok: ${escapeHtml(nama)}
      </h3>
      <div class="form-control my-4">
        <label class="label">
          <span class="label-text">Jumlah Stok Baru</span>
        </label>
        <input type="number" id="editStockValue" step="0.01" value="${currentStock}" class="input input-bordered w-full">
      </div>
      <div class="modal-action">
        <button class="btn btn-primary" onclick="window.saveStockEditDirect('${nama.replace(/'/g, "\\'")}')">Simpan</button>
        <button class="btn btn-ghost" onclick="this.closest('.modal').classList.remove('modal-open')">Batal</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('editStockValue')?.focus(), 100);
};

window.saveStockEditDirect = async function(nama) {
  const newStock = parseFloat(document.getElementById('editStockValue').value);
  if (isNaN(newStock) || newStock < 0) {
    showToast('Masukkan jumlah yang valid (minimal 0)!', 3000, 'error');
    return;
  }
  
  const key = nama.replace(/[^a-zA-Z0-9]/g, '_');
  
  try {
    const snapshot = await get(ref(db, 'stok_operasional/' + key));
    let kategori = snapshot.exists() ? snapshot.val().kategori : null;
    
    if (!kategori) {
      let found = false;
      for (const [cat, items] of Object.entries(kategoriBarang)) {
        if (items.includes(nama)) { kategori = cat; found = true; break; }
      }
      if (!found) {
        kategori = "Barang Lainnya";
        if (!kategoriBarang["Barang Lainnya"].includes(nama)) kategoriBarang["Barang Lainnya"].push(nama);
      }
    }
    
    await set(ref(db, 'stok_operasional/' + key), { nama, stok: newStock, kategori });
    showToast(`✅ Stok "${nama}" diubah menjadi ${newStock}`, 2000, 'success');
    document.getElementById('editStockDirectModal')?.classList.remove('modal-open');
    loadStokWithCategories();
    if (currentPage === 'dashboard' && typeof updateDashboard === 'function') updateDashboard();
  } catch (error) {
    showToast('Gagal mengupdate stok', 3000, 'error');
  }
};

// ============================================================
// LOAD STOK WITH CATEGORIES
// ============================================================
function loadStokWithCategories() {
  onValue(stokRef, (snapshot) => {
    const data = snapshot.val() || {};
    const stockMap = {};
    const kategoriMap = {};
    
    Object.values(data).forEach(item => {
      stockMap[item.nama] = item.stok || 0;
      kategoriMap[item.nama] = item.kategori;
    });
    
    // Update kategoriBarang
    for (const [nama, kategori] of Object.entries(kategoriMap)) {
      if (kategori && kategori !== "Barang Lainnya") {
        let found = false;
        for (const items of Object.values(kategoriBarang)) {
          if (items.includes(nama)) { found = true; break; }
        }
        if (!found && kategoriBarang[kategori] && !kategoriBarang[kategori].includes(nama)) {
          kategoriBarang[kategori].push(nama);
        }
      } else if (kategori === "Barang Lainnya" && !kategoriBarang["Barang Lainnya"].includes(nama)) {
        kategoriBarang["Barang Lainnya"].push(nama);
      }
    }
    
    const kategoriEntries = Object.entries(kategoriBarang).filter(([_, items]) => items.length > 0);
    const midPoint = Math.ceil(kategoriEntries.length / 2);
    const leftCategories = kategoriEntries.slice(0, midPoint);
    const rightCategories = kategoriEntries.slice(midPoint);
    
    const activeFilterCount = Object.keys(activeFilters).length;
    const filterInfoBar = document.getElementById('filterInfoBar');
    if (filterInfoBar) {
      filterInfoBar.innerHTML = activeFilterCount > 0 ? `
        <div class="alert alert-info shadow-md">
          <div class="flex justify-between items-center w-full flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <i class="fas fa-filter"></i>
              <span>Filter aktif pada ${activeFilterCount} kategori</span>
            </div>
            <button onclick="window.resetAllFilters()" class="btn btn-xs btn-ghost text-primary">
              <i class="fas fa-undo-alt"></i> Reset Semua Filter
            </button>
          </div>
        </div>
      ` : '';
    }
    
    function renderCategoryList(categories) {
      return categories.map(([kategori, items]) => {
        const filterValue = activeFilters[kategori];
        let itemsWithStock = items.map(item => ({ nama: item, stok: stockMap[item] || 0 }))
          .sort((a, b) => a.nama.localeCompare(b.nama));
        
        if (filterValue !== undefined) itemsWithStock = itemsWithStock.filter(item => item.stok <= filterValue);
        
        const hasFilter = filterValue !== undefined;
        const currentFilterValue = filterValue || '';
        
        if (itemsWithStock.length === 0 && !hasFilter) return '';
        
        return `
          <div class="card bg-white shadow-md border border-slate-100 overflow-hidden">
            <div class="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
              <div class="flex items-center gap-2">
                <i class="fas ${getCategoryIcon(kategori)} text-primary text-lg"></i>
                <h3 class="font-semibold text-slate-700">${kategori}</h3>
                <span class="badge badge-primary badge-sm">${itemsWithStock.length} / ${items.length}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-filter text-slate-400 text-sm"></i>
                <span class="text-xs text-slate-500">Stok ≤</span>
                <input type="number" id="filter_${kategori.replace(/\s/g, '_')}" class="filter-input input input-bordered input-xs w-20 text-center" placeholder="all" value="${currentFilterValue}" onkeypress="if(event.key === 'Enter') window.applyFilter('${kategori}')">
                <button onclick="window.applyFilter('${kategori}')" class="btn btn-xs btn-primary">Filter</button>
                ${hasFilter ? `<button onclick="window.clearFilter('${kategori}')" class="btn btn-xs btn-ghost text-red-500"><i class="fas fa-times"></i></button>` : ''}
              </div>
            </div>
            ${itemsWithStock.length > 0 ? `
              <div class="overflow-x-auto">
                <table class="table table-zebra table-sm">
                  <thead>
                    <tr class="bg-slate-50">
                      <th class="w-2/3 text-slate-600">Nama Barang</th>
                      <th class="w-1/3 text-right text-slate-600">Sisa Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsWithStock.map(item => {
                      const isLowStock = item.stok < 5;
                      return `
                        <tr class="cursor-pointer hover:bg-primary/5 transition-colors" ondblclick="window.editStockDirect('${item.nama.replace(/'/g, "\\'")}', ${item.stok})">
                          <td class="font-medium">${escapeHtml(item.nama)}</td>
                          <td class="text-right">
                            <span class="badge ${isLowStock ? 'badge-error' : 'badge-success'} badge-md">
                              ${item.stok}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="text-center py-8 text-slate-400">
                <i class="fas fa-search text-3xl mb-2 block"></i>
                <p>Tidak ada barang dengan stok ≤ ${filterValue}</p>
              </div>
            `}
          </div>
        `;
      }).join('');
    }
    
    const container = document.getElementById('stokKategoriContainer');
    if (container) {
      container.innerHTML = `
        <div class="space-y-6">${renderCategoryList(leftCategories)}</div>
        <div class="space-y-6">${renderCategoryList(rightCategories)}</div>
      `;
    }
  });
}