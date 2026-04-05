// ============================================================
// DATA.JS - Master Data ASLAP
// ============================================================

// ============================================================
// DAFTAR RELAWAN TETAP
// ============================================================
export const daftarRelawan = [
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

// ============================================================
// KATEGORI BARANG (Stok Operasional)
// ============================================================
export const kategoriBarang = {
  "Pembersih & Deterjen": [
    "Deterjen Jazz Attack", "Rinso Detergen 1140gr", "Rinso Detergen 700gr",
    "Sabun Cuci Piring Ekonomi", "Sabun Cuci Piring Sunlight", "Sabun Colek Wings",
    "Sabun Cling Pembersih Kaca", "Sabun Kilau Nipis", "Sabun Lantai Indomaret",
    "Sabun MR. Muscle", "Sabun Mr.Muscle Pembersih Kaca", "Sabun Soklin Lantai",
    "Sabun Super Pell", "Handwash S.O.S"
  ],
  "Perlengkapan Kebersihan": [
    "Kanebo Camion", "Kanebo Proteam", "Sapu Berlin", "Sikat Custom",
    "Sikat Kasak Besi Daichi", "Sikat Kasak Besi Fujinex", "Spon Cuci Besar Yakima",
    "Spon Cuci Kecil Yakima", "Spon Cuci Polytex", "Lap Kotak-Kotak Arwana",
    "Lap Kotak-Kotak Kustom", "Lap Microfiber", "Lap Microfiber Biru",
    "Lap Microfiber Hijau", "Lap Microfiber Kuning", "Lap Microfiber Orange",
    "Lap Microfiber Pink", "Lap Microfiber Towel Roll", "Lap Microfiber Ungu",
    "Keset Custom", "Folding Hanger Owl Plast"
  ],
  "Plastik & Kresek": [
    "Plastik JoyoBoyo", "Plastik Merah Mahkota", "Plastik Merah Tiga Gelang",
    "Plastik Putih Beko", "Kresek Merah Cap Kendi", "Plastik Sampah Platinum",
    "Plastik Sampah Friendly", "Plastik Sampah Hitam Brocco",
    "Plastik Sampah Hitam Bunga Sukma", "Plastik Sampah Hitam Custom",
    "Plastik Sampah Hitam Samba", "Plastik Sampah Kuning Kustom",
    "Plastik Sampah Romawi"
  ],
  "Alat Pelindung & Masker": [
    "Masker Bedah Karet Onemed", "Masker Duckbill Xiontian", "Masker Duckbill Filtcare",
    "Masker Duckbill Wei Kang Medical", "Masker Face Mask", "Masker One Care",
    "Nurse Cap Altamed", "Sarung Tangan Latex Altamed",
    "Sarung Tangan Latex Hitam Nitrile/Vinyl", "Sarung Tangan Latex Putih Feroze",
    "Sarung Tangan Latex Putih Nitrile/Vinyl", "Sarung Tangan Plastik Leeka",
    "Sarung Tangan Plastik Onemed", "Sarung Tangan Plastik Xuebo"
  ],
  "Kebutuhan Umum": [
    "Air Freshner Glade", "Clink Warp", "Kapur Barus Larisst", "Lem Lalat",
    "Tisu Dapur Nature", "Tisu Dapur Serbaguna", "Tisu Dapur Serbaguna Lili",
    "Tisu See-U"
  ],
  "Utility & Gas": [
    "GAS LPG 50KG", "GAS LPG 12KG", "GALON AIR", "LISTRIK"
  ],
  "Barang Lainnya": []
};

// ============================================================
// FLAT ARRAY UNTUK DROPDOWN
// ============================================================
export const daftarBarangDefault = Object.values(kategoriBarang).flat();

// ============================================================
// GET CATEGORY ICON
// ============================================================
export function getCategoryIcon(kategori) {
  const icons = {
    "Pembersih & Deterjen": "fa-soap",
    "Perlengkapan Kebersihan": "fa-broom",
    "Plastik & Kresek": "fa-shopping-bag",
    "Alat Pelindung & Masker": "fa-head-side-mask",
    "Kebutuhan Umum": "fa-box",
    "Utility & Gas": "fa-gas-pump",
    "Barang Lainnya": "fa-archive"
  };
  return icons[kategori] || "fa-boxes";
}

// ============================================================
// SEARCH BARANG (untuk autocomplete)
// ============================================================
export function searchBarang(keyword) {
  if (!keyword) return [];
  const lowerKeyword = keyword.toLowerCase();
  return daftarBarangDefault.filter(item => 
    item.toLowerCase().includes(lowerKeyword)
  );
}

// ============================================================
// GET KATEGORI BY NAMA BARANG
// ============================================================
export function getKategoriByNamaBarang(nama) {
  for (const [kategori, items] of Object.entries(kategoriBarang)) {
    if (items.includes(nama)) {
      return kategori;
    }
  }
  return "Barang Lainnya";
}

// ============================================================
// TAMBAH BARANG KE KATEGORI
// ============================================================
export function addBarangToKategori(nama, kategori) {
  if (!kategoriBarang[kategori]) {
    kategoriBarang[kategori] = [];
  }
  if (!kategoriBarang[kategori].includes(nama)) {
    kategoriBarang[kategori].push(nama);
    // Update flat array
    daftarBarangDefault.push(nama);
  }
}

// ============================================================
// EXPORT KE WINDOW (untuk akses global)
// ============================================================
if (typeof window !== 'undefined') {
  window.kategoriBarang = kategoriBarang;
  window.daftarBarangDefault = daftarBarangDefault;
  window.getCategoryIcon = getCategoryIcon;
}