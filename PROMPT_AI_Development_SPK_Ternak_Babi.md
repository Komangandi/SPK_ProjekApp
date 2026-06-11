# AI Agent Development Prompt: SPK Ternak Babi Web App

**Instruksi:** Copy seluruh konten file ini ke Claude (atau LLM development tool favorit Anda) dan ikuti langkah per fase.

---

## FASE 1: SETUP & ARCHITECTING (Hari 1–2)

**Tujuan:** Setup project, define tech stack, dan buat boilerplate/scaffold.

**Prompt untuk AI:**

```
Saya mau kamu develop web app bernama "SPK Ternak Babi" — Decision Support System untuk peternak babi skala kecil di Bali.

### Konteks Produk
- Single user app (MVP): Ayu — peternak babi 4 ekor di Gianyar, Bali.
- Fitur: Track bibit → pakan → timeline ternak → kalkulasi profit → rekomendasi SPK → laporan PDF.
- Tech Stack: React.js (TypeScript) + Node.js/Express + PostgreSQL + Tailwind CSS + Recharts.
- Durasi: 6 minggu.

### Phase 1 Task: Setup & Architecture
Buatkan:

1. **Project Structure:**
   - Frontend folder structure (src/components, src/pages, src/hooks, src/types, src/services, src/styles).
   - Backend folder structure (routes, models, controllers, middleware, config, utils).
   - Database migrations template (PostgreSQL).

2. **Environment Setup:**
   - .env.example untuk frontend (API_BASE_URL, env vars).
   - .env.example untuk backend (DB_URL, JWT_SECRET, PORT).
   - Docker Compose (optional) untuk PostgreSQL + local dev.

3. **Database Schema** (PostgreSQL):
   - Tabel: users, cycles, bibit_data, pakan_data, timeline_data, kalkulasi_data, rekomendasi_data, laporan_data.
   - Include: primary keys, foreign keys, timestamps (createdAt, updatedAt).

4. **API Contract** (REST endpoints):
   - POST /auth/register → register peternak.
   - POST /auth/login → login, return JWT.
   - GET /cycles → list all cycles.
   - POST /cycles → create new cycle.
   - GET /cycles/:id → detail siklus.
   - PUT /cycles/:id → update siklus.
   - POST /cycles/:id/calculate → trigger kalkulasi profit.
   - GET /cycles/:id/report → generate laporan.
   - (dst untuk setiap modul).

5. **Component Wireframe** (React):
   - Layout utama: Header (logout button), Sidebar (nav ke 6 modul), Main content area.
   - Pages: Dashboard, CreateCycleWizard (6 steps), CycleDetail, ReportPage.
   - Reusable components: InputField, Card, Button, Chart, Modal, etc.

Jangan generate code dulu — hanya struktur, schema, dan kontrak API. Output dalam format markdown atau text saja.
```

**Expected Output dari AI:** Folder structure, database schema SQL, API endpoints list, component wireframe. Save sebagai dokumentasi.

---

## FASE 2: BACKEND DEVELOPMENT (Hari 3–10)

**Tujuan:** Build Node.js/Express API dengan semua endpoints, logic kalkulasi, dan auth.

**Prompt untuk AI:**

```
Sekarang kita build backend. Use Express.js, Sequelize (ORM), PostgreSQL.

### Requirements:

**1. Auth Module (middleware):**
   - JWT token generation & validation.
   - Password hashing (bcrypt).
   - Middleware: verifyToken (protect endpoints).

**2. Models (Sequelize models):**
   - User: id, email, password_hash, nama, lokasi, createdAt.
   - Cycle: id, userId, status (ongoing/completed), tglMasuk, durationMonths, createdAt.
   - BibitData: id, cycleId, jumlahJantan, hargaJantan, jumlahBetina, hargaBetina, totalModal.
   - PakanData: id, cycleId, jenisPakan, hargaPerKarung, beratPerKarung, porsiPerEkor, frekuensiPerHari, totalKonsumsi, totalKarungs, totalBiaya.
   - TimelineData: id, cycleId, tglMasukBibit, durationMonths, estimasiBerat, targetTglPanen, totalBeratPanen, progressPercent.
   - KalkulasiData: id, cycleId, totalModalBibit, totalBiayaPakan, totalModal, hargaMin, hargaMax, totalBeratPanen, scenarios (JSON).
   - RekomendasiData: id, cycleId, rekomendasi (text), shouldProceed, riskLevel, breakEvenPrice.
   - LaporanData: id, cycleId, summaryCards (JSON), charts (JSON), historySiklus (JSON).

**3. Controllers & Routes:**
   - AuthController: register, login.
   - CycleController: create, getAll, getById, update, delete.
   - BibitController: update bibit data per cycle.
   - PakanController: add/update pakan data.
   - TimelineController: update timeline.
   - KalkulasiController: calculate profit (POST /cycles/:id/calculate).
   - RekomendasiController: generate SPK recommendation.
   - LaporanController: generate report (GET /cycles/:id/report).

**4. Calculation Logic (Modul 4):**
   Input: bibit data, pakan data, timeline, harga pasar.
   Output: total modal, scenarios (normal + hari raya), margin, ROI, break-even.
   
   Formula:
   ```
   Konsumsi harian = jumlah_ekor × porsi × frekuensi
   Konsumsi total = konsumsi_harian × durasi_hari
   Karung = ceil(konsumsi_total / berat_karung)
   Biaya pakan = karung × harga_per_karung
   Total modal = modal_bibit + biaya_pakan
   
   For each skenario (harga):
     Penjualan = total_berat_panen × harga_per_kg
     Margin = penjualan - total_modal
     ROI% = (margin / total_modal) * 100
   ```

**5. Rekomendasi Logic (Modul 5):**
   - If margin terbaik > 0: "Lanjut invest."
   - If penjualan hari raya > penjualan normal + 15%: "Tunggu hari raya untuk panen."
   - Risk: If modal > penjualan normal: "Risko tinggi — hanya untung kalau hari raya."
   - Break-even harga: hitung harga min supaya impas.

**6. Error Handling & Validation:**
   - Request validation (joi atau zod).
   - Error responses (400, 401, 404, 500 dengan message).
   - Try-catch di setiap endpoint.

**7. Database Migrations:**
   - Sequelize migration files untuk setup tabel.
   - Seed data (optional) untuk testing.

Generate code lengkap (tidak mock) untuk semua di atas. Output: folder backend/src dengan structure lengkap.
```

**Expected Output:** Full backend code (routes, models, controllers, middleware, logic). Test dengan Postman atau curl.

---

## FASE 3: FRONTEND DEVELOPMENT (Hari 11–18)

**Tujuan:** Build React UI dengan semua modul, form, chart, dan dashboard.

**Prompt untuk AI:**

```
Sekarang frontend. Use React (TypeScript), React Router, Tailwind CSS, Recharts, React Hook Form.

### Requirements:

**1. Authentication Pages:**
   - Login page (email + password form).
   - Register page (nama + email + password).
   - Redirect ke dashboard kalau sudah login (JWT check).

**2. Dashboard Page:**
   - Welcome message: "Halo Ayu, selamat datang di SPK Ternak Babi!"
   - Card: Statistik (jumlah siklus, margin rata-rata, siklus ongoing).
   - Button: "Mulai Siklus Baru" → navigate ke wizard.
   - List: Riwayat siklus (table dengan tgl masuk, status, modal, margin).

**3. Create Cycle Wizard (6 steps):**
   - Step 1 (Modul 1): Input bibit (jantan/betina, harga). Form + save.
   - Step 2 (Modul 2): Input pakan (jenis, harga, porsi, frekuensi). Auto-calculate konsumsi per bulan. Tabel preview 1–5 bulan.
   - Step 3 (Modul 3): Input timeline (tgl masuk, durasi, berat target). Show timeline visual.
   - Step 4 (Modul 4): Review modal & kalkulasi (auto-fetch dari BE). Tabel skenario (normal + hari raya).
   - Step 5 (Modul 5): Lihat rekomendasi SPK + risk assessment.
   - Step 6 (Modul 6): Preview laporan. Button: "Selesaikan & Simpan" → POST /cycles.
   - Navigation: Next/Prev buttons, progress bar (Step X of 6).

**4. Cycle Detail Page (monitor ongoing cycle):**
   - Timeline visual: hari ke berapa, % progress.
   - Cards: Modal awal, Biaya pakan, Total modal, Break-even harga.
   - Input form: Update harga penjualan (untuk re-calculate profit).
   - Button: "Panen & Finalisasi" → confirm dialog + update cycle status.

**5. Report Page:**
   - Summary cards: Modal, Biaya pakan, Penjualan, Margin, ROI.
   - Charts (Recharts):
     - Pie: Modal breakdown (bibit vs pakan).
     - Line: Biaya kumulatif per bulan vs estimasi revenue.
     - Bar: Skenario penjualan (normal vs hari raya).
   - List: Riwayat siklus (completed cycles).
   - Button: "Export PDF" → trigger PDF generation (jsPDF + html2canvas).

**6. Components (Reusable):**
   - InputField: text, number, date, select dengan validation.
   - Card: bordered card dengan title & content.
   - Button: primary, secondary, danger styles.
   - Chart wrappers: ChartRevenue, ChartModal, ChartScenario.
   - Modal: untuk confirm, alerts.
   - Header: logout button, user nama.
   - Sidebar: nav link ke pages.

**7. Hooks (Custom):**
   - useAuth: manage login state, JWT.
   - useCycle: fetch/update cycle data.
   - useKalkulasi: trigger calculation API.
   - useForm: manage form state (React Hook Form).

**8. Services (API client):**
   - api.ts: axios instance dengan JWT header.
   - authService: register, login, logout.
   - cycleService: CRUD cycles.
   - kalkulasiService: calculate, getScenarios.
   - reportService: generate report, exportPDF.

**9. Styling:**
   - Tailwind CSS (utility-first).
   - Color scheme: sesuai brand (biru/hijau, professional).
   - Responsive: mobile-first, breakpoint sm/md/lg/xl.
   - Dark mode support (optional untuk fase 2).

**10. Forms & Validation:**
   - React Hook Form untuk semua input.
   - Validation schema (Zod atau Yup).
   - Error messages inline.
   - Loading states (spinner saat submit).

Generate code lengkap (tidak mock) untuk semua di atas. Output: folder frontend/src dengan structure lengkap.
```

**Expected Output:** Full React app dengan all pages, components, hooks. Test locally dengan `npm start`.

---

## FASE 4: INTEGRATION & TESTING (Hari 19–22)

**Tujuan:** Connect frontend ↔ backend, test workflows, fix bugs.

**Prompt untuk AI:**

```
Integration phase. Connect React frontend to Node.js backend API.

### Tasks:

**1. API Integration Checklist:**
   - Login/Register: test JWT flow (token stored in localStorage).
   - Create cycle: test wizard flow end-to-end.
   - Fetch cycle: test data display.
   - Calculate: test API call & chart rendering.
   - Generate report: test PDF export.

**2. Testing:**
   - Manual testing: test all workflows (create cycle, monitor, panen, export).
   - Edge cases: invalid input, network error, concurrent requests.
   - Performance: check API response time, chart rendering speed.

**3. Bug Fixes:**
   - Fix any API errors (400, 500).
   - Fix UI bugs (form validation, chart display, responsiveness).
   - Fix data consistency (frontend vs backend state).

**4. Deployment Prep:**
   - Frontend: build & deploy to Vercel.
   - Backend: deploy to Railway or Heroku.
   - Database: PostgreSQL hosted (Supabase, RDS, Railway).
   - Environment variables: configure for production.

Provide:
- Integration test checklist (manual).
- Deployment guide (step-by-step).
- Troubleshooting common issues.
```

**Expected Output:** Full working app (frontend + backend), deployed to production URLs.

---

## FASE 5: DOCUMENTATION & HANDOVER (Hari 23–24)

**Tujuan:** Document code, user guide, maintenance guide.

**Prompt untuk AI:**

```
Final phase: Documentation & handover.

### Deliverables:

**1. Code Documentation:**
   - README.md (frontend & backend): setup, run, deploy.
   - API documentation (endpoints, params, responses).
   - Component library (Storybook optional).
   - Database schema diagram (ERD).

**2. User Guide:**
   - Quick start guide (login, create cycle).
   - Step-by-step walkthrough untuk setiap modul.
   - FAQ (harga berubah, durasi ternak berapa, dll).
   - Video tutorial (optional).

**3. Maintenance Guide:**
   - How to add new pakan SKU.
   - How to update harga pakan/penjualan.
   - How to backup data.
   - Common troubleshooting.

**4. Future Roadmap:**
   - Phase 2 features (multi-user, alerts, history trend).
   - Phase 3 features (AI prediction, IoT, marketplace).

Provide all docs as markdown files + PDF summaries.
```

**Expected Output:** Complete documentation package.

---

## QUICK REFERENCE: Key Data Models

### User
```json
{
  "id": "uuid",
  "email": "ayu@example.com",
  "password_hash": "hashed",
  "nama": "Ni Putu Ayu Lesparini",
  "lokasi": "Gianyar, Bali"
}
```

### Cycle (Siklus Ternak)
```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "ongoing|completed",
  "tglMasuk": "2026-06-01",
  "durationMonths": 4,
  "createdAt": "2026-06-01"
}
```

### BibitData
```json
{
  "cycleId": "uuid",
  "jumlahJantan": 2,
  "hargaJantan": 1800000,
  "jumlahBetina": 2,
  "hargaBetina": 1700000,
  "totalModal": 7000000
}
```

### KalkulasiData
```json
{
  "cycleId": "uuid",
  "totalModalBibit": 7000000,
  "totalBiayaPakan": 11165000,
  "totalModal": 18165000,
  "scenarios": [
    {
      "nama": "Musim normal",
      "hargaPerKg": 38000,
      "penjualan": 15200000,
      "margin": -2965000,
      "roi": -16.3,
      "status": "rugi"
    },
    {
      "nama": "Musim hari raya",
      "hargaPerKg": 45000,
      "penjualan": 18000000,
      "margin": -165000,
      "roi": -0.9,
      "status": "hampir impas"
    }
  ]
}
```

---

## Testing Checklist (Manual)

- [ ] Register & login work.
- [ ] Create new cycle (wizard 6 steps) completes.
- [ ] Modal calculation accuracy (manual verify dengan kalkulator).
- [ ] Charts render correctly (Recharts no errors).
- [ ] PDF export works (jsPDF).
- [ ] Update harga pasar → recalculate profit.
- [ ] Responsive design (test mobile 375px, tablet 768px, desktop 1920px).
- [ ] Error handling (test API down, invalid input, etc).
- [ ] Performance (page load < 2s, API response < 500ms).

---

## Deployment Commands (Vercel + Railway)

**Frontend (Vercel):**
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts, connect to GitHub repo
```

**Backend (Railway):**
```bash
railway login
railway init
# Follow prompts, deploy
railway logs # check logs
```

**Database (Supabase):**
```
https://supabase.com → create account → create project → get DATABASE_URL
```

---

## Support & Troubleshooting

**Common Issues:**

1. **"Cannot find module 'express'"** → `npm install` di backend folder.
2. **"Connection refused on port 5432"** → PostgreSQL not running. Start with `docker-compose up` atau install PostgreSQL.
3. **"CORS error"** → Add CORS middleware di Express: `app.use(cors())`.
4. **"JWT expired"** → Clear localStorage & re-login.
5. **"Chart not rendering"** → Check data format, console errors.

---

## Final Notes for AI Agent

- **Code Quality:** Write clean, readable code (proper naming, comments, DRY principle).
- **Security:** Never hardcode secrets, validate all inputs, use HTTPS.
- **Performance:** Optimize queries (database indexes), lazy load components.
- **Scalability:** Design for future multi-user (prepare for Phase 2).
- **Testing:** Write tests for critical logic (calculation, auth).

---

## Start Here

**Begin with Phase 1 prompt above.** Copy & paste to Claude, wait for output, review. Then proceed to Phase 2, etc.

Good luck! 🚀
```

---

**NOTE FOR AI AGENT DEVELOPER:**

Gunakan file `PRD_SPK_Ternak_Babi.md` (yang sudah dibuat sebelumnya) sebagai reference document selama development. Setiap kali ada pertanyaan tentang requirements, kembali ke PRD.

Struktur fase di atas sudah granular dan bisa disesuaikan dengan timeline actual development.
