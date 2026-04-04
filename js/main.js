import { db } from "./firebase-init.js";
import { loadDashboard, initDashboard, editListrik, editStok } from "./dashboard.js";
import { loadStokPage, initStok, setCurrentPage } from "./stok.js";
import { loadSisaPengolahanPage } from "./sisa-pengolahan.js";
import { loadSampahOmprengPage } from "./sampah-ompreng.js";
import { loadAbsensiPage, initAbsensi } from "./absensi.js";

// Export functions ke window
window.editListrik = editListrik;
window.editStok = editStok;

let currentPage = 'dashboard';

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
    html = loadDashboard();
  } 
  else if (page === 'stok') {
    html = loadStokPage();
  } 
  else if (page === 'sisa_pengolahan') {
    html = loadSisaPengolahanPage();
  } 
  else if (page === 'sampah_ompreng') {
    html = loadSampahOmprengPage();
  } 
  else if (page === 'km') {
    html = loadKMPage();
  } 
  else if (page === 'absensi') {
    html = loadAbsensiPage();
  }

  content.innerHTML = html;
  loadDataForPage(page);
}

function loadDataForPage(page) {
  setCurrentPage(page);
  
  if (page === 'dashboard') {
    initDashboard();
  } 
  else if (page === 'stok') {
    initStok();
  } 
  else if (page === 'absensi') {
    initAbsensi();
  }
}

// Start aplikasi
showPage('dashboard');