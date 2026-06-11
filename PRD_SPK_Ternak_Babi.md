# PRD: Sistem Pendukung Keputusan Ternak Babi (SPK Ternak Babi)

**Versi:** 1.0  
**Status:** Approved for Development  
**Owner:** Ni Putu Ayu Lesparini  
**Created:** Juni 2026  
**Target Launch:** Q3 2026

---

## 1. Executive Summary

SPK Ternak Babi adalah aplikasi web berbasis browser yang dirancang khusus untuk membantu peternak babi skala kecil di Bali (1–20 ekor) dalam mengambil keputusan investasi ternak yang menguntungkan. Sistem ini mengintegrasikan pencatatan data bibit, pakan, timeline ternak, kalkulasi otomatis keuntungan/rugi, dan rekomendasi berbasis data—dengan sensitivitas terhadap musim hari raya (Galungan, Kuningan) yang mempengaruhi harga jual dan harga pakan secara dramatis.

**Target User:** Peternak babi individu atau kelompok kecil, terutama di Bali, yang mengelola 4–20 ekor.

**Core Value Proposition:** Dari modal awal hingga penjualan, peternak bisa mengetahui dengan akurat apakah investasi ternak akan menguntungkan sebelum dimulai, dan bisa memonitor siklus ternak secara real-time.

---

## 2. Problem Statement

### 2.1 Masalah Utama
- **Ketidakpastian keuntungan:** Peternak tidak punya tools untuk kalkulasi cepat apakah suatu siklus ternak akan menguntungkan.
- **Fluktuasi harga musiman:** Di Bali, harga babi hidup berfluktuasi drastis (38–45 ribu/kg normal, bisa lebih tinggi saat hari raya). Harga pakan juga naik saat demand tinggi.
- **Pencatatan manual:** Saat ini menggunakan catatan tangan atau spreadsheet sederhana → mudah salah hitung, sulit tracking siklus panjang.
- **Kurangnya insight:** Tidak ada rekomendasi otomatis apakah "sekarang cocok panen atau tunggu harga naik."

### 2.2 Konteks Bisnis
- Ayu mulai dengan indukan, sekarang beralih ke model beli bibit → pengemukan.
- Bibit sekarang: 2 pejantan (Rp 1.8 juta/ekor) + 2 betina (Rp 1.7 juta/ekor) = modal awal Rp 7 juta.
- Pakan: Glower 50 kg @ Rp 385 ribu; konsumsi 4 ekor = 12 kg/hari.
- Durasi ternak: 3–5 bulan tergantung musim demand.

---

## 3. Product Overview

### 3.1 Deskripsi Produk
SPK Ternak Babi adalah platform web responsif (desktop & mobile) yang berjalan di browser tanpa instalasi. User login dengan akun sederhana (email), lalu bisa mulai input data ternak, pakan, durasi, harga pasar, dan sistem akan otomatis kalkulasi keuntungan serta memberikan rekomendasi keputusan (lanjut/jangan, waktu panen optimal, pakan mana yang efisien).

### 3.2 Fitur Utama
- **Modul 1:** Pencatatan data bibit & estimasi modal awal.
- **Modul 2:** Manajemen pakan (jenis, harga, frekuensi konsumsi).
- **Modul 3:** Timeline ternak (tanggal masuk, target panen, tracking progress).
- **Modul 4:** Kalkulasi otomatis keuntungan/rugi & margin.
- **Modul 5:** Rekomendasi SPK (kapan panen, apa strategi pakan, risk assessment musiman).
- **Modul 6:** Laporan & grafik (riwayat siklus, analisis biaya vs revenue, export PDF).

### 3.3 Scope
**In Scope:**
- 1 user (pemilik/Ayu) — autentikasi minimal.
- 6 modul sebagaimana deskripsi di atas.
- Data persistence (database sederhana).
- Harga pakan & penjualan dapat diupdate sesuai musim.
- Laporan PDF & grafik interaktif.
- Responsive design (desktop, tablet, mobile).

**Out of Scope:**
- Multi-user collaboration / role-based access.
- Integrasi dengan supplier pakan.
- IoT sensors untuk monitoring suhu/berat babi.
- AI predictive pricing (phase 2).
- Mobile app native — web-based dulu.

---

## 4. User Personas

### Persona 1: Ayu — Peternak Skala Kecil Bali
- **Background:** Finance Admin + peternak babi (4 ekor saat ini, rencana expand).
- **Goals:** 
  - Tahu akurat apakah siklus ternak profitable sebelum dimulai.
  - Monitor biaya harian dan margin keuntungan real-time.
  - Buat keputusan panen berdasarkan harga pasar vs modal.
- **Pain Points:**
  - Harga pakan & penjualan berfluktuasi musiman.
  - Menghitung manual pakan 4 ekor 3x/hari = rawan salah.
  - Tidak punya baseline untuk ROI ternak.
- **Tech Savviness:** Medium (mahir spreadsheet, familiar web app).
- **Usage:** Minimal 1x/minggu (input data), daily saat tracking.

---

## 5. Requirements & Features

### 5.1 Modul 1: Data Ternak & Modal Bibit

**User Story:**
> Sebagai peternak, saya ingin input data bibit saya (jumlah, harga per ekor, jenis jantan/betina) supaya sistem otomatis hitung modal awal.

**Requirements:**
- Form input: jumlah pejantan, harga/ekor; jumlah betina, harga/ekor.
- Tipe ternak: pembibitan vs pengemukan (dropdown).
- Estimasi umur bibit yang dibeli (tanggal start ternak).
- Auto-calculate: **Total Modal Bibit = (jantan × harga) + (betina × harga)**.
- Validasi: harga > 0, jumlah > 0.
- Display: ringkasan kartu (jumlah ekor, modal awal, durasi tanggung dari penjual).
- Ability to update harga jika bibit beli di waktu berbeda.

**Data Fields:**
```
- id: UUID
- userId: string (FK to users)
- tglInput: date
- jumlahJantan: int
- hargaJantan: decimal
- jumlahBetina: int
- hargaBetina: decimal
- tipeTernak: enum ['pembibitan', 'pengemukan']
- estimasiUmurBibit: int (hari)
- totalModalBibit: decimal (computed)
- catatan: text
```

---

### 5.2 Modul 2: Pakan & Pemeliharaan

**User Story:**
> Sebagai peternak, saya ingin input jenis pakan (SKU, harga per karung), porsi makan per ekor, dan frekuensi — sistem otomatis hitung berapa karung per bulan & biaya total.

**Requirements:**
- Form input: 
  - Jenis pakan (Glower, 551, custom; dropdown atau text field).
  - Harga per karung (default 50 kg).
  - Berat per karung (default 50, editable).
  - Porsi per ekor per makan (kg).
  - Frekuensi per hari (default 3x).
- Auto-calculate:
  - **Konsumsi per hari = jumlah_ekor × porsi × frekuensi (kg)**.
  - **Konsumsi per bulan = konsumsi_hari × 30 (kg)**.
  - **Karung per bulan = ceil(konsumsi_bulan / berat_karung)**.
  - **Biaya pakan per bulan = karung × harga_karung**.
- Tabel preview: 1, 2, 3, 4, 5 bulan — tampilkan kebutuhan karung & biaya per periode.
- Ability to add multiple pakan SKU (misal, pakan pokok + suplemen).
- Update harga pakan kapan saja (untuk tracking musiman).

**Data Fields:**
```
- id: UUID
- cycleId: UUID (FK to cycle)
- jenisPakan: string
- hargaPerKarung: decimal
- beratPerKarung: int (default 50)
- porsiPerEkor: decimal (kg)
- frekuensiPerHari: int (default 3)
- durationMonths: int
- totalKonsumsiKg: decimal (computed)
- totalKarungs: int (computed)
- totalBiayaPakan: decimal (computed)
- tglUpdate: date
```

---

### 5.3 Modul 3: Timeline Ternak & Tracking

**User Story:**
> Sebagai peternak, saya ingin track kapan bibit masuk kandang, estimasi berat panen, dan durasi ternak — agar tahu kapan panen untuk maksimalkan harga.

**Requirements:**
- Form input:
  - Tanggal masuk bibit ke kandang (date picker).
  - Estimasi durasi ternak (3–6 bulan, slider atau text).
  - Estimasi berat per ekor saat panen (kg; default 100).
  - Target tanggal panen (auto-calculated dari durasi, tapi editable).
- Display timeline:
  - Hari ke-0 (bibit masuk) ← Hariini → Hari ke-N (target panen).
  - Milestone: minggu 2 (sesuai), minggu 4 (cek kesehatan), hari panen.
- Calculation: **Total berat panen = jumlah_ekor × berat_per_ekor (kg)**.
- Ability to adjust target panen date based on market harga (misal tunggu sampai hari raya).
- Progress tracker: % harian (hari ke berapa sekarang vs target).

**Data Fields:**
```
- id: UUID
- cycleId: UUID
- tglMasukBibit: date
- durationMonths: int
- estimasiBerat: decimal (kg per ekor)
- targetTglPanen: date (computed, editable)
- totalBeratPanen: decimal (computed)
- currentPhase: enum ['intro', 'growth', 'finishing', 'ready_harvest']
- progressPercent: int (computed)
- notes: text
```

---

### 5.4 Modul 4: Kalkulasi Keuntungan & Modal

**User Story:**
> Sebagai peternak, saya ingin sistem otomatis hitung total modal (bibit + pakan) dan prediksi keuntungan per skenario harga penjualan (normal 38rb/kg vs hari raya 45rb/kg).

**Requirements:**
- Agregasi data dari Modul 1 & 2:
  - **Total Modal = Modal Bibit + (Biaya Pakan × Durasi)**.
- Input tambahan: harga penjualan per kg (musiman):
  - Range normal: 30–50 ribu/kg (bisa update based on pasar).
  - Slider untuk simulasi harga.
- Kalkulasi per skenario:
  - **Penjualan = Total Berat Panen × Harga Per Kg**.
  - **Margin = Penjualan − Total Modal**.
  - **ROI % = (Margin / Total Modal) × 100**.
  - **Break-even = Total Modal / Total Berat Panen (Rp/kg)**.
- Tabel skenario: 
  | Skenario | Harga/kg | Penjualan | Modal | Margin | Status |
  | Normal | 38k | Rp X | Rp Y | Rp Z | ✓/✗ |
  | Hari Raya | 45k | Rp X | Rp Y | Rp Z | ✓/✗ |
- Visualisasi: bar chart penjualan vs modal (highlight margin).
- Highlight skenario terbaik (highest margin).

**Data Fields:**
```
- id: UUID
- cycleId: UUID
- totalModalBibit: decimal
- totalBiayaPakan: decimal
- totalModal: decimal (computed)
- hargaPenjualanMin: decimal
- hargaPenjualanMax: decimal
- totalBeratPanen: decimal
- scenarios: array of {nama, hargaPerKg, penjualan, margin, roi, status}
- bestScenario: string (computed)
```

---

### 5.5 Modul 5: Rekomendasi SPK

**User Story:**
> Sebagai peternak, saya ingin sistem beri rekomendasi keputusan: apakah invest ini profitable, kapan panen optimal, pakan mana yang efisien, risk apa saat musim tertentu.

**Requirements:**
- Rekomendasi otomatis berdasarkan threshold:
  - **Profitable?** Jika margin terbaik > 0 → "Lanjut invest"; jika ≤ 0 → "Pertimbangkan ulang."
  - **Timing panen:** Jika hari raya margin 20% lebih tinggi → "Tunggu hari raya"; jika tidak → "Panen kapan siap (harga stabil)."
  - **Efisiensi pakan:** Bandingkan harga per kg pakan (berbagai SKU) → "Glower 551 lebih mahal 5% dibanding Glower standar, tapi hasil lebih cepat 2 minggu."
- Risk assessment:
  - **Musim:** "Galungan/Kuningan datang 6 minggu lagi — harga pakan naik historis 15%, penjualan naik 18%. Siklus 4 bulan cocok panen saat hari raya."
  - **Volatility:** Jika harga pakan naik 10%, margin turun jadi Rp X → "Risko sedang."
  - **Break-even:** "Harus jual minimal 38k/kg agar impas. Harga sekarang 40k → aman margin 2k/kg."
- Insight cards (dalam SPK module):
  - Skenario terbaik (hari raya vs normal).
  - ROI & payback period.
  - Break-even harga.
  - Critical risk (musim).

**Data Fields:**
```
- id: UUID
- cycleId: UUID
- rekomendasi: string (generated recommendation text)
- shouldProceed: boolean
- optimalTimePanen: date
- riskLevel: enum ['rendah', 'sedang', 'tinggi']
- riskFactors: array of string
- breakEvenPrice: decimal
- profitabilityScore: float (0–1)
- insights: array of string
```

---

### 5.6 Modul 6: Laporan & Grafik

**User Story:**
> Sebagai peternak, saya ingin lihat laporan ringkas per siklus ternak (biaya vs revenue), grafik trend historis, dan bisa export PDF untuk record.

**Requirements:**
- Dashboard per siklus:
  - Card: Modal awal, Biaya pakan, Total modal, Penjualan (best case), Margin, ROI.
  - Chart 1: Pie chart (Modal breakdown: bibit vs pakan).
  - Chart 2: Line chart (Biaya kumulatif per bulan vs estimasi revenue).
  - Chart 3: Bar chart (Skenario harga: normal vs hari raya — penjualan & margin).
- Riwayat siklus (list/timeline):
  - Siklus 1: Tgl masuk — tgl panen, modal, penjualan, margin.
  - Siklus 2, 3, ...
  - Filter by: tahun, status (ongoing/completed).
- Export PDF:
  - Ringkas laporan siklus (modal breakdown, skenario, rekomendasi, grafik).
  - Include: tanggal ternak, durasi, penjualan actual (jika sudah panen), notes.
- Analisis trend:
  - "Siklus 1–3, margin rata-rata 20%, trend naik/turun?"
  - "Pakan yang paling cost-effective?"

**Data Fields:**
```
- id: UUID
- cycleId: UUID
- tglGenerate: date
- summaryCards: object {modalAwal, biayadPakan, totalModal, etc}
- charts: array of {type, data}
- historySiklus: array of {cycleId, tglMasuk, tglPanen, modal, penjualan, margin}
- trend: string (generated insight)
- reportPdf: blob (generated on demand)
```

---

## 6. Data Model & Architecture

### 6.1 Entity Relationship
```
users
  ├── cycles (1:M)
  │   ├── bibit_data (1:1)
  │   ├── pakan_data (1:M) — multiple SKU pakan per cycle
  │   ├── timeline_data (1:1)
  │   ├── kalkulasi_data (1:1)
  │   ├── rekomendasi_data (1:1)
  │   └── laporan_data (1:1)
```

### 6.2 Database Tables (PostgreSQL assumed)
- `users` — login, email, nama peternak, lokasi (Bali).
- `cycles` — per siklus ternak (start date, status).
- `bibit_data` — modal bibit per cycle.
- `pakan_data` — pakan input per cycle (multiple SKU).
- `timeline_data` — tanggal masuk, target panen, progress.
- `kalkulasi_data` — modal total, skenario penjualan, margin.
- `rekomendasi_data` — SPK output.
- `laporan_data` — generated report, grafik, PDF.

### 6.3 Tech Stack
- **Frontend:** React.js (TypeScript), Tailwind CSS, Recharts (grafik), jsPDF (export).
- **Backend:** Node.js + Express (or Python FastAPI), REST API.
- **Database:** PostgreSQL.
- **Hosting:** Vercel (frontend) + Railway/Heroku (backend) atau full stack di satu VPS.
- **Auth:** JWT (email/password sederhana).

---

## 7. User Workflows

### 7.1 Flow: Mulai Siklus Baru
1. User login → Dashboard.
2. Click "Mulai Siklus Baru" → Wizard 6 steps.
3. Step 1 (Modul 1): Input bibit (jantan, betina, harga).
4. Step 2 (Modul 2): Input pakan (jenis, harga, porsi, frekuensi).
5. Step 3 (Modul 3): Input timeline (tanggal masuk, durasi, berat target).
6. Step 4 (Modul 4): Review modal & kalkulasi otomatis.
7. Step 5 (Modul 5): Lihat rekomendasi SPK.
8. Step 6 (Modul 6): Review laporan preview.
9. Save cycle → selesai.

### 7.2 Flow: Monitor Siklus Ongoing
1. User login → Dashboard → pilih siklus "Ongoing".
2. Lihat progress timeline (hari ke berapa, % durasi).
3. Update harga pasar (penjualan) jika ada perubahan.
4. Re-check rekomendasi (apakah timing panen sudah tepat?).
5. Lihat grafik biaya kumulatif vs target.

### 7.3 Flow: Panen & Finalisasi
1. Saat panen, user input: tanggal panen actual, berat actual, harga jual actual.
2. Sistem auto-calculate: penjualan actual, margin actual vs prediksi.
3. Marking siklus sebagai "Completed".
4. Generate laporan final + PDF.
5. Insight: "Margin prediksi Rp X, actual Rp Y. Penyimpangan Z% — improvement untuk siklus berikutnya?"

---

## 8. Success Metrics

| Metrik | Target | Baseline | Notes |
|--------|--------|----------|-------|
| Waktu input siklus baru | < 5 menit | Manual 30 menit | Efisiensi data entry |
| Akurasi kalkulasi | 100% | ~95% (manual) | Zero math errors |
| Rekomendasi SPK accuracy | 85%+ | N/A | Vs actual penjualan |
| User adoption | 1 user aktif | N/A | MVP: Ayu |
| Cycle completion rate | 90%+ | N/A | Cycles selesai tracked |
| Export PDF success | 100% | N/A | Laporan generatable |
| Response time API | < 500ms | N/A | User experience |

---

## 9. Constraints & Assumptions

### 9.1 Constraints
- **User base:** MVP = 1 user (Ayu). Scalability untuk multi-user future.
- **Harga pasar:** Input manual (tidak ada real-time API); update mingguan.
- **Pakan SKU:** Limited to common SKU di Bali (Glower, 551, dll).
- **Durasi ternak:** 3–6 bulan (fixed range).
- **Browser support:** Modern browsers (Chrome, Firefox, Safari, Edge).

### 9.2 Assumptions
- User selalu input data akurat & tepat waktu.
- Estimasi berat panen ±10% dari actual (akan di-recalibrate seiring cycles).
- Harga pakan & penjualan tidak berubah drastis mid-cycle (jika ada, user update manual).
- Biaya lain (vaksin, kandang, tenaga kerja) = 0 untuk MVP (bisa ditambah Phase 2).

---

## 10. Non-Functional Requirements

| Aspek | Requirement |
|-------|-------------|
| Performance | Page load < 2s, API response < 500ms |
| Availability | 99% uptime (allowance untuk maintenance) |
| Security | HTTPS, JWT auth, password hashing, SQL injection protection |
| Scalability | Support 10+ concurrent users (Phase 1); 100+ future |
| Accessibility | WCAG 2.1 AA (color contrast, keyboard nav, screen reader) |
| Mobile Responsive | Works on iPhone 12+, Android, iPad (375px–1920px viewport) |
| Data Backup | Daily automated backup to cloud |
| Browser Compatibility | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |

---

## 11. Roadmap & Phases

### Phase 1: MVP (6 minggu)
- ✓ Modul 1–6 fully functional.
- ✓ Single user (Ayu).
- ✓ Basic auth (email/password).
- ✓ CRUD operations per modul.
- ✓ Kalkulasi & rekomendasi otomatis.
- ✓ Grafik & export PDF.

### Phase 2: Refinement & Multi-User (2–3 bulan)
- Multi-user support (family/group ternak).
- Role-based access (owner, helper, advisor).
- Harga pasar historical data + trend line.
- SMS/WhatsApp alert (saat timing panen).
- Mobile app (React Native atau Flutter).

### Phase 3: Advanced (6+ bulan)
- AI price prediction (ML model → predict harga 2 minggu ke depan).
- Supplier marketplace (integrate pakan vendors).
- IoT sensors (temp, berat babi).
- Multi-cycle optimization (rekomendasi urutan ternak).

---

## 12. Glossary

| Term | Definisi |
|------|----------|
| Bibit | Babi muda yang akan ditanam/dikembangkan (jantan atau betina). |
| Pengemukan | Proses membesar babi dari bibit hingga siap jual (~4–5 bulan). |
| Siklus ternak | Periode dari bibit masuk hingga panen (3–6 bulan). |
| Modal bibit | Cost pembelian bibit awal (jantan + betina). |
| ROI | Return on Investment = (Keuntungan / Modal) × 100%. |
| Break-even | Harga jual minimum agar seimbang (margin = 0). |
| Musim hari raya | Galungan, Kuningan (kalender Hindu Bali); harga pabi & pakan naik drastis. |
| SPK | Sistem Pendukung Keputusan (Decision Support System). |

---

## 13. Sign-Off

| Role | Nama | Tanda Tangan | Tanggal |
|------|------|-------------|--------|
| Product Owner | Ni Putu Ayu Lesparini | ✓ | Juni 2026 |
| Tech Lead | [TBD] | — | — |
| Project Manager | [TBD] | — | — |

---

## Lampiran: Contoh Data Real

### Siklus Ternak Ayu (Baseline)
```
Modul 1 — Bibit:
  - 2 pejantan @ Rp 1.800.000 = Rp 3.600.000
  - 2 betina @ Rp 1.700.000 = Rp 3.400.000
  - Total = Rp 7.000.000

Modul 2 — Pakan:
  - Glower 50 kg @ Rp 385.000
  - 4 ekor × 1 kg × 3x/hari = 12 kg/hari
  - 1 bulan: ~360 kg → 8 karung → Rp 3.080.000
  - 4 bulan: ~1.440 kg → 29 karung → Rp 11.165.000

Modul 3 — Timeline:
  - Tgl masuk: 1 Juni 2026
  - Durasi: 4 bulan
  - Target panen: 1 Oktober 2026
  - Berat target: 100 kg/ekor → 400 kg total

Modul 4 — Kalkulasi:
  - Total Modal = Rp 7.000.000 + Rp 11.165.000 = Rp 18.165.000
  - Skenario normal (38k/kg): 400 kg × 38.000 = Rp 15.200.000 → Margin = -Rp 2.965.000 (rugi)
  - Skenario hari raya (45k/kg): 400 kg × 45.000 = Rp 18.000.000 → Margin = -Rp 165.000 (hampir impas)
  - Break-even: Rp 18.165.000 / 400 kg = 45.412/kg

Modul 5 — Rekomendasi:
  - Status: "Pertimbangkan ulang — profitability margin sangat tipis."
  - Saran: Durasi 5 bulan (berat 110 kg/ekor) untuk margin lebih baik, atau tunggu harga panen naik.

Modul 6 — Laporan:
  - Export PDF: Breakdown modal, grafik biaya vs revenue, skenario, rekomendasi, timeline.
```

---

**END OF PRD**
