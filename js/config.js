// ================== CONFIG FIREBASE ==================
export const firebaseConfig = {
  apiKey: "AIzaSyBgqd4Va35imJ51tPBPo58nTWm1kyTFhWQ",
  authDomain: "aslap-mbg-tracker.firebaseapp.com",
  databaseURL: "https://aslap-mbg-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aslap-mbg-tracker",
  storageBucket: "aslap-mbg-tracker.firebasestorage.app",
  messagingSenderId: "669913277699",
  appId: "1:669913277699:web:a303f7053269cb9c91f536",
  measurementId: "G-SQP2X21ZVZ"
};

// ================== LINK GOOGLE DOCS ==================
export const googleDocsLinks = {
  organoleptik: "https://docs.google.com/document/d/1UYCjJjbdPoghIaSBTjxPPT0FLEINpbaw/edit",
  beritaAcara: "https://docs.google.com/document/d/1jj8LqFPCRCMXF4lBqBaZic-0KP6vW8WZ/edit"
  
};
// Dokumentasi Foto Links
export const dokumentasiLinks = {
  persiapan: 'https://drive.google.com/drive/folders/1r0fYQ2cvlX03p9VZ3bgP3UnroxUmro734GF9fvbdZ2YX_Y-r03qqw_532fChfmlUt1hrqbCx?usp=drive_link',
  pengolahan: 'https://drive.google.com/drive/folders/1i4kJLaZp01z6fpUp88GW4wkTXXplnMUeawMfpmmJcba9_8wErjvWxvUG93tStWPS_HIAbADS?usp=drive_link',
  pemorsian: 'https://drive.google.com/drive/folders/17H7I2ZBVJhpwua6jKE7fy2jSvl2BXtAp79g0pCcVVLkbtJV1Y3OL05nj7FRQiY73gI1tlpgr?usp=drive_link',
  cuciOmpreng: 'https://drive.google.com/drive/folders/1Ef8dFQ3BlO4-1SL4EQH8CrAM2-aabYX2-yj0oy9kH2sH1P5B5qIthtU5lu-5lRaF-Gutl-WM?usp=drive_link',
  serahTerima: 'https://drive.google.com/drive/folders/1CLP0ApGIdkXpi4d-VBSGW-RuIrVcvItKh1A5So40sqvQI1EBDXWyuJOZvekgLIlrSqi_Y1I9?usp=drive_link'
};

// Export ke window
window.dokumentasiLinks = dokumentasiLinks;
// Export ke window untuk akses dari HTML
window.googleDocsLinks = googleDocsLinks;