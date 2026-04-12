// ============================================================
// SISA-PENGOLAHAN.JS - Halaman Sisa Pengolahan
// ============================================================
import { push, onValue, ref, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, sisaPengRef } from "./firebase-init.js";
import { showToast, escapeHtml } from "./utils.js";
import { initAuthGuard } from './auth-guard.js';

async function initializePage() {
  const isLoggedIn = await initAuthGuard();
  if (!isLoggedIn) return;   // otomatis redirect ke login jika belum login
}
// ============================================================
// LOAD PAGE HTML
// ============================================================
export function loadSisaPengolahanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const todayDisplay = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gradient">Sisa Pengolahan</h1>
          <p class="text-slate-500 mt-1">Catat sisa bahan makanan setelah pengolahan</p>
        </div>
        <div class="badge badge-primary badge-lg gap-2">
          <i class="fas fa-recycle"></i> Daily Report
        </div>
      </div>
      
      <!-- Form Input Card -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-6">
          <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <i class="fas fa-recycle text-primary text-xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-slate-700">Input Sisa Pengolahan</h3>
              <p class="text-xs text-slate-400">Menyimpan data untuk tanggal: <span class="font-medium text-primary">${todayDisplay}</span></p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text flex items-center gap-2"><i class="fas fa-utensils text-amber-500"></i> Makanan Pokok</span>
              </label>
              <input type="number" id="pokok" step="0.1" placeholder="0 kg" value="0" class="input input-bordered focus:border-primary">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text flex items-center gap-2"><i class="fas fa-carrot text-green-500"></i> Sayur</span>
              </label>
              <input type="number" id="sayur" step="0.1" placeholder="0 kg" value="0" class="input input-bordered focus:border-primary">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text flex items-center gap-2"><i class="fas fa-drumstick-bite text-red-500"></i> Lauk Pauk</span>
              </label>
              <input type="number" id="laukpauk" step="0.1" placeholder="0 kg" value="0" class="input input-bordered focus:border-primary">
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text flex items-center gap-2"><i class="fas fa-seedling text-purple-500"></i> Lauk Nabati</span>
              </label>
              <input type="number" id="lauknabati" step="0.1" placeholder="0 kg" value="0" class="input input-bordered focus:border-primary">
            </div>
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text flex items-center gap-2"><i class="fas fa-apple-alt text-pink-500"></i> Buah / Susu</span>
              </label>
              <input type="number" id="buah" step="0.1" placeholder="0 kg" value="0" class="input input-bordered focus:border-primary">
            </div>
          </div>
          
          <button onclick="window.simpanSisaPengolahan()" class="btn btn-primary mt-4">
            <i class="fas fa-save"></i> Simpan Sisa Pengolahan
          </button>
        </div>
      </div>
      
      <!-- Riwayat Card -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-6">
          <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
            <i class="fas fa-history text-primary text-xl"></i>
            <h3 class="font-semibold text-slate-700">Riwayat Sisa Pengolahan</h3>
          </div>
          
          <div class="flex flex-wrap items-center gap-3 mt-2">
            <label class="text-sm text-slate-600">📅 Pilih Tanggal:</label>
            <input type="date" id="dateSisa" value="${today}" class="input input-bordered input-sm w-auto">
            <button onclick="window.tampilRiwayatSisa()" class="btn btn-primary btn-sm">
              <i class="fas fa-search"></i> Tampilkan
            </button>
          </div>
          
          <div id="listSisaPeng" class="space-y-3 mt-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div class="text-center py-8 text-slate-400">
              <i class="fas fa-calendar-alt text-3xl mb-2 block"></i>
              <p>Pilih tanggal untuk melihat data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSisaPengolahan() {}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getLocalDateISO() {
  return new Date().toISOString().slice(0, 10);
}

function getLocalDateDisplay() {
  return new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ============================================================
// SIMPAN SISA PENGOLAHAN
// ============================================================
window.simpanSisaPengolahan = async function() {
  const tanggalISO = getLocalDateISO();
  const tanggalDisplay = getLocalDateDisplay();
  
  const pokok = parseFloat(document.getElementById('pokok').value) || 0;
  const sayur = parseFloat(document.getElementById('sayur').value) || 0;
  const laukpauk = parseFloat(document.getElementById('laukpauk').value) || 0;
  const lauknabati = parseFloat(document.getElementById('lauknabati').value) || 0;
  const buah = parseFloat(document.getElementById('buah').value) || 0;
  
  const q = query(sisaPengRef, orderByChild('tanggalISO'), equalTo(tanggalISO));
  const snapshot = await new Promise((resolve) => onValue(q, (snap) => resolve(snap), { onlyOnce: true }));
  
  const existingData = snapshot.val();
  if (existingData) {
    if (!confirm(`Data untuk tanggal ${tanggalDisplay} sudah ada. Apakah Anda ingin menggantinya?`)) {
      showToast("Penyimpanan dibatalkan", 2000, 'info');
      return;
    }
    const existingKey = Object.keys(existingData)[0];
    await ref(db, `sisa_pengolahan/${existingKey}`).remove();
  }
  
  await push(sisaPengRef, { tanggalISO, tanggalDisplay, pokok, sayur, laukpauk, lauknabati, buah, createdAt: new Date().toISOString() });
  
  const total = pokok + sayur + laukpauk + lauknabati + buah;
  showToast(`✅ Sisa pengolahan ${total} kg untuk ${tanggalDisplay} tersimpan!`, 2000, 'success');
  
  ['pokok', 'sayur', 'laukpauk', 'lauknabati', 'buah'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '0';
  });
};

// ============================================================
// TAMPIL RIWAYAT
// ============================================================
window.tampilRiwayatSisa = function() {
  const selected = document.getElementById('dateSisa').value;
  if (!selected) {
    showToast("Pilih tanggal terlebih dahulu!", 2000, 'error');
    return;
  }
  
  const q = query(sisaPengRef, orderByChild('tanggalISO'), equalTo(selected));
  onValue(q, (snap) => {
    const data = snap.val() || {};
    const filtered = Object.values(data);
    const container = document.getElementById('listSisaPeng');
    
    if (filtered.length === 0) {
      container.innerHTML = `<div class="text-center py-8 text-slate-400"><i class="fas fa-inbox text-3xl mb-2 block"></i><p>Tidak ada data pada tanggal tersebut</p></div>`;
      return;
    }
    
    container.innerHTML = filtered.map(item => {
      const total = (item.pokok || 0) + (item.sayur || 0) + (item.laukpauk || 0) + (item.lauknabati || 0) + (item.buah || 0);
      return `
        <div class="border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-all">
          <div class="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <i class="fas fa-calendar-alt text-primary"></i>
              <span class="font-medium">${escapeHtml(item.tanggalDisplay)}</span>
            </div>
            <span class="badge badge-primary">Total: ${total} kg</span>
          </div>
          <div class="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div class="flex items-center gap-2"><i class="fas fa-utensils text-amber-500"></i> <span class="text-slate-500">Pokok:</span> <span class="font-semibold">${item.pokok || 0} kg</span></div>
            <div class="flex items-center gap-2"><i class="fas fa-carrot text-green-500"></i> <span class="text-slate-500">Sayur:</span> <span class="font-semibold">${item.sayur || 0} kg</span></div>
            <div class="flex items-center gap-2"><i class="fas fa-drumstick-bite text-red-500"></i> <span class="text-slate-500">Lauk Pauk:</span> <span class="font-semibold">${item.laukpauk || 0} kg</span></div>
            <div class="flex items-center gap-2"><i class="fas fa-seedling text-purple-500"></i> <span class="text-slate-500">Lauk Nabati:</span> <span class="font-semibold">${item.lauknabati || 0} kg</span></div>
            <div class="flex items-center gap-2"><i class="fas fa-apple-alt text-pink-500"></i> <span class="text-slate-500">Buah/Susu:</span> <span class="font-semibold">${item.buah || 0} kg</span></div>
          </div>
        </div>
      `;
    }).join('');
  }, { onlyOnce: true });
};