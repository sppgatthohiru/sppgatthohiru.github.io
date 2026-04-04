// ================== script.js - LENGKAP ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-app.js";
import { getDatabase, ref, push, onValue, set, get } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";

// ================== CONFIG FIREBASE ==================
const firebaseConfig = {
  apiKey: "AIzaSyBgqd4Va35imJ51tPBPo58nTWm1kyTFhWQ",
  authDomain: "aslap-mbg-tracker.firebaseapp.com",
  databaseURL: "https://aslap-mbg-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aslap-mbg-tracker",
  storageBucket: "aslap-mbg-tracker.firebasestorage.app",
  messagingSenderId: "669913277699",
  appId: "1:669913277699:web:a303f7053269cb9c91f536",
  measurementId: "G-SQP2X21ZVZ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// References
const stokRef = ref(db, 'stok_operasional');
const sisaPengRef = ref(db, 'sisa_pengolahan');
const omprengRef = ref(db, 'sampah_ompreng');
const kmRef = ref(db, 'km_kendaraan');
const absensiRef = ref(db, 'absensi');

let currentPage = 'dashboard';
let chartSisa = null;
let chartOmpreng = null;
let chartKM = null;

// Daftar Relawan Tetap
const daftarRelawan = [
  "Dimas Rahmat Firmansyah", "Zardan Leonardo Ahmadani", "Tri Ajeng Pamungkas",
  "Khoirul Liazah", "Muhammad Nasrulloh", "Agung cahyo Prasetyo", "Reni Puput Meirani",
  "Andrias", "Susiana", "Hendrawan Setiyanto", "Afit Harianto", "Nofendi Achmad Setiawan",
  "As'ad Umar", "Masitah", "Farizha Salsabilah Meilina", "Muhammad Irfan Busono",
  "Ranti Sulvia Rusmaning", "Eki Dwi Rindiani", "Dinda Ayu Wardani", "Taurisia Dina Fadila",
  "Nela Ayliwati", "Chabibatul Chusna", "Ririn Ermayanti", "Moch. Jihan Firmansyah",
  "Siti Nur Arba'iyatunnisak", "Nur Khomar", "Mukhammad Dani Hidayat", "Candra Bintang Azhar",
  "Wenny Handie Oktaviana", "Ngasmiati", "Awwalin Muniro", "Iliyin Mudawamah",
  "Muhammad Alvin Ardianto", "Muchamat Zufi Septian Ardana", "Atik Andriani",
  "M. Ihsan Sabilah", "Agus Hariyanto", "Muhammad Al-Kharis", "Moch harun Alrosit",
  "Yayang Adisha", "Ade Firmansyah", "Sarah Nur D", "Nurma Ainun Afifah",
  "Rinna Januarti", "Deni Oktafian Pratama", "Suhadi"
];

// Daftar Mobil
const daftarMobil = ["Mobil Putih", "Mobil Hitam"];

const daftarBarangDefault = [
  "Deterjen Jazz Attack","Air Freshner Glade","Clink Warp","Folding Hanger Owl Plast",
  "Handwash S.O.S","Kanebo Camion","Kanebo Proteam","Kapur Barus Larisst","Keset Custom",
  "Kresek Merah Cap Kendi","Lap Kotak-Kotak Arwana","Lap Kotak-Kotak Kustom",
  "Lap Microfiber","Lap Microfiber Biru","Lap Microfiber Hijau","Lap Microfiber Kuning",
  "Lap Microfiber Orange","Lap Microfiber Pink","Lap Microfiber Towel Roll","Lap Microfiber Ungu",
  "Lem Lalat","Masker Bedah Karet Onemed","Masker Duckbill Xiontian","Masker Duckbill Filtcare",
  "Masker Duckbill Wei Kang Medical","Masker Face Mask","Masker One Care","Nurse Cap Altamed",
  "Pastik Sampah Platinum","Plastik JoyoBoyo","Plastik Merah Mahkota","Plastik Merah Tiga Gelang",
  "Plastik Putih Beko","Plastik Sampah Friendly","Plastik Sampah Hitam Brocco",
  "Plastik Sampah Hitam Bunga Sukma","Plastik Sampah Hitam Custom","Plastik Sampah Hitam Samba",
  "Plastik Sampah Kuning Kustom","Plastik Sampah Romawi","Rinso Detergen 1140gr",
  "Rinso Detergen 700gr","Sabun Cling Pembersih Kaca","Sabun Colek Wings",
  "Sabun Cuci Piring Ekonomi","Sabun Cuci Piring Sunlight","Sabun Kilau Nipis",
  "Sabun Lantai Indomaret","Sabun MR. Muscle","Sabun Mr.Muscle Pembersih Kaca",
  "Sabun Soklin Lantai","Sabun Super Pell","Sapu Berlin","Sarung Tangan Latex Altamed",
  "Sarung Tangan Latex Hitam Nitrile/Vinyl","Sarung Tangan Latex Putih Feroze",
  "Sarung Tangan Latex Putih Nitrile/Vinyl","Sarung Tangan Plastik Leeka",
  "Sarung Tangan Plastik Onemed","Sarung Tangan Plastik Xuebo","Sikat Custom",
  "Sikat Kasak Besi Daichi","Sikat Kasak Besi Fujinex","Spon Cuci Besar Yakima",
  "Spon Cuci Kecil Yakima","Spon Cuci Polytex","Tisu Dapur Nature",
  "Tisu Dapur Serbaguna","Tisu Dapur Serbaguna Lili","Tisu See-U",
  "GAS LPG 50KG","GAS LPG 12KG","GALON AIR","LISTRIK"
];

window.showPage = function(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  
  const navId = page === 'sisa_pengolahan' ? 'sisa-peng' :
                page === 'sampah_ompreng' ? 'sampah-ompreng' : page;
  const navElement = document.getElementById(`nav-${navId}`);
  if (navElement) navElement.classList.add('active');

  loadPage(page);
};

function loadPage(page) {
  const content = document.getElementById('mainContent');
  let html = '';

  if (page === 'dashboard') {
    html = `
      <h1 class="text-4xl font-bold text-green-700 mb-2">Dashboard ASLAP</h1>
      <p class="text-gray-600 mb-8">${new Date().toLocaleDateString('id-ID')}</p>
      
      <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
        <div class="dash-card">
          <h3>GAS LPG 50KG</h3>
          <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0;">
            <button onclick="editStok('GAS_LPG_50KG', -1)" style="background: #ef4444; padding: 8px 16px; border-radius: 8px;">-</button>
            <p id="lpg50" class="dash-value normal" style="margin: 0; min-width: 60px;">0</p>
            <button onclick="editStok('GAS_LPG_50KG', 1)" style="background: #22c55e; padding: 8px 16px; border-radius: 8px;">+</button>
          </div>
          <small>Unit</small>
        </div>
        <div class="dash-card">
          <h3>GAS LPG 12KG</h3>
          <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0;">
            <button onclick="editStok('GAS_LPG_12KG', -1)" style="background: #ef4444; padding: 8px 16px; border-radius: 8px;">-</button>
            <p id="lpg12" class="dash-value normal" style="margin: 0; min-width: 60px;">0</p>
            <button onclick="editStok('GAS_LPG_12KG', 1)" style="background: #22c55e; padding: 8px 16px; border-radius: 8px;">+</button>
          </div>
          <small>Unit</small>
        </div>
        <div class="dash-card">
          <h3>GALON AIR</h3>
          <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0;">
            <button onclick="editStok('GALON_AIR', -1)" style="background: #ef4444; padding: 8px 16px; border-radius: 8px;">-</button>
            <p id="galon" class="dash-value normal" style="margin: 0; min-width: 60px;">0</p>
            <button onclick="editStok('GALON_AIR', 1)" style="background: #22c55e; padding: 8px 16px; border-radius: 8px;">+</button>
          </div>
          <small>Unit</small>
        </div>
        <div class="dash-card">
          <h3>LISTRIK</h3>
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 10px 0; flex-wrap: wrap;">
            <input type="number" id="inputListrik" placeholder="Jumlah (kWh/Token)" style="width: 120px; text-align: center;">
            <button onclick="editListrik()" style="background: #3b82f6; padding: 8px 16px; border-radius: 8px;">Update</button>
          </div>
          <p id="listrik" class="dash-value normal" style="margin: 5px 0 0 0;">0</p>
          <small>kWh/Token</small>
        </div>
        <div class="dash-card">
          <h3>Total KM Hari Ini</h3>
          <p id="totalKM" class="dash-value normal">0</p>
          <small>km</small>
        </div>
      </div>

      <div class="card mt-8">
        <h3 class="mb-4">Sisa Pengolahan per Tanggal (kg)</h3>
        <canvas id="chartSisa" height="180"></canvas>
      </div>

      <div class="card mt-8">
        <h3 class="mb-4">Sampah Ompreng per Tanggal (kg)</h3>
        <canvas id="chartOmpreng" height="180"></canvas>
      </div>

      <div class="card mt-8">
        <h3 class="mb-4">KM Kendaraan 7 Hari Terakhir</h3>
        <canvas id="chartKM" height="140"></canvas>
      </div>
    `;
  } 
  else if (page === 'stok') {
    html = `
      <h2 class="text-3xl font-semibold mb-6">Sisa Stok Operasional</h2>
      <div class="card">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 80px; gap: 12px; align-items: end;">
          <input id="namaBarangBaru" type="text" placeholder="Ketik nama barang baru">
          <select id="namaBarangDropdown"></select>
          <select id="jenisStok">
            <option value="masuk">➕ Masuk</option>
            <option value="keluar">➖ Keluar</option>
          </select>
          <input id="jumlahStok" type="number" step="0.01" placeholder="Jumlah">
          <button onclick="simpanStok()">Simpan</button>
        </div>
        <p class="text-xs text-gray-500 mt-3">* Ketik nama baru jika tidak ada di dropdown</p>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>Nama Barang</th><th class="text-right">Sisa Stok</th></tr></thead>
          <tbody id="tabelStok"></tbody>
        </table>
      </div>
    `;
  } 
  else if (page === 'sisa_pengolahan') {
    html = `
      <h2 class="text-3xl font-semibold mb-6">Input Sisa Pengolahan</h2>
      <div class="card" style="max-width:620px;">
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div><label>Makanan Pokok</label><input id="pokok" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Sayur</label><input id="sayur" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Lauk Pauk</label><input id="laukpauk" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Lauk Nabati</label><input id="lauknabati" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Buah / Susu</label><input id="buah" type="number" step="0.1" placeholder="kg"></div>
        </div>
        <button onclick="simpanSisaPengolahan()" class="mt-6">Simpan Sisa Pengolahan Hari Ini</button>
      </div>

      <div class="card mt-8">
        <h3>Pilih Tanggal untuk Melihat Riwayat</h3>
        <input type="date" id="dateSisa" class="mt-3">
        <button onclick="tampilRiwayatSisa()" class="mt-3">Tampilkan Data</button>
        <div id="listSisaPeng" class="mt-6 space-y-3"></div>
      </div>
    `;
  } 
  else if (page === 'sampah_ompreng') {
    html = `
      <h2 class="text-3xl font-semibold mb-6">Input Sampah Ompreng</h2>
      <div class="card" style="max-width:620px;">
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div><label>Makanan Pokok</label><input id="pokokOm" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Sayur</label><input id="sayurOm" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Lauk Pauk</label><input id="laukpaukOm" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Lauk Nabati</label><input id="lauknabatiOm" type="number" step="0.1" placeholder="kg"></div>
          <div><label>Buah / Susu</label><input id="buahOm" type="number" step="0.1" placeholder="kg"></div>
        </div>
        <button onclick="simpanSampahOmpreng()" class="mt-6">Simpan Sampah Ompreng Hari Ini</button>
      </div>

      <div class="card mt-8">
        <h3>Pilih Tanggal untuk Melihat Riwayat</h3>
        <input type="date" id="dateOmpreng" class="mt-3">
        <button onclick="tampilRiwayatOmpreng()" class="mt-3">Tampilkan Data</button>
        <div id="listSampahOmpreng" class="mt-6 space-y-3"></div>
      </div>
    `;
  } 
  else if (page === 'km') {
    html = `
      <h2 class="text-3xl font-semibold mb-6">KM Kendaraan</h2>
      <div class="card" style="max-width:520px;">
        <select id="namaKendaraan" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
          <option value="">Pilih Kendaraan</option>
          ${daftarMobil.map(mobil => `<option value="${mobil}">${mobil}</option>`).join('')}
        </select>
        <input id="kmAwal" type="number" placeholder="KM Awal">
        <input id="kmAkhir" type="number" placeholder="KM Akhir">
        <button onclick="simpanKM()">Simpan</button>
      </div>
      <div class="card mt-8">
        <h3>Pilih Tanggal untuk Melihat Riwayat</h3>
        <input type="date" id="dateKM" class="mt-3">
        <button onclick="tampilRiwayatKM()" class="mt-3">Tampilkan Data</button>
        <div id="listKM" class="mt-6 space-y-3"></div>
      </div>
    `;
  } 
  else if (page === 'absensi') {
    html = `
      <h2 class="text-3xl font-semibold mb-6">Absensi Relawan</h2>
      <div class="card" style="max-width:100%; overflow-x: auto;">
        <div style="margin-bottom: 20px;">
          <label>Pilih Tanggal: </label>
          <input type="date" id="tanggalAbsensi" value="${new Date().toISOString().slice(0,10)}" style="padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
          <button onclick="loadAbsensiHariIni()" style="margin-left: 10px;">Muat Data</button>
          <button onclick="simpanSemuaAbsensi()" style="margin-left: 10px; background: #22c55e;">Simpan Semua</button>
        </div>
        <div id="daftarAbsensiChecklist"></div>
      </div>
      <div class="card mt-8">
        <h3>Riwayat Absensi - Pilih Tanggal</h3>
        <input type="date" id="dateAbsensi" class="mt-3">
        <button onclick="tampilRiwayatAbsensi()" class="mt-3">Tampilkan Data</button>
        <div id="listAbsensi" class="mt-6"></div>
      </div>
    `;
  }

  content.innerHTML = html;
  loadDataForPage(page);
}

function loadDataForPage(page) {
  if (page === 'dashboard') updateDashboard();
  else if (page === 'stok') { isiDropdownStok(); loadStok(); }
  else if (page === 'absensi') { loadAbsensiHariIni(); }
}

// ================== FUNGSI EDIT LISTRIK MANUAL ==================
window.editListrik = async function() {
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
  } catch (error) {
    console.error("Error update listrik:", error);
    alert("Gagal mengupdate listrik!");
  }
};

// ================== FUNGSI EDIT STOK DARI DASHBOARD ==================
window.editStok = async function(namaKey, perubahan) {
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
    document.getElementById(elementId).textContent = stokBaru;
    
    const perubahanText = perubahan > 0 ? `+${perubahan}` : perubahan;
    showToast(`${namaAsli}: ${perubahanText} → Stok sekarang ${stokBaru}`);
    
  } catch (error) {
    console.error("Error update stok:", error);
    alert("Gagal mengupdate stok!");
  }
};

function showToast(message) {
  let toast = document.getElementById('customToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'customToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 9999;
      animation: fadeInOut 2s ease-in-out;
      font-size: 14px;
    `;
    document.body.appendChild(toast);
    
    if (!document.querySelector('#toastStyle')) {
      const style = document.createElement('style');
      style.id = 'toastStyle';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(20px); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2000);
}

// ================== STOK OPERASIONAL ==================
function isiDropdownStok() {
  const select = document.getElementById('namaBarangDropdown');
  if (!select) return;
  select.innerHTML = '<option value="">-- Pilih dari Daftar --</option>' + 
                     daftarBarangDefault.map(item => `<option value="${item}">${item}</option>`).join('');
}

window.simpanStok = function() {
  let nama = document.getElementById('namaBarangBaru').value.trim();
  if (!nama) {
    nama = document.getElementById('namaBarangDropdown').value;
  }

  const jenis = document.getElementById('jenisStok').value;
  let jumlah = parseFloat(document.getElementById('jumlahStok').value);

  if (!nama || !jumlah) {
    alert("Masukkan nama barang dan jumlah!");
    return;
  }

  const key = nama.replace(/[^a-zA-Z0-9]/g, '_');

  onValue(ref(db, 'stok_operasional/' + key), (snap) => {
    let stokSekarang = snap.exists() ? snap.val().stok : 0;
    if (jenis === 'keluar') jumlah = -jumlah;
    const stokBaru = Math.max(0, stokSekarang + jumlah);

    set(ref(db, 'stok_operasional/' + key), { 
      nama: nama, 
      stok: stokBaru 
    });

    alert(`Stok "${nama}" berhasil diupdate menjadi ${stokBaru}`);

    document.getElementById('namaBarangBaru').value = '';
    document.getElementById('jumlahStok').value = '';

    loadStok();
    isiDropdownStok();
    
    if (currentPage === 'dashboard') {
      updateDashboard();
    }
  }, { onlyOnce: true });
};

function loadStok() {
  onValue(stokRef, (snapshot) => {
    const data = snapshot.val() || {};
    const tbody = document.getElementById('tabelStok');
    if (!tbody) return;
    let html = '';
    Object.values(data).sort((a,b) => a.nama.localeCompare(b.nama)).forEach(item => {
      const sisa = item.stok || 0;
      const kelas = sisa < 5 ? 'low-stock' : '';
      html += `<tr><td style="padding: 8px;">${item.nama}</td><td class="text-right ${kelas}" style="padding: 8px;">${sisa}</td></tr>`;
    });
    tbody.innerHTML = html;
  });
}

// ================== DASHBOARD + CHART ==================
function updateDashboard() {
  const today = new Date().toISOString().slice(0,10);

  onValue(stokRef, (snap) => {
    const d = snap.val() || {};
    const lpg50 = document.getElementById('lpg50');
    const lpg12 = document.getElementById('lpg12');
    const galon = document.getElementById('galon');
    const listrik = document.getElementById('listrik');
    
    if (lpg50) lpg50.textContent = d['GAS_LPG_50KG']?.stok || 0;
    if (lpg12) lpg12.textContent = d['GAS_LPG_12KG']?.stok || 0;
    if (galon) galon.textContent = d['GALON_AIR']?.stok || 0;
    if (listrik) listrik.textContent = d['LISTRIK']?.stok || 0;
  });

  onValue(kmRef, (snap) => {
    let total = 0;
    const data = snap.val() || {};
    Object.values(data).forEach(item => {
      if (item.tanggalISO === today) total += (item.total || 0);
    });
    const totalKMElement = document.getElementById('totalKM');
    if (totalKMElement) totalKMElement.textContent = total;
  });

  onValue(sisaPengRef, (snap) => {
    const data = snap.val() || {};
    const dates = [...new Set(Object.values(data).map(item => item.tanggalDisplay))].slice(-7);
    const datasets = ["pokok","sayur","laukpauk","lauknabati","buah"].map((key, i) => ({
      label: ["Makanan Pokok","Sayur","Lauk Pauk","Lauk Nabati","Buah/Susu"][i],
      data: dates.map(date => {
        const item = Object.values(data).find(d => d.tanggalDisplay === date);
        return item ? item[key] || 0 : 0;
      }),
      backgroundColor: ['#16a34a','#eab308','#ef4444','#8b5cf6','#ec4899'][i]
    }));

    const ctx = document.getElementById('chartSisa');
    if (ctx) {
      if (chartSisa) chartSisa.destroy();
      chartSisa = new Chart(ctx, {
        type: 'bar',
        data: { labels: dates, datasets },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
  });

  onValue(omprengRef, (snap) => {
    const data = snap.val() || {};
    const dates = [...new Set(Object.values(data).map(item => item.tanggalDisplay))].slice(-7);
    const datasets = ["pokok","sayur","laukpauk","lauknabati","buah"].map((key, i) => ({
      label: ["Makanan Pokok","Sayur","Lauk Pauk","Lauk Nabati","Buah/Susu"][i],
      data: dates.map(date => {
        const item = Object.values(data).find(d => d.tanggalDisplay === date);
        return item ? item[key] || 0 : 0;
      }),
      backgroundColor: ['#f97316','#f59e0b','#dc2626','#7c3aed','#db2777'][i]
    }));

    const ctx = document.getElementById('chartOmpreng');
    if (ctx) {
      if (chartOmpreng) chartOmpreng.destroy();
      chartOmpreng = new Chart(ctx, {
        type: 'bar',
        data: { labels: dates, datasets },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
  });
}

// ================== ABSENSI CHECKLIST (HADIR / TIDAK HADIR) ==================
let currentAbsensiData = {};

window.loadAbsensiHariIni = function() {
  const tanggal = document.getElementById('tanggalAbsensi').value;
  if (!tanggal) return;
  
  // Load data absensi yang sudah ada untuk tanggal ini
  onValue(absensiRef, (snap) => {
    const data = snap.val() || {};
    const existingAbsen = {};
    Object.values(data).forEach(item => {
      if (item.tanggalISO === tanggal) {
        existingAbsen[item.nama] = item.status;
      }
    });
    
    // Buat checklist HTML dengan 2 opsi: Hadir / Tidak Hadir
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">';
    daftarRelawan.forEach(relawan => {
      const statusSekarang = existingAbsen[relawan] || 'Hadir';
      const isHadir = statusSekarang === 'Hadir';
      html += `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
          <span style="flex: 1; font-size: 14px; font-weight: 500;">${relawan}</span>
          <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
            <input type="radio" name="absen_${relawan.replace(/\s/g, '_')}" value="Hadir" data-relawan="${relawan}" class="radio-hadir" ${isHadir ? 'checked' : ''}>
            <span style="color: #22c55e;">✅ Hadir</span>
          </label>
          <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
            <input type="radio" name="absen_${relawan.replace(/\s/g, '_')}" value="Tidak Hadir" data-relawan="${relawan}" class="radio-tidak" ${!isHadir ? 'checked' : ''}>
            <span style="color: #ef4444;">❌ Tidak Hadir</span>
          </label>
        </div>
      `;
    });
    html += '</div>';
    document.getElementById('daftarAbsensiChecklist').innerHTML = html;
    
    // Simpan data awal
    currentAbsensiData = {...existingAbsen};
  });
};

window.simpanSemuaAbsensi = async function() {
  const tanggal = document.getElementById('tanggalAbsensi').value;
  if (!tanggal) {
    alert("Pilih tanggal terlebih dahulu!");
    return;
  }
  
  // Kumpulkan semua status dari radio button
  const absenBaru = {};
  
  daftarRelawan.forEach(relawan => {
    const radioHadir = document.querySelector(`input[data-relawan="${relawan}"][value="Hadir"]`);
    if (radioHadir && radioHadir.checked) {
      absenBaru[relawan] = 'Hadir';
    } else {
      absenBaru[relawan] = 'Tidak Hadir';
    }
  });
  
  // Hapus data lama untuk tanggal ini
  const snapshot = await get(absensiRef);
  const data = snapshot.val() || {};
  
  const hapusPromises = [];
  Object.entries(data).forEach(([key, value]) => {
    if (value.tanggalISO === tanggal) {
      hapusPromises.push(set(ref(db, 'absensi/' + key), null));
    }
  });
  
  await Promise.all(hapusPromises);
  
  // Simpan data baru
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
  alert(`Absensi tanggal ${tanggal} berhasil disimpan!`);
  showToast(`Absensi ${tanggal} tersimpan`);
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
    
    // Tampilkan dalam 2 kolom
    let html = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; border: 1px solid #bbf7d0;">
          <h4 style="color: #16a34a; font-size: 18px; font-weight: bold; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>✅</span> HADIR <span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 20px; font-size: 12px;">${hadir.length}</span>
          </h4>
          <div style="display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto;">
            ${hadir.length > 0 ? hadir.map(nama => `<div style="padding: 6px 10px; background: white; border-radius: 6px; border: 1px solid #dcfce7;">📌 ${nama}</div>`).join('') : '<p style="color: #888; font-style: italic;">Tidak ada yang hadir</p>'}
          </div>
        </div>
        <div style="background: #fef2f2; border-radius: 12px; padding: 16px; border: 1px solid #fecaca;">
          <h4 style="color: #dc2626; font-size: 18px; font-weight: bold; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>❌</span> TIDAK HADIR <span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 20px; font-size: 12px;">${tidakHadir.length}</span>
          </h4>
          <div style="display: flex; flex-direction: column; gap: 6px; max-height: 400px; overflow-y: auto;">
            ${tidakHadir.length > 0 ? tidakHadir.map(nama => `<div style="padding: 6px 10px; background: white; border-radius: 6px; border: 1px solid #fee2e2;">📌 ${nama}</div>`).join('') : '<p style="color: #888; font-style: italic;">Semua hadir</p>'}
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('listAbsensi').innerHTML = html;
  });
};

// ================== SISA PENGOLAHAN ==================
window.simpanSisaPengolahan = function() {
  const tanggalISO = new Date().toISOString().slice(0,10);
  push(sisaPengRef, {
    tanggalISO,
    tanggalDisplay: new Date().toLocaleDateString('id-ID'),
    pokok: parseFloat(document.getElementById('pokok').value) || 0,
    sayur: parseFloat(document.getElementById('sayur').value) || 0,
    laukpauk: parseFloat(document.getElementById('laukpauk').value) || 0,
    lauknabati: parseFloat(document.getElementById('lauknabati').value) || 0,
    buah: parseFloat(document.getElementById('buah').value) || 0
  });
  alert("Sisa pengolahan hari ini tersimpan!");
};

window.tampilRiwayatSisa = function() {
  const selected = document.getElementById('dateSisa').value;
  if (!selected) return alert("Pilih tanggal terlebih dahulu!");
  onValue(sisaPengRef, (snap) => {
    const data = snap.val() || {};
    let html = '';
    Object.values(data).filter(item => item.tanggalISO === selected).forEach(item => {
      html += `<div class="card"><strong>${item.tanggalDisplay}</strong><br>Makanan Pokok: ${item.pokok} | Sayur: ${item.sayur} | Lauk Pauk: ${item.laukpauk} | Lauk Nabati: ${item.lauknabati} | Buah/Susu: ${item.buah}</div>`;
    });
    document.getElementById('listSisaPeng').innerHTML = html || '<p class="text-gray-500">Tidak ada data pada tanggal tersebut.</p>';
  });
};

// ================== SAMPAH OMPRENG ==================
window.simpanSampahOmpreng = function() {
  const tanggalISO = new Date().toISOString().slice(0,10);
  push(omprengRef, {
    tanggalISO,
    tanggalDisplay: new Date().toLocaleDateString('id-ID'),
    pokok: parseFloat(document.getElementById('pokokOm').value) || 0,
    sayur: parseFloat(document.getElementById('sayurOm').value) || 0,
    laukpauk: parseFloat(document.getElementById('laukpaukOm').value) || 0,
    lauknabati: parseFloat(document.getElementById('lauknabatiOm').value) || 0,
    buah: parseFloat(document.getElementById('buahOm').value) || 0
  });
  alert("Sampah ompreng hari ini tersimpan!");
};

window.tampilRiwayatOmpreng = function() {
  const selected = document.getElementById('dateOmpreng').value;
  onValue(omprengRef, (snap) => {
    const data = snap.val() || {};
    let html = '';
    Object.values(data).filter(item => item.tanggalISO === selected).forEach(item => {
      html += `<div class="card"><strong>${item.tanggalDisplay}</strong><br>Makanan Pokok: ${item.pokok} | Sayur: ${item.sayur} | Lauk Pauk: ${item.laukpauk} | Lauk Nabati: ${item.lauknabati} | Buah/Susu: ${item.buah}</div>`;
    });
    document.getElementById('listSampahOmpreng').innerHTML = html || '<p class="text-gray-500">Tidak ada data pada tanggal tersebut.</p>';
  });
};

// ================== KM KENDARAAN ==================
window.simpanKM = function() {
  const tanggalISO = new Date().toISOString().slice(0,10);
  const kendaraan = document.getElementById('namaKendaraan').value;
  const kmAwal = parseFloat(document.getElementById('kmAwal').value);
  const kmAkhir = parseFloat(document.getElementById('kmAkhir').value);
  
  if (!kendaraan) {
    alert("Pilih kendaraan terlebih dahulu!");
    return;
  }
  if (isNaN(kmAwal) || isNaN(kmAkhir)) {
    alert("Masukkan KM awal dan KM akhir!");
    return;
  }
  
  push(kmRef, {
    tanggalISO,
    tanggalDisplay: new Date().toLocaleDateString('id-ID'),
    kendaraan: kendaraan,
    kmAwal: kmAwal,
    kmAkhir: kmAkhir,
    total: kmAkhir - kmAwal
  });
  alert("Catatan KM tersimpan!");
  
  // Reset form
  document.getElementById('kmAwal').value = '';
  document.getElementById('kmAkhir').value = '';
};

window.tampilRiwayatKM = function() {
  const selected = document.getElementById('dateKM').value;
  if (!selected) {
    alert("Pilih tanggal terlebih dahulu!");
    return;
  }
  
  onValue(kmRef, (snap) => {
    const data = snap.val() || {};
    let html = '';
    Object.values(data)
      .filter(item => item.tanggalISO === selected)
      .forEach(item => {
        html += `<div class="card"><strong>${item.tanggalDisplay}</strong><br>${item.kendaraan} — KM Awal: ${item.kmAwal}, KM Akhir: ${item.kmAkhir}, Total: ${item.total} km</div>`;
      });
    document.getElementById('listKM').innerHTML = html || '<p class="text-gray-500">Tidak ada data.</p>';
  });
};

// Mulai aplikasi
showPage('dashboard');