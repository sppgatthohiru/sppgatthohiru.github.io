import { push, onValue, ref, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { sisaPengRef } from "./firebase-init.js";
import { getTodayISO, showToast } from "./utils.js";

export function loadSisaPengolahanPage() {
  const today = getTodayISO();
  return `
    <style>
      .sisa-container {
        max-width: 800px;
        margin: 0 auto;
      }
      
      .sisa-card {
        background: white;
        border-radius: 24px;
        padding: 28px;
        box-shadow: var(--card-shadow);
        margin-bottom: 28px;
        border: 1px solid rgba(0,0,0,0.05);
      }
      
      .sisa-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--gray-100);
      }
      
      .sisa-header h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .sisa-header i {
        font-size: 28px;
        color: var(--primary);
      }
      
      .info-banner {
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        border-radius: 16px;
        padding: 12px 20px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #0369a1;
      }
      
      .info-banner i {
        font-size: 20px;
      }
      
      .input-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 28px;
      }
      
      .input-item {
        background: var(--gray-50);
        border-radius: 16px;
        padding: 16px;
        transition: all 0.2s;
        border: 1px solid var(--gray-100);
      }
      
      .input-item:hover {
        background: white;
        border-color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      
      .input-label {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        font-weight: 600;
        color: var(--gray-700);
      }
      
      .input-label i {
        font-size: 20px;
        width: 28px;
      }
      
      .input-label span {
        font-size: 14px;
      }
      
      .input-item input {
        width: 100%;
        padding: 12px 16px;
        border: 1.5px solid var(--gray-200);
        border-radius: 12px;
        font-size: 15px;
        transition: all 0.2s;
        background: white;
      }
      
      .input-item input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
      }
      
      .btn-simpan {
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        padding: 14px 28px;
        width: 100%;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      
      .btn-simpan:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3);
      }
      
      .riwayat-card {
        background: white;
        border-radius: 24px;
        padding: 24px;
        box-shadow: var(--card-shadow);
        border: 1px solid rgba(0,0,0,0.05);
      }
      
      .riwayat-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid var(--gray-100);
      }
      
      .riwayat-header h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--gray-700);
      }
      
      .riwayat-header i {
        font-size: 22px;
        color: var(--primary);
      }
      
      .riwayat-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      
      .riwayat-controls label {
        font-weight: 500;
        color: var(--gray-600);
      }
      
      .riwayat-controls input {
        width: auto;
        padding: 10px 14px;
        border: 1.5px solid var(--gray-200);
        border-radius: 12px;
        font-size: 14px;
      }
      
      .btn-cari {
        background: var(--primary);
        padding: 10px 24px;
        width: auto;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .data-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .data-item {
        background: var(--gray-50);
        border-radius: 16px;
        padding: 20px;
        transition: all 0.2s;
        border: 1px solid var(--gray-100);
      }
      
      .data-item:hover {
        background: white;
        border-color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      
      .data-date {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--gray-200);
      }
      
      .data-date i {
        color: var(--primary);
        font-size: 16px;
      }
      
      .data-date strong {
        font-size: 15px;
        color: var(--gray-700);
      }
      
      .data-details {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      
      .data-detail {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
      }
      
      .data-detail i {
        width: 24px;
        font-size: 16px;
      }
      
      .data-detail .label {
        color: var(--gray-500);
      }
      
      .data-detail .value {
        font-weight: 600;
        color: var(--gray-700);
      }
      
      .empty-data {
        text-align: center;
        padding: 40px;
        color: var(--gray-400);
        font-style: italic;
      }
      
      @media (max-width: 768px) {
        .input-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .data-details {
          grid-template-columns: 1fr;
        }
        
        .sisa-card {
          padding: 20px;
        }
      }
    </style>
    
    <div class="sisa-container">
      <!-- Form Input -->
      <div class="sisa-card">
        <div class="sisa-header">
          <i class="fas fa-recycle"></i>
          <h2>Input Sisa Pengolahan</h2>
        </div>
        
        <div class="info-banner">
          <i class="fas fa-calendar-day"></i>
          <span>Menyimpan data untuk tanggal: <strong id="currentDateDisplay"></strong></span>
        </div>
        
        <div class="input-grid">
          <div class="input-item">
            <div class="input-label">
              <i class="fas fa-utensils" style="color: #f59e0b;"></i>
              <span>Makanan Pokok</span>
            </div>
            <input type="number" id="pokok" step="0.1" placeholder="0 kg" value="0">
          </div>
          
          <div class="input-item">
            <div class="input-label">
              <i class="fas fa-carrot" style="color: #22c55e;"></i>
              <span>Sayur</span>
            </div>
            <input type="number" id="sayur" step="0.1" placeholder="0 kg" value="0">
          </div>
          
          <div class="input-item">
            <div class="input-label">
              <i class="fas fa-drumstick-bite" style="color: #ef4444;"></i>
              <span>Lauk Pauk</span>
            </div>
            <input type="number" id="laukpauk" step="0.1" placeholder="0 kg" value="0">
          </div>
          
          <div class="input-item">
            <div class="input-label">
              <i class="fas fa-seedling" style="color: #8b5cf6;"></i>
              <span>Lauk Nabati</span>
            </div>
            <input type="number" id="lauknabati" step="0.1" placeholder="0 kg" value="0">
          </div>
          
          <div class="input-item">
            <div class="input-label">
              <i class="fas fa-apple-alt" style="color: #ec4899;"></i>
              <span>Buah / Susu</span>
            </div>
            <input type="number" id="buah" step="0.1" placeholder="0 kg" value="0">
          </div>
        </div>
        
        <button onclick="window.simpanSisaPengolahan()" class="btn-simpan">
          <i class="fas fa-save"></i> Simpan Sisa Pengolahan Hari Ini
        </button>
      </div>
      
      <!-- Riwayat -->
      <div class="riwayat-card">
        <div class="riwayat-header">
          <i class="fas fa-history"></i>
          <h3>Riwayat Sisa Pengolahan</h3>
        </div>
        
        <div class="riwayat-controls">
          <label>📅 Pilih Tanggal:</label>
          <input type="date" id="dateSisa" value="${today}">
          <button onclick="window.tampilRiwayatSisa()" class="btn-cari">
            <i class="fas fa-search"></i> Tampilkan Data
          </button>
        </div>
        
        <div id="listSisaPeng" class="data-list"></div>
      </div>
    </div>
  `;
}

// Fungsi untuk mendapatkan tanggal lokal dengan benar
function getLocalDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fungsi untuk mendapatkan format tanggal Indonesia
function getLocalDateDisplay() {
  const now = new Date();
  return now.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Tampilkan tanggal saat ini saat halaman dimuat
setTimeout(() => {
  const dateDisplay = document.getElementById('currentDateDisplay');
  if (dateDisplay) {
    dateDisplay.textContent = getLocalDateDisplay();
  }
}, 100);

window.simpanSisaPengolahan = async function() {
  // Gunakan tanggal dari komputer user (bukan hardcoded)
  const tanggalISO = getLocalDateISO();
  const tanggalDisplay = getLocalDateDisplay();
  
  const pokok = parseFloat(document.getElementById('pokok').value) || 0;
  const sayur = parseFloat(document.getElementById('sayur').value) || 0;
  const laukpauk = parseFloat(document.getElementById('laukpauk').value) || 0;
  const lauknabati = parseFloat(document.getElementById('lauknabati').value) || 0;
  const buah = parseFloat(document.getElementById('buah').value) || 0;
  
  // Validasi: cek apakah sudah ada data untuk tanggal ini
  const snapshot = await new Promise((resolve) => {
    const q = query(sisaPengRef, orderByChild('tanggalISO'), equalTo(tanggalISO));
    onValue(q, (snap) => resolve(snap), { onlyOnce: true });
  });
  
  const existingData = snapshot.val();
  if (existingData) {
    const confirmUpdate = confirm(`Data untuk tanggal ${tanggalDisplay} sudah ada. Apakah Anda ingin menggantinya?`);
    if (!confirmUpdate) {
      showToast("Penyimpanan dibatalkan", "warning");
      return;
    }
    
    // Hapus data lama
    const existingKey = Object.keys(existingData)[0];
    await ref(db, `sisa_pengolahan/${existingKey}`).remove();
  }
  
  // Simpan data baru
  await push(sisaPengRef, {
    tanggalISO,
    tanggalDisplay,
    pokok, 
    sayur, 
    laukpauk, 
    lauknabati, 
    buah,
    createdAt: new Date().toISOString()
  });
  
  showToast(`✅ Sisa pengolahan untuk ${tanggalDisplay} berhasil tersimpan!`);
  resetForm();
};

function resetForm() {
  document.getElementById('pokok').value = '0';
  document.getElementById('sayur').value = '0';
  document.getElementById('laukpauk').value = '0';
  document.getElementById('lauknabati').value = '0';
  document.getElementById('buah').value = '0';
}

window.tampilRiwayatSisa = function() {
  const selected = document.getElementById('dateSisa').value;
  if (!selected) {
    alert("Pilih tanggal terlebih dahulu!");
    return;
  }
  
  const q = query(sisaPengRef, orderByChild('tanggalISO'), equalTo(selected));
  
  onValue(q, (snap) => {
    const data = snap.val() || {};
    const filtered = Object.values(data);
    
    if (filtered.length === 0) {
      document.getElementById('listSisaPeng').innerHTML = '<div class="empty-data"><i class="fas fa-inbox"></i><p>Tidak ada data pada tanggal tersebut</p></div>';
      return;
    }
    
    let html = '';
    filtered.forEach(item => {
      html += `
        <div class="data-item">
          <div class="data-date">
            <i class="fas fa-calendar-alt"></i>
            <strong>${item.tanggalDisplay}</strong>
          </div>
          <div class="data-details">
            <div class="data-detail">
              <i class="fas fa-utensils" style="color: #f59e0b;"></i>
              <span class="label">Makanan Pokok:</span>
              <span class="value">${item.pokok} kg</span>
            </div>
            <div class="data-detail">
              <i class="fas fa-carrot" style="color: #22c55e;"></i>
              <span class="label">Sayur:</span>
              <span class="value">${item.sayur} kg</span>
            </div>
            <div class="data-detail">
              <i class="fas fa-drumstick-bite" style="color: #ef4444;"></i>
              <span class="label">Lauk Pauk:</span>
              <span class="value">${item.laukpauk} kg</span>
            </div>
            <div class="data-detail">
              <i class="fas fa-seedling" style="color: #8b5cf6;"></i>
              <span class="label">Lauk Nabati:</span>
              <span class="value">${item.lauknabati} kg</span>
            </div>
            <div class="data-detail">
              <i class="fas fa-apple-alt" style="color: #ec4899;"></i>
              <span class="label">Buah / Susu:</span>
              <span class="value">${item.buah} kg</span>
            </div>
          </div>
        </div>
      `;
    });
    
    document.getElementById('listSisaPeng').innerHTML = html;
  }, { onlyOnce: true });
};