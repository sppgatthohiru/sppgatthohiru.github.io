// ============================================================
// FIREBASE-INIT.JS - Firebase Initialization
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-auth.js";
import { getDatabase, ref } from "https://www.gstatic.com/firebasejs/11.7.0/firebase-database.js";
import { firebaseConfig } from "./config.js";


// ============================================================
// INITIALIZE FIREBASE
// ============================================================
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const relawanRef = ref(db, 'relawanDivisi');

// ============================================================
// DATABASE REFERENCES
// ============================================================
export const stokRef = ref(db, 'stok_operasional');
export const sisaPengRef = ref(db, 'sisa_pengolahan');
export const omprengRef = ref(db, 'sampah_ompreng');
export const absensiRef = ref(db, 'absensi');

// ============================================================
// HELPER REFERENCES (untuk kemudahan)
// ============================================================
export const getStokRef = () => stokRef;
export const getSisaPengRef = () => sisaPengRef;
export const getOmprengRef = () => omprengRef;
export const getAbsensiRef = () => absensiRef;

// ============================================================
// CREATE REF BY PATH
// ============================================================
export const getRef = (path) => ref(db, path);