# 🐷 SPK Ternak Babi

**Sistem Pendukung Keputusan untuk Peternak Babi Skala Kecil di Bali**

> Dibangun oleh **Ni Putu Ayu Lesparini** — Gianyar, Bali | 2026

[![Status](https://img.shields.io/badge/Status-MVP%20Ready-brightgreen)](.)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](.)
[![License](https://img.shields.io/badge/License-Private-red)](.)

---

## 📌 Deskripsi Singkat

SPK Ternak Babi adalah aplikasi web berbasis browser yang membantu peternak babi skala kecil (1–20 ekor) di Bali dalam mengambil keputusan investasi ternak secara cerdas. Sistem ini mengintegrasikan:

- 📊 Kalkulasi otomatis modal, keuntungan, dan ROI
- 🧠 Rekomendasi berbasis aturan (rule-based SPK)
- 🎊 Sensitivitas terhadap musim hari raya Bali (Galungan, Kuningan)
- 📈 Grafik interaktif dan laporan PDF

---

## ✨ Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| **📋 Modul 1 — Data Bibit** | Input jumlah & harga bibit jantan/betina, hitung modal awal otomatis |
| **🌾 Modul 2 — Pakan** | Input pakan (SKU, harga, porsi, frekuensi), preview tabel kebutuhan 1–6 bulan |
| **📅 Modul 3 — Timeline** | Tanggal masuk, durasi ternak, progress bar fase (Adaptasi→Pertumbuhan→Finishing→Panen) |
| **💰 Modul 4 — Kalkulasi** | Total modal, skenario harga normal vs hari raya, BEP, ROI, grafik perbandingan |
| **🧠 Modul 5 — Rekomendasi SPK** | Keputusan otomatis: Lanjut / Tunggu Hari Raya / Pertimbangkan Ulang + risk assessment |
| **📊 Modul 6 — Laporan** | Chart historis, riwayat siklus, export PDF |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5 + Vanilla CSS + Vanilla JavaScript |
| Styling | Custom Design System (dark theme, glassmorphism) |
| Charts | [Chart.js 4.4](https://www.chartjs.org/) via CDN |
| Font | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Data Storage | `localStorage` (browser-based, tanpa server) |
| Export PDF | `window.print()` dengan custom print stylesheet |

> **Tidak memerlukan instalasi, build tools, atau server backend.** Cukup buka `index.html` di browser.

---

## 🚀 Cara Menjalankan (Lokal)

### Metode 1 — Langsung Buka (Paling Mudah)
```
Klik dua kali file: v1/index.html
```
> Otomatis terbuka di browser default. Data tersimpan di localStorage browser.

### Metode 2 — Local Server (Direkomendasikan untuk Development)
```bash
# Menggunakan Python
cd v1/
python -m http.server 3000

# Atau menggunakan Node.js
npx serve .

# Kemudian buka:
# http://localhost:3000
```

### Metode 3 — VS Code Live Server
1. Install ekstensi **Live Server** di VS Code
2. Klik kanan `index.html` → **Open with Live Server**

---

## 📁 Struktur File

```
babi/
├── v1/                              ← Folder aplikasi utama
│   ├── index.html                   ← Entry point aplikasi
│   ├── style.css                    ← Design system & semua styling
│   ├── data.js                      ← Database engine (localStorage) + Kalkulasi engine
│   ├── app.js                       ← Controller utama, routing, rendering semua modul
│   ├── PRD_SPK_Ternak_Babi.md       ← Product Requirements Document
│   └── PROMPT_AI_Development_SPK_Ternak_Babi.md  ← Panduan development
├── PRD_SPK_Ternak_Babi.MD           ← PRD (root, backup)
└── README.md                        ← File ini
```

---

## 🧮 Logika Kalkulasi (Modul 4 & 5)

### Formula Utama

```javascript
// Modal Bibit
Total Modal Bibit = (Jumlah Jantan × Harga Jantan) + (Jumlah Betina × Harga Betina)

// Konsumsi Pakan
Konsumsi per Hari = Jumlah Ekor × Porsi per Ekor × Frekuensi per Hari (kg)
Konsumsi per Bulan = Konsumsi per Hari × 30 (kg)
Karung per Bulan  = ⌈Konsumsi per Bulan / Berat per Karung⌉
Biaya Pakan Total = Karung Total × Harga per Karung

// Total Modal & Profit
Total Modal = Modal Bibit + Biaya Pakan Total
Penjualan   = Total Berat Panen × Harga per Kg
Margin      = Penjualan - Total Modal
ROI (%)     = (Margin / Total Modal) × 100
BEP Harga   = Total Modal / Total Berat Panen (Rp/kg)
```

### Rules Rekomendasi SPK

| Kondisi | Rekomendasi |
|---------|-------------|
| Margin terbaik > 0 (semua skenario) | ✅ **Lanjutkan Investasi** |
| Normal rugi, Hari Raya untung | 🕐 **Tunggu Hari Raya** |
| Semua skenario rugi | ⚠️ **Pertimbangkan Ulang** |
| Pakan naik 10% → hari raya pun rugi | Risk level naik ke SEDANG/TINGGI |

---

## 🎊 Kalender Hari Raya Bali

Sistem secara otomatis menghitung countdown ke **Galungan** berikutnya (siklus 210 hari / Pawukon):

```
Galungan 2026:
  - Periode 1: 7 Januari 2026
  - Periode 2: 6 Juli 2026
```

Harga babi di Bali historis naik **15–25%** saat Galungan dan Kuningan. Sistem memperhitungkan ini dalam rekomendasi timing panen.

---

## 📊 Contoh Data Real (dari PRD)

Siklus Ternak Ayu — Baseline:
```
Bibit:    2 pejantan @ Rp 1.800.000 + 2 betina @ Rp 1.700.000 = Rp 7.000.000
Pakan:    Glower 50kg @ Rp 385.000 | 4 ekor × 1kg × 3x/hari = 12 kg/hari
Durasi:   4 bulan → 29 karung → Rp 11.165.000
─────────────────────────────────────────────────────────────────
Total Modal:    Rp 18.165.000
Skenario Normal (38k/kg):    400kg × 38.000 = Rp 15.200.000 → RUGI Rp 2.965.000
Skenario Hari Raya (45k/kg): 400kg × 45.000 = Rp 18.000.000 → Hampir Impas
BEP Harga: Rp 45.412/kg

Rekomendasi SPK: "Tunggu Hari Raya — atau tambah durasi 5 bulan (berat 110kg/ekor)"
```

---

## 🔄 Roadmap

### ✅ Phase 1 — MVP (Selesai)
- [x] 6 Modul lengkap (Bibit, Pakan, Timeline, Kalkulasi, SPK, Laporan)
- [x] Single user dengan localStorage
- [x] Grafik interaktif (Chart.js)
- [x] Export PDF
- [x] Kalender Galungan otomatis
- [x] Responsive design (desktop + mobile)
- [x] Seed data demo Ayu

### 🔲 Phase 2 — Cloud & Multi-User
- [ ] Migrasi ke database cloud (Supabase / PostgreSQL)
- [ ] Auth email/password (Supabase Auth)
- [ ] Multi-user (keluarga/kelompok ternak)
- [ ] Hosting di Vercel (CI/CD dari GitHub)
- [ ] WhatsApp/email alert saat timing panen tiba

### 🔲 Phase 3 — Advanced
- [ ] AI price prediction (ML model harga 2 minggu ke depan)
- [ ] Supplier pakan marketplace
- [ ] IoT sensors (suhu kandang, berat babi otomatis)
- [ ] Mobile app (React Native / Flutter)

---

## 🌐 Panduan Hosting (GitHub + Vercel)

> Lihat bagian **[HOSTING.md](#)** atau ikuti panduan di bawah ini.

### Opsi A — Vercel (Gratis, Paling Mudah)
```
Cocok untuk: Phase 1 (localStorage, no backend)
Biaya: GRATIS selamanya untuk static site
```
1. Upload folder `v1/` ke GitHub repository
2. Login ke [vercel.com](https://vercel.com) dengan akun GitHub
3. Import repository → Deploy → Selesai!
4. Dapat URL: `https://spk-ternak-babi.vercel.app`

### Opsi B — GitHub Pages (Gratis)
```
Cocok untuk: Phase 1 (localhost storage, no backend)
Biaya: GRATIS
```
```bash
git init
git add .
git commit -m "Initial SPK Ternak Babi"
git remote add origin https://github.com/username/spk-ternak-babi.git
git push -u origin main
# Lalu aktifkan GitHub Pages di Settings repo
```

### Opsi C — Vercel + Supabase (Phase 2)
```
Cocok untuk: Multi-user, cloud storage, backup data
Biaya: Gratis (Supabase free tier 500MB, Vercel free tier)
```
- **Supabase**: Cloud PostgreSQL database, Auth, real-time
- **Vercel**: Hosting frontend (atau Next.js fullstack)
- Butuh migrasi kode dari localStorage ke Supabase API

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Data hilang saat clear browser | Gunakan hosting cloud (Phase 2) |
| Chart tidak muncul | Pastikan koneksi internet (Chart.js via CDN) |
| Tulisan tidak terbaca | Pastikan koneksi internet (Google Fonts via CDN) |
| File tidak bisa dibuka double-click | Gunakan local server (`python -m http.server`) |
| Export PDF kosong | Gunakan Chrome/Edge, aktifkan pop-up |

---

## 📝 Catatan Developer

- **Data disimpan di `localStorage` browser** — Data tidak tersinkron antar perangkat/browser. Untuk cloud sync, butuh Phase 2 (Supabase).
- **Tidak ada backend** — Semua kalkulasi berjalan 100% di sisi klien (JavaScript).
- **Offline capable** — Setelah pertama kali dibuka (fonts & Chart.js ter-cache), bisa digunakan offline.

---

## 👤 Owner & Kontak

| | |
|--|--|
| **Nama** | Ni Putu Ayu Lesparini |
| **Lokasi** | Gianyar, Bali |
| **Role** | Product Owner |
| **Status** | MVP Approved — Juni 2026 |

---

## 📄 Lisensi

Proyek ini bersifat **private** untuk kebutuhan pribadi/akademis. Tidak untuk distribusi komersial tanpa izin pemilik.

---

*SPK Ternak Babi v1.0 — Dibuat dengan ❤️ untuk peternak Bali*
