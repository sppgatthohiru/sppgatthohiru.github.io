// ============================================================
// SAMPAH-OMPRENG.JS - Halaman Sampah Ompreng (Spreadsheet View)
// ============================================================
import { push, onValue, ref, query, orderByChild, startAt, endAt, remove, set } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, omprengRef } from "./firebase-init.js";
import { showToast, escapeHtml } from "./utils.js";
import { initAuthGuard } from './auth-guard.js';

async function initializePage() {
  const isLoggedIn = await initAuthGuard();
  if (!isLoggedIn) return;
}

// ============================================================
// LOAD PAGE HTML
// ============================================================
export function loadSampahOmprengPage() {
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const firstDay = currentMonth + '-01';
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);

  return `
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gradient">Sampah Ompreng</h1>
          <p class="text-slate-500 mt-1">Catat & pantau sampah makanan dari sisa konsumsi</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button onclick="window.bukaModalExportOmpreng()" class="btn btn-success gap-2">
            <i class="fas fa-file-excel"></i> Export Laporan
          </button>
        </div>
      </div>

      <!-- Navigator Bulan -->
      <div class="card bg-white shadow-md border border-slate-100">
        <div class="card-body p-4">
          <div class="flex flex-wrap items-center gap-3 justify-between">
            <div class="flex items-center gap-2">
              <button onclick="window.navigasiSpreadsheetOmpreng(-1)" class="btn btn-sm btn-ghost">
                <i class="fas fa-chevron-left"></i>
              </button>
              <span id="judulBulanOmpreng" class="font-semibold text-slate-700 text-base min-w-[140px] text-center"></span>
              <button onclick="window.navigasiSpreadsheetOmpreng(1)" class="btn btn-sm btn-ghost">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-slate-500">Lompat ke bulan:</label>
              <input type="month" id="monthPickerOmpreng" value="${currentMonth}" class="input input-bordered input-sm w-auto"
                onchange="window.pindahBulanOmpreng(this.value)">
            </div>
            <div class="flex gap-2">
              <div class="badge badge-outline gap-1"><i class="fas fa-check-circle text-success"></i> <span id="totalHariTerisiOm">0</span> hari terisi</div>
              <div class="badge badge-outline gap-1"><i class="fas fa-circle-notch text-warning"></i> <span id="totalHariKosongOm">0</span> hari kosong</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spreadsheet Table -->
      <div class="card bg-white shadow-md border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-sm w-full" id="tabelSpreadsheetOmpreng">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-slate-600 font-semibold text-center w-12">#</th>
                <th class="text-slate-600 font-semibold w-36">Tanggal</th>
                <th class="text-slate-600 font-semibold text-center">
                  <div class="flex items-center justify-center gap-1">
                    <i class="fas fa-utensils text-amber-500 text-xs"></i> Pokok (kg)
                  </div>
                </th>
                <th class="text-slate-600 font-semibold text-center">
                  <div class="flex items-center justify-center gap-1">
                    <i class="fas fa-carrot text-green-500 text-xs"></i> Sayur (kg)
                  </div>
                </th>
                <th class="text-slate-600 font-semibold text-center">
                  <div class="flex items-center justify-center gap-1">
                    <i class="fas fa-drumstick-bite text-red-500 text-xs"></i> Lauk Pauk (kg)
                  </div>
                </th>
                <th class="text-slate-600 font-semibold text-center">
                  <div class="flex items-center justify-center gap-1">
                    <i class="fas fa-seedling text-purple-500 text-xs"></i> Lauk Nabati (kg)
                  </div>
                </th>
                <th class="text-slate-600 font-semibold text-center">
                  <div class="flex items-center justify-center gap-1">
                    <i class="fas fa-apple-alt text-pink-500 text-xs"></i> Buah/Susu (kg)
                  </div>
                </th>
                <th class="text-slate-600 font-semibold text-center">Total (kg)</th>
                <th class="text-slate-600 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody id="bodySpreadsheetOmpreng">
              <tr>
                <td colspan="9" class="text-center py-12 text-slate-400">
                  <i class="fas fa-spinner fa-spin text-2xl block mb-2"></i>
                  Memuat data...
                </td>
              </tr>
            </tbody>
            <!-- Footer Total -->
            <tfoot>
              <tr class="bg-slate-50 border-t-2 border-slate-300 font-semibold" id="footerSpreadsheetOmpreng">
                <td colspan="2" class="text-slate-700 px-4 py-2">TOTAL BULAN</td>
                <td class="text-center text-slate-700" id="ftPokokOm">-</td>
                <td class="text-center text-slate-700" id="ftSayurOm">-</td>
                <td class="text-center text-slate-700" id="ftLaukPaukOm">-</td>
                <td class="text-center text-slate-700" id="ftLaukNabatiOm">-</td>
                <td class="text-center text-slate-700" id="ftBuahOm">-</td>
                <td class="text-center text-primary font-bold" id="ftTotalOm">-</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- MODAL EDIT / TAMBAH -->
    <!-- ============================================================ -->
    <dialog id="modalEditOmpreng" class="modal">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick="document.getElementById('modalEditOmpreng').close()">✕</button>
        <h3 class="font-bold text-lg mb-1 flex items-center gap-2">
          <i class="fas fa-trash-alt text-orange-500"></i>
          <span id="modalEditJudulOm">Input Sampah Ompreng</span>
        </h3>
        <p class="text-sm text-slate-500 mb-4" id="modalEditTanggalDisplayOm"></p>
        <input type="hidden" id="modalEditFirebaseKeyOm">
        <input type="hidden" id="modalEditTanggalISOOm">
        
        <div class="grid grid-cols-1 gap-3">
          <div class="form-control">
            <label class="label"><span class="label-text text-xs flex items-center gap-1"><i class="fas fa-utensils text-amber-500"></i> Makanan Pokok (kg)</span></label>
            <input type="number" id="editPokokOm" step="0.1" min="0" value="0" class="input input-bordered input-sm focus:border-orange-500">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text text-xs flex items-center gap-1"><i class="fas fa-carrot text-green-500"></i> Sayur (kg)</span></label>
            <input type="number" id="editSayurOm" step="0.1" min="0" value="0" class="input input-bordered input-sm focus:border-orange-500">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text text-xs flex items-center gap-1"><i class="fas fa-drumstick-bite text-red-500"></i> Lauk Pauk (kg)</span></label>
            <input type="number" id="editLaukpaukOm" step="0.1" min="0" value="0" class="input input-bordered input-sm focus:border-orange-500">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text text-xs flex items-center gap-1"><i class="fas fa-seedling text-purple-500"></i> Lauk Nabati (kg)</span></label>
            <input type="number" id="editLauknabatiOm" step="0.1" min="0" value="0" class="input input-bordered input-sm focus:border-orange-500">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text text-xs flex items-center gap-1"><i class="fas fa-apple-alt text-pink-500"></i> Buah / Susu (kg)</span></label>
            <input type="number" id="editBuahOm" step="0.1" min="0" value="0" class="input input-bordered input-sm focus:border-orange-500">
          </div>
        </div>

        <div class="modal-action mt-4 pt-4 border-t border-slate-100">
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('modalEditOmpreng').close()">Batal</button>
          <button class="btn btn-warning btn-sm" onclick="window.simpanDataOmprengModal()">
            <i class="fas fa-save"></i> Simpan
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- ============================================================ -->
    <!-- MODAL EXPORT -->
    <!-- ============================================================ -->
    <dialog id="modalExportOmpreng" class="modal">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick="document.getElementById('modalExportOmpreng').close()">✕</button>
        <h3 class="font-bold text-lg mb-1 flex items-center gap-2">
          <i class="fas fa-file-export text-success"></i> Export Laporan Sampah Ompreng
        </h3>
        <p class="text-sm text-slate-500 mb-5">Pilih rentang tanggal untuk laporan yang akan diekspor.</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label"><span class="label-text text-xs">Dari Tanggal</span></label>
            <input type="date" id="exportDariTglOm" class="input input-bordered input-sm" value="${firstDay}">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text text-xs">Sampai Tanggal</span></label>
            <input type="date" id="exportSampaiTglOm" class="input input-bordered input-sm" value="${today}">
          </div>
        </div>
        <div class="mt-4">
          <label class="label"><span class="label-text text-xs font-semibold">Format Export</span></label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="formatExportOm" value="csv" class="radio radio-sm radio-primary" checked>
              <span class="text-sm"><i class="fas fa-file-csv text-green-600"></i> CSV</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="formatExportOm" value="print" class="radio radio-sm radio-primary">
              <span class="text-sm"><i class="fas fa-print text-blue-600"></i> Print / PDF</span>
            </label>
          </div>
        </div>
        <div class="modal-action mt-5 pt-4 border-t border-slate-100">
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('modalExportOmpreng').close()">Batal</button>
          <button class="btn btn-success btn-sm" onclick="window.prosesExportOmpreng()">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  `;
}

// ============================================================
// STATE
// ============================================================
let _currentYearOm = new Date().getFullYear();
let _currentMonthOm = new Date().getMonth();
let _dataCacheOm = {};

// ============================================================
// INIT
// ============================================================
export function initSampahOmpreng() {
  window.navigasiSpreadsheetOmpreng = navigasiSpreadsheetOmpreng;
  window.pindahBulanOmpreng = pindahBulanOmpreng;
  window.bukaModalEditOmpreng = bukaModalEditOmpreng;
  window.simpanDataOmprengModal = simpanDataOmprengModal;
  window.hapusDataOmpreng = hapusDataOmpreng;
  window.bukaModalExportOmpreng = bukaModalExportOmpreng;
  window.prosesExportOmpreng = prosesExportOmpreng;

  muatBulanOmpreng(_currentYearOm, _currentMonthOm);
}

// ============================================================
// NAVIGASI
// ============================================================
function navigasiSpreadsheetOmpreng(arah) {
  _currentMonthOm += arah;
  if (_currentMonthOm > 11) { _currentMonthOm = 0; _currentYearOm++; }
  if (_currentMonthOm < 0) { _currentMonthOm = 11; _currentYearOm--; }
  
  const monthStr = `${_currentYearOm}-${String(_currentMonthOm + 1).padStart(2, '0')}`;
  const picker = document.getElementById('monthPickerOmpreng');
  if (picker) picker.value = monthStr;
  
  muatBulanOmpreng(_currentYearOm, _currentMonthOm);
}

function pindahBulanOmpreng(val) {
  if (!val) return;
  const [y, m] = val.split('-').map(Number);
  _currentYearOm = y;
  _currentMonthOm = m - 1;
  muatBulanOmpreng(_currentYearOm, _currentMonthOm);
}

// ============================================================
// MUAT DATA
// ============================================================
function muatBulanOmpreng(year, month) {
  const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const judulEl = document.getElementById('judulBulanOmpreng');
  if (judulEl) judulEl.textContent = `${NAMA_BULAN[month]} ${year}`;

  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  const body = document.getElementById('bodySpreadsheetOmpreng');
  if (body) body.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400"><i class="fas fa-spinner fa-spin text-2xl block mb-2"></i>Memuat data...</td></tr>`;

  const q = query(omprengRef, orderByChild('tanggalISO'), startAt(firstDay), endAt(lastDay));
  onValue(q, (snap) => {
    _dataCacheOm = {};
    const rawData = snap.val() || {};
    Object.entries(rawData).forEach(([key, val]) => {
      _dataCacheOm[val.tanggalISO] = { key, ...val };
    });
    renderSpreadsheetOmpreng(year, month);
  }, { onlyOnce: true });
}

// ============================================================
// RENDER SPREADSHEET
// ============================================================
function renderSpreadsheetOmpreng(year, month) {
  const NAMA_HARI = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const NAMA_BULAN_PENDEK = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const jumlahHari = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const body = document.getElementById('bodySpreadsheetOmpreng');
  if (!body) return;

  let rows = '';
  let totalPokok = 0, totalSayur = 0, totalLaukPauk = 0, totalLaukNabati = 0, totalBuah = 0;
  let hariTerisi = 0, hariKosong = 0;

  for (let d = 1; d <= jumlahHari; d++) {
    const tglISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(tglISO + 'T00:00:00');
    const hariIdx = dateObj.getDay();
    const namaHari = NAMA_HARI[hariIdx];
    const isMinggu = hariIdx === 0;
    const isSabtu = hariIdx === 6;
    const isToday = tglISO === today;

    const data = _dataCacheOm[tglISO];
    const adaData = !!data;

    if (adaData) hariTerisi++;
    else hariKosong++;

    if (adaData) {
      totalPokok += data.pokok || 0;
      totalSayur += data.sayur || 0;
      totalLaukPauk += data.laukpauk || 0;
      totalLaukNabati += data.lauknabati || 0;
      totalBuah += data.buah || 0;
    }

    const total = adaData 
      ? (data.pokok||0) + (data.sayur||0) + (data.laukpauk||0) + (data.lauknabati||0) + (data.buah||0) 
      : 0;

    const rowBg = isToday ? 'bg-orange-50 border-l-4 border-l-orange-500' 
                 : isMinggu ? 'bg-red-50' 
                 : isSabtu ? 'bg-orange-50' 
                 : 'hover:bg-slate-50';

    const tglDisplay = `${String(d).padStart(2,'0')} ${NAMA_BULAN_PENDEK[month]} ${year}`;

    rows += `
      <tr class="border-b border-slate-100 transition-colors ${rowBg}" data-tgl="${tglISO}">
        <td class="text-center text-xs font-mono text-slate-400 select-none">${d}</td>
        <td class="py-2">
          <div class="flex items-center gap-2">
            <span class="badge badge-sm ${isMinggu ? 'badge-error' : isSabtu ? 'badge-warning' : 'badge-ghost'} font-mono text-xs">${namaHari}</span>
            <span class="text-sm ${isToday ? 'font-bold text-orange-600' : 'text-slate-700'}">${tglDisplay}</span>
            ${isToday ? '<span class="badge badge-xs badge-warning">Hari ini</span>' : ''}
          </div>
        </td>
        ${adaData ? `
          <td class="text-center text-sm font-mono">${(data.pokok || 0).toFixed(1)}</td>
          <td class="text-center text-sm font-mono">${(data.sayur || 0).toFixed(1)}</td>
          <td class="text-center text-sm font-mono">${(data.laukpauk || 0).toFixed(1)}</td>
          <td class="text-center text-sm font-mono">${(data.lauknabati || 0).toFixed(1)}</td>
          <td class="text-center text-sm font-mono">${(data.buah || 0).toFixed(1)}</td>
          <td class="text-center">
            <span class="badge badge-warning badge-sm font-mono">${total.toFixed(1)}</span>
          </td>
          <td class="text-center">
            <div class="flex items-center justify-center gap-1">
              <button title="Edit" onclick="window.bukaModalEditOmpreng('${tglISO}', '${tglDisplay}', '${data.key}')"
                class="btn btn-xs btn-ghost text-orange-600">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <button title="Hapus" onclick="window.hapusDataOmpreng('${tglISO}', '${tglDisplay}', '${data.key}')"
                class="btn btn-xs btn-ghost text-error">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        ` : `
          <td class="text-center text-slate-300 text-xs" colspan="6">— belum ada data —</td>
          <td class="text-center">
            <button title="Tambah" onclick="window.bukaModalEditOmpreng('${tglISO}', '${tglDisplay}', null)"
              class="btn btn-xs btn-ghost text-slate-400 hover:text-orange-600">
              <i class="fas fa-plus-circle"></i>
            </button>
          </td>
        `}
      </tr>
    `;
  }

  body.innerHTML = rows;

  // Update Footer
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val.toFixed(1); };
  set('ftPokokOm', totalPokok);
  set('ftSayurOm', totalSayur);
  set('ftLaukPaukOm', totalLaukPauk);
  set('ftLaukNabatiOm', totalLaukNabati);
  set('ftBuahOm', totalBuah);
  set('ftTotalOm', totalPokok + totalSayur + totalLaukPauk + totalLaukNabati + totalBuah);

  document.getElementById('totalHariTerisiOm').textContent = hariTerisi;
  document.getElementById('totalHariKosongOm').textContent = hariKosong;
}

// ============================================================
// MODAL CRUD
// ============================================================
window.bukaModalEditOmpreng = function(tglISO, tglDisplay, firebaseKey) {
  document.getElementById('modalEditTanggalISOOm').value = tglISO;
  document.getElementById('modalEditFirebaseKeyOm').value = firebaseKey || '';
  document.getElementById('modalEditTanggalDisplayOm').textContent = tglDisplay;
  document.getElementById('modalEditJudulOm').textContent = firebaseKey ? 'Edit Sampah Ompreng' : 'Tambah Sampah Ompreng';

  const data = _dataCacheOm[tglISO];
  document.getElementById('editPokokOm').value = data?.pokok ?? 0;
  document.getElementById('editSayurOm').value = data?.sayur ?? 0;
  document.getElementById('editLaukpaukOm').value = data?.laukpauk ?? 0;
  document.getElementById('editLauknabatiOm').value = data?.lauknabati ?? 0;
  document.getElementById('editBuahOm').value = data?.buah ?? 0;

  document.getElementById('modalEditOmpreng').showModal();
};

window.simpanDataOmprengModal = async function() {
  const tglISO = document.getElementById('modalEditTanggalISOOm').value;
  const firebaseKey = document.getElementById('modalEditFirebaseKeyOm').value;

  const pokok = parseFloat(document.getElementById('editPokokOm').value) || 0;
  const sayur = parseFloat(document.getElementById('editSayurOm').value) || 0;
  const laukpauk = parseFloat(document.getElementById('editLaukpaukOm').value) || 0;
  const lauknabati = parseFloat(document.getElementById('editLauknabatiOm').value) || 0;
  const buah = parseFloat(document.getElementById('editBuahOm').value) || 0;

  const tanggalDisplay = new Date(tglISO + 'T00:00:00').toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const payload = { 
    tanggalISO: tglISO, 
    tanggalDisplay, 
    pokok, sayur, laukpauk, lauknabati, buah, 
    updatedAt: new Date().toISOString() 
  };

  try {
    if (firebaseKey) {
      await set(ref(db, `sampah_ompreng/${firebaseKey}`), { 
        ...payload, 
        createdAt: _dataCacheOm[tglISO]?.createdAt || new Date().toISOString() 
      });
    } else {
      await push(omprengRef, { ...payload, createdAt: new Date().toISOString() });
    }

    document.getElementById('modalEditOmpreng').close();
    showToast('✅ Data sampah ompreng berhasil disimpan!', 2000, 'success');
    muatBulanOmpreng(_currentYearOm, _currentMonthOm);
  } catch (err) {
    showToast('❌ Gagal menyimpan: ' + err.message, 3000, 'error');
  }
};

window.hapusDataOmpreng = async function(tglISO, tglDisplay, firebaseKey) {
  if (!confirm(`Hapus data sampah ompreng untuk ${tglDisplay}?`)) return;
  try {
    await remove(ref(db, `sampah_ompreng/${firebaseKey}`));
    showToast('🗑️ Data berhasil dihapus!', 2000, 'info');
    muatBulanOmpreng(_currentYearOm, _currentMonthOm);
  } catch (err) {
    showToast('❌ Gagal menghapus: ' + err.message, 3000, 'error');
  }
};

// ============================================================
// EXPORT
// ============================================================
window.bukaModalExportOmpreng = function() {
  document.getElementById('modalExportOmpreng').showModal();
};

window.prosesExportOmpreng = async function() {
  const dari = document.getElementById('exportDariTglOm').value;
  const sampai = document.getElementById('exportSampaiTglOm').value;
  const format = document.querySelector('input[name="formatExportOm"]:checked')?.value || 'csv';

  if (!dari || !sampai) {
    showToast('Pilih rentang tanggal!', 2000, 'error');
    return;
  }
  if (dari > sampai) {
    showToast('Tanggal awal tidak boleh lebih besar dari tanggal akhir!', 2500, 'error');
    return;
  }

  showToast('⏳ Mengambil data...', 1500, 'info');

  const q = query(omprengRef, orderByChild('tanggalISO'), startAt(dari), endAt(sampai));
  const snap = await new Promise((res) => onValue(q, res, { onlyOnce: true }));
  const rows = Object.values(snap.val() || {}).sort((a, b) => a.tanggalISO.localeCompare(b.tanggalISO));

  if (rows.length === 0) {
    showToast('Tidak ada data pada rentang tanggal tersebut!', 2500, 'warning');
    return;
  }

  document.getElementById('modalExportOmpreng').close();

  if (format === 'csv') {
    exportCSVOmpreng(rows, dari, sampai);
  } else {
    exportPrintOmpreng(rows, dari, sampai);
  }
};

// ============================================================
// EXPORT CSV
// ============================================================
function exportCSVOmpreng(rows, dari, sampai) {
  const headers = ['Tanggal', 'Makanan Pokok (kg)', 'Sayur (kg)', 'Lauk Pauk (kg)', 'Lauk Nabati (kg)', 'Buah/Susu (kg)', 'Total (kg)'];
  const csvRows = [headers.join(',')];
  let grandTotal = 0;

  rows.forEach(item => {
    const total = (item.pokok||0)+(item.sayur||0)+(item.laukpauk||0)+(item.lauknabati||0)+(item.buah||0);
    grandTotal += total;
    csvRows.push([
      item.tanggalDisplay,
      (item.pokok||0).toFixed(1),
      (item.sayur||0).toFixed(1),
      (item.laukpauk||0).toFixed(1),
      (item.lauknabati||0).toFixed(1),
      (item.buah||0).toFixed(1),
      total.toFixed(1)
    ].join(','));
  });

  const tPokok = rows.reduce((s,r)=>s+(r.pokok||0),0);
  const tSayur = rows.reduce((s,r)=>s+(r.sayur||0),0);
  const tLaukPauk = rows.reduce((s,r)=>s+(r.laukpauk||0),0);
  const tLaukNab = rows.reduce((s,r)=>s+(r.lauknabati||0),0);
  const tBuah = rows.reduce((s,r)=>s+(r.buah||0),0);

  csvRows.push(['TOTAL', tPokok.toFixed(1), tSayur.toFixed(1), tLaukPauk.toFixed(1), tLaukNab.toFixed(1), tBuah.toFixed(1), grandTotal.toFixed(1)].join(','));

  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Sampah_Ompreng_${dari}_sd_${sampai}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ CSV berhasil diunduh!', 2000, 'success');
}

// ============================================================
// EXPORT PRINT (LENGKAP)
// ============================================================
function exportPrintOmpreng(rows, dari, sampai) {
  const tPokok = rows.reduce((s,r)=>s+(r.pokok||0),0);
  const tSayur = rows.reduce((s,r)=>s+(r.sayur||0),0);
  const tLaukPauk = rows.reduce((s,r)=>s+(r.laukpauk||0),0);
  const tLaukNab = rows.reduce((s,r)=>s+(r.lauknabati||0),0);
  const tBuah = rows.reduce((s,r)=>s+(r.buah||0),0);
  const grandTotal = tPokok + tSayur + tLaukPauk + tLaukNab + tBuah;

  const dariDisp = new Date(dari+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const sampaiDisp = new Date(sampai+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const cetakPada = new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});

  const tableRows = rows.map((item, i) => {
    const total = (item.pokok||0)+(item.sayur||0)+(item.laukpauk||0)+(item.lauknabati||0)+(item.buah||0);
    return `<tr>
      <td style="text-align:center">${i+1}</td>
      <td>${item.tanggalDisplay}</td>
      <td style="text-align:center">${(item.pokok||0).toFixed(1)}</td>
      <td style="text-align:center">${(item.sayur||0).toFixed(1)}</td>
      <td style="text-align:center">${(item.laukpauk||0).toFixed(1)}</td>
      <td style="text-align:center">${(item.lauknabati||0).toFixed(1)}</td>
      <td style="text-align:center">${(item.buah||0).toFixed(1)}</td>
      <td style="text-align:center;font-weight:bold">${total.toFixed(1)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Sampah Ompreng</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #333; }
  h2 { text-align: center; font-size: 16px; margin-bottom: 4px; }
  .sub { text-align: center; color: #666; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #f97316; color: white; padding: 8px 6px; text-align: center; font-size: 11px; }
  td { padding: 6px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) td { background: #fffaf0; }
  tfoot td { background: #f97316; color: white; font-weight: bold; text-align: center; padding: 8px; }
  .cetak { text-align: right; font-size: 10px; color: #999; margin-top: 12px; }
  @media print { button { display:none; } }
</style>
</head>
<body>
  <h2>LAPORAN SAMPAH OMPRENG</h2>
  <div class="sub">Periode: ${dariDisp} s/d ${sampaiDisp}</div>
  <table>
    <thead>
      <tr>
        <th>No</th><th>Tanggal</th><th>Pokok (kg)</th><th>Sayur (kg)</th>
        <th>Lauk Pauk (kg)</th><th>Lauk Nabati (kg)</th><th>Buah/Susu (kg)</th><th>Total (kg)</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2">TOTAL</td>
        <td>${tPokok.toFixed(1)}</td>
        <td>${tSayur.toFixed(1)}</td>
        <td>${tLaukPauk.toFixed(1)}</td>
        <td>${tLaukNab.toFixed(1)}</td>
        <td>${tBuah.toFixed(1)}</td>
        <td>${grandTotal.toFixed(1)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="cetak">Dicetak pada: ${cetakPada}</div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}