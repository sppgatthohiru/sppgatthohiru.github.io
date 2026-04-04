import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-app.js";
import { getDatabase, ref } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// References
export const stokRef = ref(db, 'stok_operasional');
export const sisaPengRef = ref(db, 'sisa_pengolahan');
export const omprengRef = ref(db, 'sampah_ompreng');
export const absensiRef = ref(db, 'absensi');