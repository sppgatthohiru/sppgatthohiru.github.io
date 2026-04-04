import { ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { db, absensiRef } from "./firebase-init.js";
import { daftarRelawan } from "./data.js";
import { showToast } from "./utils.js";

let currentAbsensiData = {};

export function loadAbsensiPage() {
  const today = new Date().toISOString().slice(0, 10);
  return `
    <style>
      .absensi-card {
        background: white;
        border-radius: 20px;
        padding: 24px;
        box-shadow: var(--card-shadow);
        margin-bottom: 24px;
      }
      
      .absensi-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--gray-100);
      }
      
      .absensi-header h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .absensi-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .absensi-controls label {
        font-weight: 500;
        color: var(--gray-600);
        margin: 0;
      }
      
      .absensi-controls input {
        width: auto;
        margin: 0;
        padding: 10px 14px;
        border: 1.5px solid var(--gray-200);
        border-radius: 12px;
        font-size: 14px;
      }
      
      .btn-muat {
        background: var(--primary);
        padding: 10px 20px;
        width: auto;
      }
      
      .btn-simpan {
        background: #22c55e;
        padding: 10px 20px;
        width: auto;
      }
      
      .btn-cari {
        background: var(--primary);
        padding: 10px 20px;
        width: auto;
      }
      
      /* 2 KOLOM */
      .relawan-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .relawan-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: var(--gray-50);
        border-radius: 12px;
        transition: all 0.2s;
        border: 1px solid var(--gray-100);
      }
      
      .relawan-item:hover {
        background: white;
        border-color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      
      .relawan-nama {
        font-weight: 500;
        font-size: 13px;
        color: var(--gray-700);
        flex: 1;
      }
      
      .relawan-status {
        display: flex;
        gap: 8px;
      }
      
      .status-label {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 20px;
        transition: all 0.2s;
        font-size: 12px;
      }
      
      .status-label input {
        margin: 0;
        width: auto;
        cursor: pointer;
      }
      
      .status-hadir {
        color: #22c55e;
      }
      
      .status-tidak {
        color: #ef4444;
      }
      
      .riwayat-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .riwayat-hadir {
        background: #f0fdf4;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #bbf7d0;
      }
      
      .riwayat-tidak {
        background: #fef2f2;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #fecaca;
      }
      
      .riwayat-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(0,0,0,0.08);
      }
      
      .riwayat-header h4 {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
      
      .riwayat-badge {
        background: white;
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .riwayat-list {
        max-height: 350px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .riwayat-item {
        padding: 8px 12px;
        background: white;
        border-radius: 8px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--gray-400);
        font-style: italic;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--gray-700);
      }
      
      .section-title i {
        color: var(--primary);
      }
      
      @media (max-width: 768px) {
        .relawan-grid {
          grid-template-columns: 1fr;
        }
        
        .riwayat-container {
          grid-template-columns: 1fr;
        }
        
        .absensi-header {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>
    
    <div class="absensi-card">
      <div class="absensi-header">
        <h2>
          <i class="fas fa-users" style="margin-right: 8px;"></i>
          Absensi Relawan
        </h2>
        <div class="absensi-controls">
          <label>📅 Tanggal:</label>
          <input type="date" id="tanggalAbsensi" value="${today}">
          <button onclick="window.loadAbsensiHariIni()" class="btn-muat">
            <i class="fas fa-sync-alt"></i> Muat Data
          </button>
          <button onclick="window.simpanSemuaAbsensi()" class="btn-simpan">
            <i class="fas fa-save"></i> Simpan Semua
          </button>
        </div>
      </div>
      <div id="daftarAbsensiChecklist"></div>
    </div>
    
    <div class="absensi-card">
      <div class="section-title">
        <i class="fas fa-history"></i>
        Riwayat Absensi
      </div>
      <div class="absensi-controls" style="margin-bottom: 20px;">
        <input type="date" id="dateAbsensi">
        <button onclick="window.tampilRiwayatAbsensi()" class="btn-cari">
          <i class="fas fa-search"></i> Tampilkan Data
        </button>
      </div>
      <div id="listAbsensi"></div>
    </div>
  `;
}

export function initAbsensi() {
  loadAbsensiHariIni();
}

window.loadAbsensiHariIni = function() {
  const tanggal = document.getElementById('tanggalAbsensi').value;
  if (!tanggal) return;
  
  onValue(absensiRef, (snap) => {
    const data = snap.val() || {};
    const existingAbsen = {};
    Object.values(data).forEach(item => {
      if (item.tanggalISO === tanggal) {
        existingAbsen[item.nama] = item.status;
      }
    });
    
    let html = '<div class="relawan-grid">';
    daftarRelawan.forEach(relawan => {
      const statusSekarang = existingAbsen[relawan] || 'Hadir';
      const isHadir = statusSekarang === 'Hadir';
      html += `
        <div class="relawan-item">
          <span class="relawan-nama">${relawan}</span>
          <div class="relawan-status">
            <label class="status-label status-hadir">
              <input type="radio" name="absen_${relawan.replace(/\s/g, '_')}" value="Hadir" data-relawan="${relawan}" ${isHadir ? 'checked' : ''}>
              <span>✅</span>
            </label>
            <label class="status-label status-tidak">
              <input type="radio" name="absen_${relawan.replace(/\s/g, '_')}" value="Tidak Hadir" data-relawan="${relawan}" ${!isHadir ? 'checked' : ''}>
              <span>❌</span>
            </label>
          </div>
        </div>
      `;
    });
    html += '</div>';
    document.getElementById('daftarAbsensiChecklist').innerHTML = html;
    currentAbsensiData = {...existingAbsen};
  });
};

window.simpanSemuaAbsensi = async function() {
  const tanggal = document.getElementById('tanggalAbsensi').value;
  if (!tanggal) {
    alert("Pilih tanggal terlebih dahulu!");
    return;
  }
  
  const absenBaru = {};
  
  daftarRelawan.forEach(relawan => {
    const radioHadir = document.querySelector(`input[data-relawan="${relawan}"][value="Hadir"]`);
    if (radioHadir && radioHadir.checked) {
      absenBaru[relawan] = 'Hadir';
    } else {
      absenBaru[relawan] = 'Tidak Hadir';
    }
  });
  
  const snapshot = await get(absensiRef);
  const data = snapshot.val() || {};
  
  const hapusPromises = [];
  Object.entries(data).forEach(([key, value]) => {
    if (value.tanggalISO === tanggal) {
      hapusPromises.push(set(ref(db, 'absensi/' + key), null));
    }
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
  showToast(`Absensi tanggal ${tanggal} berhasil disimpan!`);
};

window.tampilRiwayatAbsensi = function() {
  const selected = document.getElementById('dateAbsensi').value;
  if (!selected) {
    alert("Pilih tanggal terlebih dahulu!");
    return;
  }
  
  onValue(absensiRef, (snap) => {
    const data = snap.val() || {};
    const hadir = [];
    const tidakHadir = [];
    
    Object.values(data).forEach(item => {
      if (item.tanggalISO === selected) {
        if (item.status === 'Hadir') {
          hadir.push(item.nama);
        } else {
          tidakHadir.push(item.nama);
        }
      }
    });
    
    let html = `
      <div class="riwayat-container">
        <div class="riwayat-hadir">
          <div class="riwayat-header">
            <i class="fas fa-check-circle" style="color: #22c55e; font-size: 18px;"></i>
            <h4>Hadir</h4>
            <span class="riwayat-badge" style="background: #22c55e; color: white;">${hadir.length}</span>
          </div>
          <div class="riwayat-list">
            ${hadir.length > 0 ? hadir.map(nama => `<div class="riwayat-item"><i class="fas fa-user-check" style="color: #22c55e;"></i> ${nama}</div>`).join('') : '<div class="empty-state">Tidak ada yang hadir</div>'}
          </div>
        </div>
        <div class="riwayat-tidak">
          <div class="riwayat-header">
            <i class="fas fa-times-circle" style="color: #ef4444; font-size: 18px;"></i>
            <h4>Tidak Hadir</h4>
            <span class="riwayat-badge" style="background: #ef4444; color: white;">${tidakHadir.length}</span>
          </div>
          <div class="riwayat-list">
            ${tidakHadir.length > 0 ? tidakHadir.map(nama => `<div class="riwayat-item"><i class="fas fa-user-times" style="color: #ef4444;"></i> ${nama}</div>`).join('') : '<div class="empty-state">Semua hadir</div>'}
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('listAbsensi').innerHTML = html;
  });
};