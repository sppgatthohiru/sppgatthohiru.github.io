// ============================================================
// ABSENSI.JS - Halaman Absensi Relawan
// ============================================================
import { ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, absensiRef } from "./firebase-init.js";
import { daftarRelawan } from "./data.js";
import { showToast, escapeHtml } from "./utils.js";

// ============================================================
// LOAD PAGE HTML
// ============================================================
export function loadAbsensiPage() {
  const today = new Date().toISOString().slice(0, 10);
  
  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gradient">Absensi Relawan</h1>
          <p class="text-slate-500 mt-1">Catat kehadiran relawan harian</p>
        </div>
        <div class="badge badge-primary badge-lg gap-2">
          <i class="fas fa-users"></i> ${daftarRelawan.length} Relawan
        </div>
      </div>
      
      <!-- Form Absensi Card -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-6">
          <div class="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <i class="fas fa-calendar-check text-primary text-xl"></i>
              </div>
              <div>
                <h3 class="font-semibold text-slate-700">Form Absensi</h3>
                <p class="text-xs text-slate-400">Pilih tanggal dan isi kehadiran relawan</p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <input type="date" id="tanggalAbsensi" value="${today}" class="input input-bordered input-sm w-auto">
              <button onclick="window.loadAbsensiHariIni()" class="btn btn-primary btn-sm">
                <i class="fas fa-sync-alt"></i> Muat
              </button>
              <button onclick="window.simpanSemuaAbsensi()" class="btn btn-success btn-sm">
                <i class="fas fa-save"></i> Simpan Semua
              </button>
            </div>
          </div>
          
          <div id="daftarAbsensiChecklist" class="mt-4">
            <div class="text-center py-8 text-slate-400">
              <span class="loading loading-spinner loading-md"></span>
              <p class="mt-2">Memuat data...</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Riwayat Absensi Card -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-6">
          <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
            <i class="fas fa-history text-primary text-xl"></i>
            <h3 class="font-semibold text-slate-700">Riwayat Absensi</h3>
          </div>
          
          <div class="flex flex-wrap items-center gap-3 mt-2">
            <input type="date" id="dateAbsensi" class="input input-bordered input-sm w-auto">
            <button onclick="window.tampilRiwayatAbsensi()" class="btn btn-primary btn-sm">
              <i class="fas fa-search"></i> Tampilkan
            </button>
          </div>
          
          <div id="listAbsensi" class="mt-4">
            <div class="text-center py-8 text-slate-400">
              <i class="fas fa-calendar-alt text-3xl mb-2 block"></i>
              <p>Pilih tanggal untuk melihat riwayat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// INIT PAGE
// ============================================================
export function initAbsensi() {
  window.loadAbsensiHariIni();
}

// ============================================================
// LOAD ABSENSI HARI INI
// ============================================================
window.loadAbsensiHariIni = function() {
  const tanggal = document.getElementById('tanggalAbsensi').value;
  if (!tanggal) return;
  
  onValue(absensiRef, (snap) => {
    const data = snap.val() || {};
    const existingAbsen = {};
    Object.values(data).forEach(item => {
      if (item.tanggalISO === tanggal) existingAbsen[item.nama] = item.status;
    });
    
    const container = document.getElementById('daftarAbsensiChecklist');
    if (!container) return;
    
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
        ${daftarRelawan.map(relawan => {
          const statusSekarang = existingAbsen[relawan] || 'Hadir';
          const isHadir = statusSekarang === 'Hadir';
          const safeName = relawan.replace(/\s/g, '_');
          return `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-primary/5 transition-colors">
              <span class="font-medium text-sm text-slate-700">${escapeHtml(relawan)}</span>
              <div class="flex gap-2">
                <label class="flex items-center gap-1 cursor-pointer px-2 py-1 rounded-full bg-green-100">
                  <input type="radio" name="absen_${safeName}" value="Hadir" data-relawan="${escapeHtml(relawan)}" ${isHadir ? 'checked' : ''} class="radio radio-success radio-sm">
                  <span class="text-sm">✅</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer px-2 py-1 rounded-full bg-red-100">
                  <input type="radio" name="absen_${safeName}" value="Tidak Hadir" data-relawan="${escapeHtml(relawan)}" ${!isHadir ? 'checked' : ''} class="radio radio-error radio-sm">
                  <span class="text-sm">❌</span>
                </label>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  });
};

// ============================================================
// SIMPAN SEMUA ABSENSI
// ============================================================
window.simpanSemuaAbsensi = async function() {
  const tanggal = document.getElementById('tanggalAbsensi').value;
  if (!tanggal) {
    showToast("Pilih tanggal terlebih dahulu!", 2000, 'error');
    return;
  }
  
  const absenBaru = {};
  daftarRelawan.forEach(relawan => {
    const safeName = relawan.replace(/\s/g, '_');
    const radioHadir = document.querySelector(`input[name="absen_${safeName}"][value="Hadir"]`);
    absenBaru[relawan] = radioHadir && radioHadir.checked ? 'Hadir' : 'Tidak Hadir';
  });
  
  const snapshot = await get(absensiRef);
  const data = snapshot.val() || {};
  
  const hapusPromises = [];
  Object.entries(data).forEach(([key, value]) => {
    if (value.tanggalISO === tanggal) hapusPromises.push(set(ref(db, 'absensi/' + key), null));
  });
  await Promise.all(hapusPromises);
  
  const simpanPromises = [];
  for (const [relawan, status] of Object.entries(absenBaru)) {
    simpanPromises.push(push(absensiRef, {
      tanggalISO: tanggal,
      tanggalDisplay: new Date(tanggal).toLocaleDateString('id-ID'),
      nama: relawan,
      status: status
    }));
  }
  await Promise.all(simpanPromises);
  
  const hadirCount = Object.values(absenBaru).filter(s => s === 'Hadir').length;
  showToast(`✅ Absensi ${tanggal} disimpan! Hadir: ${hadirCount}, Tidak Hadir: ${daftarRelawan.length - hadirCount}`, 3000, 'success');
};

// ============================================================
// TAMPIL RIWAYAT ABSENSI
// ============================================================
window.tampilRiwayatAbsensi = function() {
  const selected = document.getElementById('dateAbsensi').value;
  if (!selected) {
    showToast("Pilih tanggal terlebih dahulu!", 2000, 'error');
    return;
  }
  
  onValue(absensiRef, (snap) => {
    const data = snap.val() || {};
    const hadir = [];
    const tidakHadir = [];
    
    Object.values(data).forEach(item => {
      if (item.tanggalISO === selected) {
        if (item.status === 'Hadir') hadir.push(item.nama);
        else tidakHadir.push(item.nama);
      }
    });
    
    const container = document.getElementById('listAbsensi');
    if (!container) return;
    
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
        <!-- Hadir Column -->
        <div class="bg-green-50 rounded-xl p-4 border border-green-100">
          <div class="flex items-center gap-2 pb-3 border-b border-green-200">
            <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-check-circle text-white text-sm"></i>
            </div>
            <h4 class="font-bold text-green-700">Hadir</h4>
            <span class="badge badge-success ml-auto">${hadir.length}</span>
          </div>
          <div class="max-h-80 overflow-y-auto space-y-2 mt-3 custom-scrollbar">
            ${hadir.length > 0 ? hadir.map(nama => `
              <div class="flex items-center gap-2 p-2 bg-white rounded-lg">
                <i class="fas fa-user-check text-green-500"></i>
                <span class="text-sm text-slate-700">${escapeHtml(nama)}</span>
              </div>
            `).join('') : '<div class="text-center py-4 text-slate-400">Tidak ada yang hadir</div>'}
          </div>
        </div>
        
        <!-- Tidak Hadir Column -->
        <div class="bg-red-50 rounded-xl p-4 border border-red-100">
          <div class="flex items-center gap-2 pb-3 border-b border-red-200">
            <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <i class="fas fa-times-circle text-white text-sm"></i>
            </div>
            <h4 class="font-bold text-red-700">Tidak Hadir</h4>
            <span class="badge badge-error ml-auto">${tidakHadir.length}</span>
          </div>
          <div class="max-h-80 overflow-y-auto space-y-2 mt-3 custom-scrollbar">
            ${tidakHadir.length > 0 ? tidakHadir.map(nama => `
              <div class="flex items-center gap-2 p-2 bg-white rounded-lg">
                <i class="fas fa-user-times text-red-500"></i>
                <span class="text-sm text-slate-700">${escapeHtml(nama)}</span>
              </div>
            `).join('') : '<div class="text-center py-4 text-slate-400">Semua hadir</div>'}
          </div>
        </div>
      </div>
    `;
  });
};