// js/auth-guard.js
import { auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-auth.js";

let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export function initAuthGuard() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || "Pengguna",
          lastLogin: new Date().toISOString()
        };
        
        window.currentUser = currentUser;
        console.log(`✅ Login sebagai: ${currentUser.name}`);
        resolve(true);
      } else {
        currentUser = null;
        window.currentUser = null;
        window.location.href = 'login.html';
        resolve(false);
      }
    });
  });
}

// Fungsi Logout - Diperbaiki
export async function logout() {
  try {
    console.log("🔄 Proses logout...");
    await signOut(auth);
    localStorage.removeItem('currentUser');
    window.currentUser = null;
    
    console.log("✅ Logout berhasil");
    window.location.href = 'login.html';
  } catch (error) {
    console.error("❌ Error saat logout:", error);
    alert("Gagal keluar. Silakan coba lagi.");
  }
}

// Export agar bisa dipanggil dari HTML
window.logout = logout;