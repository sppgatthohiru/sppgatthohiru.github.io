import { db } from "./firebase-init.js";

let toastElement = null;

export function showToast(message) {
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.id = 'customToast';
    toastElement.style.cssText = `
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
    document.body.appendChild(toastElement);
    
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
  
  toastElement.textContent = message;
  toastElement.style.display = 'block';
  setTimeout(() => {
    toastElement.style.display = 'none';
  }, 2000);
}

export function formatDate(date) {
  return date.toLocaleDateString('id-ID');
}

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}