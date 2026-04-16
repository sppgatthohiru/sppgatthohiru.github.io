// ============================================================
// ABSENSI.JS - Versi Simpel dengan Tombol "Masuk Semua" + PDF Profesional
// ============================================================
import { ref, onValue, push, set, get, remove } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, absensiRef } from "./firebase-init.js";
import { showToast, escapeHtml, escapeJsString } from "./utils.js";

const relawanRef = ref(db, 'relawanDivisi');
let daftarRelawanDivisi = {};

const urutanDivisi = [
  "Asisten Lapangan", "Admin Gudang", "CHEF", "Persiapan Bahan Pangan",
  "Pengolahan Bahan Pangan", "Pemorsian", "Distribusi", "Pencuci Alat Makan",
  "Petugas Kebersihan", "Keamanan"
];

// ============================================================
// LOAD PAGE HTML
// ============================================================
export function loadAbsensiPage() {
  const today = new Date().toISOString().slice(0, 10);
  
  return `
    <div class="space-y-8">
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Absensi Relawan</h1>
          <p class="text-slate-500 mt-1">Klik "Masuk Semua" lalu silang yang tidak hadir • Klik nama/divisi untuk edit</p>
        </div>
        <button onclick="window.tambahRelawanModal()" class="btn btn-primary btn-sm gap-2">
          <i class="fas fa-users-cog"></i> Kelola Relawan
        </button>
      </div>

      <!-- Filter Tanggal + Export PDF -->
      <div class="card bg-white shadow-xl border border-slate-200 rounded-3xl p-8">
        <div class="flex flex-wrap gap-6 items-end">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">Dari Tanggal</label>
            <input type="date" id="startDate" value="${today}" class="input input-bordered w-56">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-2">Sampai Tanggal</label>
            <input type="date" id="endDate" value="${today}" class="input input-bordered w-56">
          </div>
          
          <button onclick="window.loadAbsensiTabel()" class="btn btn-primary px-10 py-3">
            <i class="fas fa-table"></i> Tampilkan Tabel
          </button>

          <button onclick="window.exportToPDF()" 
                  class="btn btn-success px-8 py-3 gap-2 ml-auto">
            <i class="fas fa-file-pdf"></i> 
            <span class="font-medium">Export Laporan PDF</span>
          </button>
        </div>
      </div>

      <div class="card bg-white shadow-xl border border-slate-200 rounded-3xl overflow-hidden">
        <div class="card-body p-0">
          <div id="absensiTableContainer" class="overflow-x-auto"></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// INIT
// ============================================================
export function initAbsensi() {
  onValue(relawanRef, (snap) => {
    daftarRelawanDivisi = snap.val() || {};
  });
}

// ============================================================
// LOAD TABEL ABSENSI (SUDAH DIPERBAIKI)
// ============================================================
window.loadAbsensiTabel = async function() {
  const startStr = document.getElementById('startDate').value;
  const endStr = document.getElementById('endDate').value;

  if (!startStr || !endStr) {
    showToast("Silakan pilih tanggal mulai dan akhir", 2500, 'error');
    return;
  }

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const dates = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const snapshot = await get(absensiRef);
  const allAbsen = snapshot.val() || {};

  const absenMap = {};
  Object.values(allAbsen).forEach(item => {
    if (!absenMap[item.nama]) absenMap[item.nama] = {};
    absenMap[item.nama][item.tanggalISO] = item.status;
  });

  // Hitung total hadir
  const totalHadirPerTanggal = {};
  dates.forEach(tgl => totalHadirPerTanggal[tgl] = 0);

  Object.keys(daftarRelawanDivisi).forEach(divisi => {
    const anggota = daftarRelawanDivisi[divisi] || [];
    anggota.forEach(nama => {
      dates.forEach(tgl => {
        if (absenMap[nama]?.[tgl] === 'Hadir') totalHadirPerTanggal[tgl]++;
      });
    });
  });

  let html = `
    <table class="w-full border-collapse text-xs" id="absensiTable">
      <thead>
        <tr class="bg-slate-900 text-white">
          <th class="sticky left-0 bg-slate-900 z-30 px-4 py-3 text-left border-r w-8">No</th>
          <th class="sticky left-8 bg-slate-900 z-30 px-4 py-3 text-left border-r min-w-[190px]">Nama Relawan</th>
          <th class="sticky left-[210px] bg-slate-900 z-30 px-4 py-3 text-left border-r min-w-[150px]">Divisi</th>
    `;

  dates.forEach(date => {
    const d = new Date(date);
    const hari = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const formatted = d.getDate();

    html += `
      <th class="px-3 py-3 text-center border-r border-slate-700 font-medium min-w-[70px]">
        <div>${formatted}</div>
        <div class="text-[10px] opacity-75">${hari}</div>
        <div class="text-emerald-400 text-[10px] mt-1 font-bold">${totalHadirPerTanggal[date]}</div>
        <button onclick="window.markAllHadir('${date}')" 
                class="mt-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">
          Masuk Semua
        </button>
      </th>`;
  });

  html += `</tr></thead><tbody>`;

  let no = 1;

  urutanDivisi.forEach(divisi => {
    const anggota = daftarRelawanDivisi[divisi] || [];
    anggota.forEach(nama => {
      const safeNama = escapeJsString(nama);   // ← Perbaikan utama

      html += `
        <tr class="border-b hover:bg-slate-50">
          <td class="sticky left-0 bg-white px-4 py-4 border-r text-center text-slate-500">${no++}</td>
          
          <td onclick="window.editNama('${safeNama}', this)" 
              class="sticky left-8 bg-white px-4 py-4 border-r font-medium text-slate-700 text-sm cursor-pointer hover:bg-amber-50">
            ${escapeHtml(nama)}
          </td>
          
          <td onclick="window.editDivisi('${safeNama}', '${escapeJsString(divisi)}', this)" 
              class="sticky left-[210px] bg-white px-4 py-4 border-r text-slate-600 text-xs cursor-pointer hover:bg-amber-50">
            ${escapeHtml(divisi)}
          </td>
      `;

      dates.forEach(tgl => {
        const status = absenMap[nama] ? absenMap[nama][tgl] || '' : '';
        const isHadir = status === 'Hadir';
        const isTidak = status === 'Tidak Hadir';

        html += `
          <td onclick="window.toggleAbsen('${safeNama}', '${tgl}', this)" 
              class="px-4 py-5 text-xl text-center border-r border-slate-100 cursor-pointer transition-all hover:bg-slate-100 
                     ${isHadir ? 'bg-emerald-100' : isTidak ? 'bg-rose-100' : ''}">
            ${isHadir ? '✅' : isTidak ? '❌' : '○'}
          </td>`;
      });

      html += `</tr>`;
    });
  });

  html += `</tbody></table>`;

  document.getElementById('absensiTableContainer').innerHTML = html;
};

// ============================================================
// MASUK SEMUA untuk satu tanggal
// ============================================================
window.markAllHadir = async function(tanggal) {
  if (!confirm(`Tandai SEMUA relawan Hadir pada tanggal ${tanggal}?`)) return;

  const snapshot = await get(absensiRef);
  const data = snapshot.val() || {};

  Object.entries(data).forEach(([key, val]) => {
    if (val.tanggalISO === tanggal) {
      remove(ref(db, 'absensi/' + key));
    }
  });

  const promises = [];
  Object.keys(daftarRelawanDivisi).forEach(divisi => {
    const anggota = daftarRelawanDivisi[divisi] || [];
    anggota.forEach(nama => {
      promises.push(
        push(absensiRef, {
          tanggalISO: tanggal,
          tanggalDisplay: new Date(tanggal).toLocaleDateString('id-ID'),
          nama: nama,
          status: 'Hadir'
        })
      );
    });
  });

  await Promise.all(promises);
  showToast(`Semua relawan ditandai Hadir pada ${tanggal}`, 2000, 'success');
  window.loadAbsensiTabel();
};

// ============================================================
// TOGGLE ABSEN + AUTO SAVE (SUDAH DIPERBAIKI)
// ============================================================
window.toggleAbsen = async function(safeNama, tanggal, cell) {
  const nama = safeNama;                    // Tidak perlu decode lagi

  const current = cell.textContent.trim();
  let newStatus = '';

  if (current === '✅') newStatus = 'Tidak Hadir';
  else if (current === '❌') newStatus = '';
  else newStatus = 'Hadir';

  // Update tampilan
  if (newStatus === 'Hadir') {
    cell.innerHTML = '✅';
    cell.classList.add('bg-emerald-100');
    cell.classList.remove('bg-rose-100');
  } else if (newStatus === 'Tidak Hadir') {
    cell.innerHTML = '❌';
    cell.classList.add('bg-rose-100');
    cell.classList.remove('bg-emerald-100');
  } else {
    cell.innerHTML = '○';
    cell.classList.remove('bg-emerald-100', 'bg-rose-100');
  }

  // Auto Save
  const snapshot = await get(absensiRef);
  const data = snapshot.val() || {};

  Object.entries(data).forEach(([key, val]) => {
    if (val.nama === nama && val.tanggalISO === tanggal) {
      remove(ref(db, 'absensi/' + key));
    }
  });

  if (newStatus) {
    push(absensiRef, {
      tanggalISO: tanggal,
      tanggalDisplay: new Date(tanggal).toLocaleDateString('id-ID'),
      nama: nama,
      status: newStatus
    });
  }

  showToast(`Absensi ${nama} (${tanggal}) diperbarui`, 1000, 'success');
};

// ============================================================
// EDIT NAMA & DIVISI (SUDAH DIPERBAIKI)
// ============================================================
window.editNama = function(safeNama, cell) {
  const namaLama = safeNama;
  const namaBaru = prompt("Ganti nama relawan:", namaLama);
  if (!namaBaru || namaBaru.trim() === namaLama || namaBaru.trim() === "") return;

  const newName = namaBaru.trim();

  Object.keys(daftarRelawanDivisi).forEach(divisi => {
    const idx = daftarRelawanDivisi[divisi].indexOf(namaLama);
    if (idx !== -1) daftarRelawanDivisi[divisi][idx] = newName;
  });

  set(relawanRef, daftarRelawanDivisi);
  showToast(`Nama diubah menjadi ${newName}`, 2000, 'success');
  window.loadAbsensiTabel();
};

window.editDivisi = function(safeNama, divisiLama, cell) {
  const nama = safeNama;
  const divisiBaru = prompt(`Pindahkan "${nama}" ke divisi baru:`, divisiLama);
  if (!divisiBaru || divisiBaru.trim() === divisiLama || divisiBaru.trim() === "") return;

  const newDivisi = divisiBaru.trim();

  if (daftarRelawanDivisi[divisiLama]) {
    daftarRelawanDivisi[divisiLama] = daftarRelawanDivisi[divisiLama].filter(n => n !== nama);
    if (daftarRelawanDivisi[divisiLama].length === 0) delete daftarRelawanDivisi[divisiLama];
  }

  if (!daftarRelawanDivisi[newDivisi]) daftarRelawanDivisi[newDivisi] = [];
  if (!daftarRelawanDivisi[newDivisi].includes(nama)) {
    daftarRelawanDivisi[newDivisi].push(nama);
  }

  set(relawanRef, daftarRelawanDivisi);
  showToast(`Divisi ${nama} diubah ke ${newDivisi}`, 2000, 'success');
  window.loadAbsensiTabel();
};

// ============================================================
// MODAL KELOLA RELAWAN (SUDAH DIPERBAIKI)
// ============================================================
window.tambahRelawanModal = function() {
  const modalHTML = `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center mb-5">
          <h3 class="text-xl font-bold text-slate-800">Kelola Relawan & Divisi</h3>
          <button onclick="window.tutupModal()" class="text-3xl text-slate-400 hover:text-red-500 leading-none">×</button>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
          <input id="inputDivisi" type="text" class="input input-bordered w-full" placeholder="Nama Divisi">
          <input id="inputNama" type="text" class="input input-bordered w-full" placeholder="Nama Relawan">
        </div>

        <div class="flex gap-3 mb-6">
          <button onclick="window.tambahRelawan()" class="btn btn-primary flex-1">Tambah Relawan</button>
          <button onclick="window.tutupModal()" class="btn btn-ghost flex-1">Tutup</button>
        </div>

        <div class="flex-1 overflow-y-auto border border-slate-200 rounded-2xl p-4 bg-slate-50" id="listRelawanModal"></div>
      </div>
    </div>
  `;

  const modal = document.createElement('div');
  modal.innerHTML = modalHTML;
  document.body.appendChild(modal);

  window.tutupModal = () => modal.remove();
  setTimeout(() => window.renderListModal(), 100);
};

window.renderListModal = function() {
  const container = document.getElementById('listRelawanModal');
  if (!container) return;

  let html = `<div class="space-y-6">`;

  Object.keys(daftarRelawanDivisi).sort().forEach(divisi => {
    const anggota = daftarRelawanDivisi[divisi] || [];
    html += `
      <div>
        <div class="font-semibold px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700">
          ${escapeHtml(divisi)} (${anggota.length} orang)
        </div>
        <div class="mt-2 space-y-2 pl-1">
    `;

    anggota.forEach(nama => {
      const safeDivisi = escapeJsString(divisi);
      const safeNama = escapeJsString(nama);

      html += `
        <div class="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 hover:border-primary transition-colors">
          <span class="font-medium text-slate-700">${escapeHtml(nama)}</span>
          <div class="flex gap-2">
            <button onclick="window.pindahRelawan('${safeDivisi}','${safeNama}')" 
                    class="btn btn-xs btn-outline btn-primary">Pindah</button>
            <button onclick="window.hapusRelawan('${safeDivisi}','${safeNama}')" 
                    class="btn btn-xs btn-error">Hapus</button>
          </div>
        </div>`;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html || `<p class="text-center py-12 text-slate-400">Belum ada relawan.</p>`;
};

window.tambahRelawan = async function() {
  const divisi = document.getElementById('inputDivisi').value.trim();
  const nama = document.getElementById('inputNama').value.trim();

  if (!divisi || !nama) return showToast("Divisi dan Nama harus diisi!", 2000, 'error');

  if (!daftarRelawanDivisi[divisi]) daftarRelawanDivisi[divisi] = [];
  if (!daftarRelawanDivisi[divisi].includes(nama)) daftarRelawanDivisi[divisi].push(nama);

  await set(relawanRef, daftarRelawanDivisi);
  window.renderListModal();
  showToast(`✅ ${nama} ditambahkan`, 2000, 'success');
};

window.hapusRelawan = async function(divisi, nama) {
  if (!confirm(`Hapus ${nama} dari ${divisi}?`)) return;
  daftarRelawanDivisi[divisi] = daftarRelawanDivisi[divisi].filter(n => n !== nama);
  if (daftarRelawanDivisi[divisi].length === 0) delete daftarRelawanDivisi[divisi];
  await set(relawanRef, daftarRelawanDivisi);
  window.renderListModal();
  showToast(`🗑️ ${nama} dihapus`, 2000, 'success');
};

window.pindahRelawan = async function(divisiLama, nama) {
  const divisiBaru = prompt(`Pindahkan "${nama}" ke divisi apa?`, "");
  if (!divisiBaru || !divisiBaru.trim()) return;

  const newDiv = divisiBaru.trim();

  if (daftarRelawanDivisi[divisiLama]) {
    daftarRelawanDivisi[divisiLama] = daftarRelawanDivisi[divisiLama].filter(n => n !== nama);
    if (daftarRelawanDivisi[divisiLama].length === 0) delete daftarRelawanDivisi[divisiLama];
  }

  if (!daftarRelawanDivisi[newDiv]) daftarRelawanDivisi[newDiv] = [];
  if (!daftarRelawanDivisi[newDiv].includes(nama)) daftarRelawanDivisi[newDiv].push(nama);

  await set(relawanRef, daftarRelawanDivisi);
  window.renderListModal();
  showToast(`✅ ${nama} dipindahkan ke ${newDiv}`, 2500, 'success');
};

// ============================================================
// EXPORT TO PDF (Tidak berubah)
// ============================================================
window.exportToPDF = async function() {
  const startStr = document.getElementById('startDate').value;
  const endStr = document.getElementById('endDate').value;

  if (!startStr || !endStr) {
    showToast("Silakan tampilkan tabel terlebih dahulu atau pilih tanggal!", 2500, 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const title = "LAPORAN ABSENSI RELAWAN";
  const periode = `Periode: ${startStr} s/d ${endStr}`;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 85, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 45, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(periode, pageWidth / 2, 68, { align: "center" });

  const snapshot = await get(absensiRef);
  const allAbsen = snapshot.val() || {};
  const absenMap = {};
  Object.values(allAbsen).forEach(item => {
    if (!absenMap[item.nama]) absenMap[item.nama] = {};
    absenMap[item.nama][item.tanggalISO] = item.status;
  });

  const dates = [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const tableData = [];
  let grandTotalHadir = 0;
  let grandTotalTidakHadir = 0;

  Object.keys(daftarRelawanDivisi).forEach(divisi => {
    const anggota = daftarRelawanDivisi[divisi] || [];
    anggota.forEach(nama => {
      let row = [nama, divisi];
      let totalHadir = 0;
      let totalTidakHadir = 0;

      dates.forEach(tgl => {
        const status = absenMap[nama]?.[tgl] || 'Hadir';
        const isTidak = status === 'Tidak Hadir';

        row.push(isTidak ? 'TIDAK HADIR' : 'Hadir');

        if (isTidak) totalTidakHadir++;
        else totalHadir++;
      });

      row.push(totalHadir);
      row.push(totalTidakHadir);

      tableData.push(row);
      grandTotalHadir += totalHadir;
      grandTotalTidakHadir += totalTidakHadir;
    });
  });

  const columns = ["Nama Relawan", "Divisi", ...dates.map(d => d.slice(5)), "Total Hadir", "Total Tidak Hadir"];

  doc.autoTable({
    head: [columns],
    body: tableData,
    startY: 110,
    styles: { 
      fontSize: 9, 
      cellPadding: 5,
      lineColor: [226, 232, 240],
      lineWidth: 0.5
    },
    headStyles: { 
      fillColor: [15, 23, 42], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 110 },
      1: { halign: 'left', cellWidth: 85 }
    },
    margin: { top: 110, left: 30, right: 30 }
  });

  const finalY = doc.lastAutoTable.finalY + 35;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(30, finalY - 10, pageWidth - 30, finalY - 10);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("RINGKASAN KEHADIRAN", 30, finalY + 10);

  doc.setFontSize(10);
  doc.text(`Total Relawan          : ${tableData.length} orang`, 30, finalY + 30);
  doc.text(`Total Kehadiran        : ${grandTotalHadir} hari`, 30, finalY + 48);
  doc.text(`Total Ketidakhadiran   : ${grandTotalTidakHadir} hari`, 30, finalY + 66);

  const todayDate = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Dicetak pada: ${todayDate}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 30, { align: "right" });

  const filename = `Laporan_Absensi_Relawan_${startStr}_sd_${endStr}.pdf`;
  doc.save(filename);

  showToast("✅ Laporan PDF profesional berhasil di-download", 2500, 'success');
};