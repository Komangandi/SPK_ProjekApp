/* ============================================================
   APP.JS — SPK TERNAK BABI
   Main Controller: Routing, Rendering, All Module UIs
   ============================================================ */

// ── State ─────────────────────────────────────────────────────
const App = {
  currentPage: 'dashboard',
  currentCycleId: null,
  wizardStep: 1,
  wizardData: {},
  charts: {},
};

// ── Router ────────────────────────────────────────────────────
function navigate(page, params = {}) {
  // Check auth
  if (page !== 'login' && !DB.getUser()) {
    renderLogin();
    return;
  }
  if (page === 'login' && DB.getUser()) {
    page = 'dashboard';
  }

  App.currentPage = page;
  Object.assign(App, params);

  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const content = document.getElementById('page-content');
  if (!content) return;

  // Destroy old charts
  Object.values(App.charts).forEach(c => { try { c.destroy(); } catch {} });
  App.charts = {};

  content.innerHTML = '';
  content.className = 'page-content fade-in';

  switch (page) {
    case 'dashboard':    renderDashboard(content); break;
    case 'wizard':       renderWizard(content); break;
    case 'detail':       renderDetail(content); break;
    case 'laporan':      renderLaporan(content); break;
    case 'harga-pasar':  renderHargaPasar(content); break;
    case 'riwayat':      renderRiwayat(content); break;
    default:             renderDashboard(content);
  }
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── Format Helpers ─────────────────────────────────────────────
const fmt = {
  rp: n => Kalkulasi.formatRp(n),
  rpFull: n => Kalkulasi.formatRpFull(n),
  pct: n => `${n > 0 ? '+' : ''}${n?.toFixed(1)}%`,
  num: n => (n || 0).toLocaleString('id-ID'),
  date: d => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
};

// ─────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────
function renderLogin() {
  document.getElementById('app-root').innerHTML = `
    <div class="login-page">
      <div class="login-card fade-in">
        <div class="login-logo">
          <div class="login-logo-icon">🐷</div>
          <h1>SPK Ternak Babi</h1>
          <p>Sistem Pendukung Keputusan Peternak Bali</p>
        </div>

        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Nama Peternak</label>
            <input type="text" class="form-control" id="inp-nama"
              placeholder="cth: Ni Putu Ayu Lesparini" value="Ni Putu Ayu Lesparini" required>
          </div>
          <div class="form-group">
            <label class="form-label">Lokasi Kandang</label>
            <input type="text" class="form-control" id="inp-lokasi"
              placeholder="cth: Gianyar, Bali" value="Gianyar, Bali" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email (opsional)</label>
            <input type="email" class="form-control" id="inp-email"
              placeholder="ayu@contoh.com" value="ayu@spkternak.id">
          </div>
          <div class="login-divider"><span>atau masuk langsung</span></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg">
            🚀 Masuk ke Sistem SPK
          </button>
        </form>

        <p style="text-align:center;margin-top:20px;font-size:0.75rem;color:var(--text-muted);">
          Data tersimpan di perangkat Anda secara lokal & aman.
        </p>
      </div>
    </div>
  `;
}

function handleLogin(e) {
  e.preventDefault();
  const nama = document.getElementById('inp-nama').value.trim();
  const lokasi = document.getElementById('inp-lokasi').value.trim();
  const email = document.getElementById('inp-email').value.trim();
  if (!nama || !lokasi) return toast('Nama dan lokasi wajib diisi', 'error');
  DB.setUser({ nama, lokasi, email });
  DB.seedDemo();
  initApp();
}

// ─────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────
function initApp() {
  const user = DB.getUser();
  if (!user) { renderLogin(); return; }

  const hariRaya = Kalkulasi.nextHariRaya();
  const cycles = DB.getCycles();
  const ongoingCount = cycles.filter(c => c.status === 'ongoing').length;

  document.getElementById('app-root').innerHTML = `
    <div class="app-shell">
      <!-- Sidebar Overlay (mobile) -->
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>

      <!-- Sidebar -->
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <a class="brand-logo" href="#" onclick="navigate('dashboard');return false;">
            <div class="brand-icon">🐷</div>
            <div class="brand-text">
              <h1>SPK Ternak Babi</h1>
              <span>Sistem Pendukung Keputusan</span>
            </div>
          </a>
        </div>

        <div class="sidebar-user">
          <div class="user-card">
            <div class="user-avatar">🧑‍🌾</div>
            <div class="user-info">
              <p>${user.nama.split(' ').slice(0,2).join(' ')}</p>
              <span>● ${user.lokasi}</span>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Utama</div>
          <a class="nav-item active" data-page="dashboard" href="#" onclick="navigate('dashboard');return false;">
            <span class="nav-icon">🏠</span> Dashboard
          </a>
          <a class="nav-item" data-page="riwayat" href="#" onclick="navigate('riwayat');return false;">
            <span class="nav-icon">📋</span> Riwayat Siklus
            ${ongoingCount > 0 ? `<span class="nav-badge">${ongoingCount}</span>` : ''}
          </a>

          <div class="nav-section-label">Modul SPK</div>
          <a class="nav-item" data-page="wizard" href="#" onclick="startNewCycle();return false;">
            <span class="nav-icon">➕</span> Siklus Baru
          </a>
          <a class="nav-item" data-page="laporan" href="#" onclick="navigate('laporan');return false;">
            <span class="nav-icon">📊</span> Laporan & Grafik
          </a>
          <a class="nav-item" data-page="harga-pasar" href="#" onclick="navigate('harga-pasar');return false;">
            <span class="nav-icon">💹</span> Harga Pasar
          </a>

          <div class="nav-section-label">Kalender</div>
          <div class="nav-item" style="cursor:default;opacity:0.8;">
            <span class="nav-icon">🎊</span>
            <div>
              <div style="font-size:0.78rem;color:var(--text-primary);">Galungan</div>
              <div style="font-size:0.68rem;color:var(--primary);">${hariRaya.daysUntil} hari lagi</div>
            </div>
          </div>
        </nav>

        <div class="sidebar-footer">
          <button class="btn-new-cycle" onclick="startNewCycle()">
            ➕ Mulai Siklus Baru
          </button>
          <button class="btn btn-secondary btn-full btn-sm" style="margin-top:8px;"
            onclick="handleLogout()">
            🚪 Keluar
          </button>
        </div>
      </nav>

      <!-- Main -->
      <div class="main-content">
        <header class="top-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="hamburger" onclick="toggleSidebar()" id="hamburger">☰</button>
            <div>
              <div class="header-title" id="header-title">Dashboard</div>
              <div class="header-subtitle" id="header-subtitle">Selamat datang kembali, ${user.nama.split(' ')[1] || user.nama}</div>
            </div>
          </div>
          <div class="header-actions">
            <div class="hari-raya-badge" onclick="navigate('harga-pasar')">
              <div class="pulse-dot"></div>
              🎊 Galungan ${hariRaya.daysUntil}h lagi
            </div>
            <button class="btn btn-primary btn-sm" onclick="startNewCycle()">
              ➕ Siklus Baru
            </button>
          </div>
        </header>

        <div id="page-content" class="page-content fade-in"></div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" id="modal-box">
        <div class="modal-header">
          <div class="modal-title" id="modal-title">Modal</div>
          <button class="btn btn-icon btn-secondary" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
        <div class="modal-footer" id="modal-footer"></div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container" id="toast-container"></div>
  `;

  navigate('dashboard');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}
function handleLogout() {
  if (confirm('Yakin ingin keluar? Data lokal tetap tersimpan.')) {
    DB.logout();
    renderLogin();
  }
}

function startNewCycle() {
  App.wizardStep = 1;
  App.wizardData = { hargaPasar: DB.getHargaPasar() };
  navigate('wizard');
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(title, body, footer = '') {
  document.getElementById('modal-title').innerHTML = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').innerHTML = footer;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
function renderDashboard(el) {
  document.getElementById('header-title').textContent = 'Dashboard';
  document.getElementById('header-subtitle').textContent = 'Ringkasan usaha peternakan Anda';

  const cycles = DB.getCycles();
  const ongoing = cycles.filter(c => c.status === 'ongoing');
  const completed = cycles.filter(c => c.status === 'completed');
  const hargaPasar = DB.getHargaPasar();
  const hariRaya = Kalkulasi.nextHariRaya();
  const user = DB.getUser();

  // Compute summary stats
  let totalModal = 0, totalRevenue = 0, avgROI = 0;
  completed.forEach(c => {
    const r = Kalkulasi.generateRekomendasi(c);
    if (r) {
      totalModal += r.totalModal || 0;
      if (c.actual?.penjualanActual) totalRevenue += c.actual.penjualanActual;
    }
  });
  if (completed.length > 0) {
    const margins = completed.map(c => {
      const r = Kalkulasi.generateRekomendasi(c);
      if (!r) return 0;
      const actM = c.actual?.marginActual;
      return actM !== undefined ? actM : r.bestScenario?.margin || 0;
    });
    avgROI = margins.reduce((a,b) => a+b, 0) / margins.length;
  }

  el.innerHTML = `
    <!-- Alert Hari Raya -->
    ${hariRaya.daysUntil <= 60 ? `
    <div class="alert-musim">
      <div class="alert-musim-icon">🎊</div>
      <div>
        <div class="alert-musim-title">Galungan ${hariRaya.dateStr} — ${hariRaya.daysUntil} Hari Lagi</div>
        <div class="alert-musim-desc">
          Harga babi cenderung naik 15–20% menjelang Galungan. ${ongoing.length > 0
            ? `Anda punya <strong>${ongoing.length} siklus berjalan</strong> — cek apakah timing panen bisa disesuaikan.`
            : 'Pertimbangkan memulai siklus baru sekarang agar siap panen saat hari raya.'
          }
        </div>
      </div>
    </div>` : ''}

    <!-- Stat Cards -->
    <div class="stat-grid">
      <div class="stat-card gold">
        <div class="stat-label">🐷 Total Siklus</div>
        <div class="stat-value">${cycles.length}</div>
        <div class="stat-sub">${ongoing.length} ongoing · ${completed.length} selesai</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">📈 Siklus Aktif</div>
        <div class="stat-value">${ongoing.length}</div>
        <div class="stat-sub">${ongoing.length > 0 ? 'Sedang berjalan' : 'Tidak ada siklus aktif'}</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">💹 Harga Pasar Normal</div>
        <div class="stat-value">${fmt.rp(hargaPasar.normal)}</div>
        <div class="stat-sub">per kg · Hari raya: ${fmt.rp(hargaPasar.hariRaya)}/kg</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-label">🎊 Hari Raya Berikutnya</div>
        <div class="stat-value">${hariRaya.daysUntil}h</div>
        <div class="stat-sub">${hariRaya.nama} · ${hariRaya.dateStr}</div>
      </div>
    </div>

    <!-- Ongoing Cycles -->
    <div class="grid-2" style="margin-bottom:20px;">
      <div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon green">📋</div>
              Siklus Berjalan
            </div>
            <button class="btn btn-primary btn-sm" onclick="startNewCycle()">+ Baru</button>
          </div>
          ${ongoing.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🐷</div>
              <div class="empty-title">Belum ada siklus aktif</div>
              <div class="empty-desc">Mulai siklus baru untuk tracking ternak Anda</div>
              <button class="btn btn-primary" onclick="startNewCycle()">➕ Mulai Siklus Baru</button>
            </div>
          ` : ongoing.map(c => renderCycleCard(c)).join('')}
        </div>
      </div>

      <div>
        <div class="card" style="height:100%;">
          <div class="card-header">
            <div class="card-title">
              <div class="card-icon gold">💡</div>
              Panduan Cepat
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${[
              { step: '1', icon: '🐷', title: 'Input Data Bibit', desc: 'Masukkan jumlah & harga bibit jantan/betina' },
              { step: '2', icon: '🌾', title: 'Setup Pakan', desc: 'Jenis pakan, harga, porsi & frekuensi makan' },
              { step: '3', icon: '📅', title: 'Timeline Ternak', desc: 'Tanggal masuk, durasi, target berat panen' },
              { step: '4', icon: '💰', title: 'Kalkulasi Otomatis', desc: 'Sistem hitung modal, margin, ROI, BEP' },
              { step: '5', icon: '🧠', title: 'Rekomendasi SPK', desc: 'Keputusan: lanjut/tunda/ubah strategi pakan' },
            ].map(s => `
              <div style="display:flex;gap:12px;align-items:flex-start;">
                <div style="width:24px;height:24px;border-radius:50%;background:var(--primary);color:#000;font-size:0.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${s.step}</div>
                <div>
                  <div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">${s.icon} ${s.title}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">${s.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Recent completed -->
    ${completed.length > 0 ? `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><div class="card-icon blue">✅</div> Siklus Selesai</div>
        <button class="btn btn-secondary btn-sm" onclick="navigate('riwayat')">Lihat Semua →</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Nama Siklus</th><th>Tgl Masuk</th><th>Tgl Panen</th>
            <th>Total Modal</th><th>Margin Actual</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${completed.slice(0,5).map(c => {
              const r = Kalkulasi.generateRekomendasi(c);
              const margin = c.actual?.marginActual ?? (r?.bestScenario?.margin || 0);
              return `<tr onclick="viewCycleDetail('${c.id}')" style="cursor:pointer;">
                <td class="primary">${c.nama || 'Siklus'}</td>
                <td>${fmt.date(c.timeline?.tglMasukBibit)}</td>
                <td>${fmt.date(c.completedAt || c.actual?.tglPanen)}</td>
                <td>${r ? fmt.rp(r.totalModal) : '-'}</td>
                <td class="${margin >= 0 ? 'green' : 'red'}">${fmt.rp(margin)}</td>
                <td><span class="badge badge-success">✓ Selesai</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}
  `;
}

function renderCycleCard(cycle) {
  const progress = Kalkulasi.progressTimeline(
    cycle.timeline?.tglMasukBibit,
    cycle.timeline?.durationMonths || 4
  );
  const r = Kalkulasi.generateRekomendasi(cycle);

  return `
    <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;cursor:pointer;transition:all var(--transition);"
      onclick="viewCycleDetail('${cycle.id}')"
      onmouseover="this.style.borderColor='rgba(245,158,11,0.3)'"
      onmouseout="this.style.borderColor='var(--border)'">

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div>
          <div style="font-size:0.875rem;font-weight:700;color:var(--text-primary);">${cycle.nama || 'Siklus Ternak'}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">
            ${progress.phaseInfo?.icon} ${progress.phaseInfo?.label} · Hari ke-${progress.passedDays}/${progress.totalDays}
          </div>
        </div>
        <span class="badge badge-warning">● Berjalan</span>
      </div>

      <div class="timeline-bar-wrap">
        <div class="timeline-bar" style="width:${progress.percent}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;">
        <span>${progress.percent}% selesai</span>
        <span>Sisa ${progress.sisaHari} hari</span>
      </div>

      ${r ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span style="font-size:0.72rem;background:rgba(255,255,255,0.05);padding:3px 8px;border-radius:6px;color:var(--text-secondary);">
          💰 Modal: ${fmt.rp(r.totalModal)}
        </span>
        <span style="font-size:0.72rem;background:${r.bestScenario?.margin >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};padding:3px 8px;border-radius:6px;color:${r.bestScenario?.margin >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
          📈 Best: ${fmt.rp(r.bestScenario?.margin)}
        </span>
        <span style="font-size:0.72rem;background:rgba(245,158,11,0.1);padding:3px 8px;border-radius:6px;color:var(--primary);">
          ⚖️ BEP: ${fmt.rp(r.breakEvenPrice)}/kg
        </span>
      </div>` : ''}
    </div>
  `;
}

function viewCycleDetail(id) {
  App.currentCycleId = id;
  navigate('detail');
}

// ─────────────────────────────────────────────────────────────
// WIZARD — 6 STEPS
// ─────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: 'Bibit', icon: '🐷' },
  { label: 'Pakan', icon: '🌾' },
  { label: 'Timeline', icon: '📅' },
  { label: 'Kalkulasi', icon: '💰' },
  { label: 'Rekomendasi', icon: '🧠' },
  { label: 'Simpan', icon: '✅' },
];

function renderWizard(el) {
  document.getElementById('header-title').textContent = 'Siklus Baru';
  document.getElementById('header-subtitle').textContent = `Langkah ${App.wizardStep} dari ${WIZARD_STEPS.length}`;

  const pct = ((App.wizardStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  el.innerHTML = `
    <div class="card" style="padding:0;overflow:hidden;">
      <!-- Wizard Header -->
      <div class="wizard-header">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:1rem;font-weight:700;">Mulai Siklus Ternak Baru</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:3px;">Isi semua data untuk mendapatkan rekomendasi SPK yang akurat</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="navigate('dashboard')">✕ Batal</button>
        </div>
        <div class="wizard-progress" style="margin-top:16px;">
          <div class="wizard-progress-bar" style="width:${pct}%"></div>
        </div>
        <div class="wizard-steps" style="margin-top:12px;">
          ${WIZARD_STEPS.map((s, i) => {
            const step = i + 1;
            const cls = step < App.wizardStep ? 'done' : step === App.wizardStep ? 'active' : '';
            return `
              <div class="wizard-step ${cls}">
                <div class="step-num">${step < App.wizardStep ? '✓' : step}</div>
                <div class="step-label">${s.icon} ${s.label}</div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Wizard Body -->
      <div class="wizard-body" id="wizard-body">
        ${renderWizardStep(App.wizardStep)}
      </div>

      <!-- Wizard Footer -->
      <div class="wizard-footer">
        <button class="btn btn-secondary" onclick="wizardPrev()" ${App.wizardStep === 1 ? 'disabled' : ''}>
          ← Sebelumnya
        </button>
        <span style="font-size:0.8rem;color:var(--text-muted);">Langkah ${App.wizardStep} dari ${WIZARD_STEPS.length}</span>
        ${App.wizardStep < WIZARD_STEPS.length
          ? `<button class="btn btn-primary" onclick="wizardNext()">Lanjut →</button>`
          : `<button class="btn btn-primary" onclick="saveCycle()">✅ Simpan Siklus</button>`
        }
      </div>
    </div>
  `;

  // Init charts if step 4
  if (App.wizardStep === 4) initChartStep4();
}

function renderWizardStep(step) {
  switch (step) {
    case 1: return renderStep1();
    case 2: return renderStep2();
    case 3: return renderStep3();
    case 4: return renderStep4();
    case 5: return renderStep5();
    case 6: return renderStep6();
    default: return '';
  }
}

// Step 1 — Bibit
function renderStep1() {
  const d = App.wizardData.bibit || {};
  return `
    <div style="max-width:600px;">
      <div class="page-header">
        <div class="page-title">🐷 Data <span>Bibit</span> & Modal Awal</div>
        <div class="page-desc">Masukkan data bibit yang akan Anda ternakkan. Sistem akan otomatis menghitung total modal bibit.</div>
      </div>

      <div class="form-group">
        <label class="form-label">Nama Siklus</label>
        <input type="text" class="form-control" id="s1-nama"
          placeholder="cth: Siklus Juni 2026" value="${d.nama || 'Siklus ' + new Date().toLocaleDateString('id-ID', {month:'long',year:'numeric'})}">
      </div>

      <div class="form-group">
        <label class="form-label">Tipe Ternak</label>
        <select class="form-control" id="s1-tipe">
          <option value="pengemukan" ${d.tipeTernak==='pengemukan'?'selected':''}>Pengemukan (beli bibit → panen)</option>
          <option value="pembibitan" ${d.tipeTernak==='pembibitan'?'selected':''}>Pembibitan (indukan → anak)</option>
        </select>
      </div>

      <div class="grid-2">
        <div>
          <div class="card" style="border-color:rgba(59,130,246,0.2);background:rgba(59,130,246,0.04);">
            <div style="font-size:0.85rem;font-weight:700;margin-bottom:14px;color:var(--accent-blue);">🐗 Pejantan</div>
            <div class="form-group">
              <label class="form-label">Jumlah Ekor</label>
              <input type="number" class="form-control" id="s1-jmlJantan" min="0" value="${d.jumlahJantan ?? 2}"
                oninput="updateStep1Calc()">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Harga / Ekor (Rp)</label>
              <input type="number" class="form-control" id="s1-hrgJantan" min="0" step="50000" value="${d.hargaJantan ?? 1800000}"
                oninput="updateStep1Calc()">
            </div>
          </div>
        </div>
        <div>
          <div class="card" style="border-color:rgba(236,72,153,0.2);background:rgba(236,72,153,0.04);">
            <div style="font-size:0.85rem;font-weight:700;margin-bottom:14px;color:#ec4899;">🐖 Betina</div>
            <div class="form-group">
              <label class="form-label">Jumlah Ekor</label>
              <input type="number" class="form-control" id="s1-jmlBetina" min="0" value="${d.jumlahBetina ?? 2}"
                oninput="updateStep1Calc()">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Harga / Ekor (Rp)</label>
              <input type="number" class="form-control" id="s1-hrgBetina" min="0" step="50000" value="${d.hargaBetina ?? 1700000}"
                oninput="updateStep1Calc()">
            </div>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label class="form-label">Estimasi Umur Bibit (hari saat beli)</label>
        <input type="number" class="form-control" id="s1-umur" min="0" max="180" value="${d.estimasiUmurBibit ?? 60}">
        <div class="form-hint">Biasanya 45–90 hari (1.5–3 bulan)</div>
      </div>

      <div class="form-group">
        <label class="form-label">Catatan (opsional)</label>
        <input type="text" class="form-control" id="s1-catatan" placeholder="cth: Bibit dari peternak pak Ketut, Ubud" value="${d.catatan || ''}">
      </div>

      <!-- Live Calc Preview -->
      <div id="s1-calc-preview" style="margin-top:16px;"></div>
    </div>
  `;
}

function updateStep1Calc() {
  const jJ = parseInt(document.getElementById('s1-jmlJantan')?.value) || 0;
  const hJ = parseInt(document.getElementById('s1-hrgJantan')?.value) || 0;
  const jB = parseInt(document.getElementById('s1-jmlBetina')?.value) || 0;
  const hB = parseInt(document.getElementById('s1-hrgBetina')?.value) || 0;

  const c = Kalkulasi.modalBibit({ jumlahJantan: jJ, hargaJantan: hJ, jumlahBetina: jB, hargaBetina: hB });
  const preview = document.getElementById('s1-calc-preview');
  if (!preview) return;

  preview.innerHTML = `
    <div class="card" style="background:rgba(245,158,11,0.06);border-color:rgba(245,158,11,0.25);">
      <div style="font-size:0.78rem;font-weight:700;color:var(--primary);margin-bottom:12px;">📊 Kalkulasi Otomatis</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Total Ekor</div><div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">${c.totalEkor} ekor</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Modal Jantan</div><div style="font-size:1.1rem;font-weight:800;color:var(--accent-blue);">${fmt.rp(c.modalJantan)}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Modal Betina</div><div style="font-size:1.1rem;font-weight:800;color:#ec4899;">${fmt.rp(c.modalBetina)}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Total Modal Bibit</div><div style="font-size:1.3rem;font-weight:800;color:var(--primary);">${fmt.rp(c.totalModal)}</div></div>
      </div>
    </div>
  `;
}

// Step 2 — Pakan
function renderStep2() {
  const pakan = App.wizardData.pakan || [{ id:'p1', jenisPakan:'Glower Standar', hargaPerKarung:385000, beratPerKarung:50, porsiPerEkor:1, frekuensiPerHari:3 }];
  const jumlahEkor = (App.wizardData.bibit?.jumlahJantan || 0) + (App.wizardData.bibit?.jumlahBetina || 0) || 4;
  const dur = App.wizardData.timeline?.durationMonths || 4;

  return `
    <div style="max-width:700px;">
      <div class="page-header">
        <div class="page-title">🌾 Manajemen <span>Pakan</span></div>
        <div class="page-desc">Masukkan data pakan. Anda bisa menambahkan beberapa jenis pakan (misal pakan pokok + suplemen).</div>
      </div>

      <div id="pakan-list">
        ${pakan.map((p, i) => renderPakanForm(p, i, jumlahEkor, dur)).join('')}
      </div>

      <button class="btn btn-secondary btn-sm" onclick="addPakan()" style="margin-bottom:20px;">
        ➕ Tambah Jenis Pakan
      </button>

      <div class="divider"></div>
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">
        Preview Kebutuhan Pakan (untuk ${jumlahEkor} ekor)
      </div>
      <div id="pakan-preview-table"></div>
    </div>
  `;
}

function renderPakanForm(p, i, jumlahEkor, dur) {
  return `
    <div class="card" style="margin-bottom:16px;border-color:rgba(16,185,129,0.2);background:rgba(16,185,129,0.03);" id="pakan-card-${i}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--accent-green);">🌾 Pakan ${i+1}</div>
        ${i > 0 ? `<button class="btn btn-danger btn-sm btn-icon" onclick="removePakan(${i})">✕</button>` : ''}
      </div>
      <div class="form-control-row">
        <div class="form-group">
          <label class="form-label">Jenis Pakan</label>
          <select class="form-control" id="p${i}-jenis" onchange="updatePakanPreview()">
            <option ${p.jenisPakan==='Glower Standar'?'selected':''}>Glower Standar</option>
            <option ${p.jenisPakan==='Glower 551'?'selected':''}>Glower 551</option>
            <option ${p.jenisPakan==='Pakan Starter'?'selected':''}>Pakan Starter</option>
            <option ${p.jenisPakan==='Dedak Padi'?'selected':''}>Dedak Padi</option>
            <option value="custom" ${!['Glower Standar','Glower 551','Pakan Starter','Dedak Padi'].includes(p.jenisPakan)?'selected':''}>Custom / Lainnya</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Harga / Karung (Rp)</label>
          <input type="number" class="form-control" id="p${i}-harga" value="${p.hargaPerKarung}" min="0" step="5000" oninput="updatePakanPreview()">
        </div>
      </div>
      <div class="form-control-row">
        <div class="form-group">
          <label class="form-label">Berat / Karung (kg)</label>
          <input type="number" class="form-control" id="p${i}-berat" value="${p.beratPerKarung}" min="1" oninput="updatePakanPreview()">
        </div>
        <div class="form-group">
          <label class="form-label">Porsi / Ekor / Makan (kg)</label>
          <input type="number" class="form-control" id="p${i}-porsi" value="${p.porsiPerEkor}" min="0.1" step="0.1" oninput="updatePakanPreview()">
        </div>
        <div class="form-group">
          <label class="form-label">Frekuensi / Hari</label>
          <input type="number" class="form-control" id="p${i}-frekuensi" value="${p.frekuensiPerHari}" min="1" max="6" oninput="updatePakanPreview()">
        </div>
      </div>
    </div>
  `;
}

function addPakan() {
  savePakanToWizard();
  App.wizardData.pakan = App.wizardData.pakan || [];
  App.wizardData.pakan.push({ id:'p'+(Date.now()), jenisPakan:'Glower Standar', hargaPerKarung:385000, beratPerKarung:50, porsiPerEkor:1, frekuensiPerHari:3 });
  const jumlahEkor = (App.wizardData.bibit?.jumlahJantan || 0) + (App.wizardData.bibit?.jumlahBetina || 0) || 4;
  const dur = App.wizardData.timeline?.durationMonths || 4;
  document.getElementById('pakan-list').innerHTML = App.wizardData.pakan.map((p,i) => renderPakanForm(p,i,jumlahEkor,dur)).join('');
  updatePakanPreview();
}

function removePakan(i) {
  savePakanToWizard();
  App.wizardData.pakan.splice(i, 1);
  const jumlahEkor = (App.wizardData.bibit?.jumlahJantan || 0) + (App.wizardData.bibit?.jumlahBetina || 0) || 4;
  const dur = App.wizardData.timeline?.durationMonths || 4;
  document.getElementById('pakan-list').innerHTML = App.wizardData.pakan.map((p,i) => renderPakanForm(p,i,jumlahEkor,dur)).join('');
  updatePakanPreview();
}

function savePakanToWizard() {
  const cards = document.querySelectorAll('[id^="pakan-card-"]');
  App.wizardData.pakan = Array.from(cards).map((_, i) => ({
    id: 'p' + i,
    jenisPakan: document.getElementById(`p${i}-jenis`)?.value || 'Pakan',
    hargaPerKarung: parseFloat(document.getElementById(`p${i}-harga`)?.value) || 0,
    beratPerKarung: parseFloat(document.getElementById(`p${i}-berat`)?.value) || 50,
    porsiPerEkor: parseFloat(document.getElementById(`p${i}-porsi`)?.value) || 1,
    frekuensiPerHari: parseInt(document.getElementById(`p${i}-frekuensi`)?.value) || 3,
  }));
}

function updatePakanPreview() {
  savePakanToWizard();
  const jumlahEkor = (App.wizardData.bibit?.jumlahJantan || 0) + (App.wizardData.bibit?.jumlahBetina || 0) || 4;
  const dur = App.wizardData.timeline?.durationMonths || 4;
  const { computed, totalBiaya } = Kalkulasi.totalBiayaPakan(App.wizardData.pakan || [], jumlahEkor, dur);

  const prevEl = document.getElementById('pakan-preview-table');
  if (!prevEl || !computed.length) return;

  prevEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Bulan</th>
          ${computed.map(p => `<th>${p.jenisPakan}<br><span style="font-size:0.65rem;color:var(--text-muted);">karung | biaya</span></th>`).join('')}
          <th>Total / Bulan</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5,6].map(m => {
            const totBulan = computed.reduce((s, p) => {
              const prev = p.preview.find(x => x.bulan === m);
              return s + (prev?.biaya || 0);
            }, 0);
            return `<tr>
              <td class="primary">Bulan ${m}</td>
              ${computed.map(p => {
                const pr = p.preview.find(x => x.bulan === m);
                return `<td>${pr?.karungNeeded || 0} karung<br><span style="color:var(--primary);font-weight:600;">${fmt.rp(pr?.biaya || 0)}</span></td>`;
              }).join('')}
              <td class="gold" style="font-weight:700;">${fmt.rp(totBulan)}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:rgba(245,158,11,0.06);">
            <td class="primary" style="font-weight:700;">TOTAL (${dur} bln)</td>
            ${computed.map(p => `<td class="primary">${p.karung} karung<br><span style="color:var(--primary);">${fmt.rp(p.biayaTotal)}</span></td>`).join('')}
            <td class="gold" style="font-size:1rem;font-weight:800;">${fmt.rp(totalBiaya)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div style="margin-top:12px;padding:12px;background:rgba(245,158,11,0.06);border-radius:var(--radius);font-size:0.8rem;color:var(--text-secondary);">
      💡 Konsumsi harian total: ${computed.reduce((s,p)=>s+p.konsumsiHari,0).toFixed(1)} kg/hari untuk ${jumlahEkor} ekor
    </div>
  `;
}

// Step 3 — Timeline
function renderStep3() {
  const t = App.wizardData.timeline || {};
  const today = new Date().toISOString().split('T')[0];
  return `
    <div style="max-width:600px;">
      <div class="page-header">
        <div class="page-title">📅 <span>Timeline</span> Ternak</div>
        <div class="page-desc">Atur jadwal ternak Anda. Sistem akan otomatis hitung target panen dan progress harian.</div>
      </div>

      <div class="form-control-row">
        <div class="form-group">
          <label class="form-label">Tanggal Masuk Bibit <span>*</span></label>
          <input type="date" class="form-control" id="s3-tglMasuk" value="${t.tglMasukBibit || today}" onchange="updateTimelinePreview()">
        </div>
        <div class="form-group">
          <label class="form-label">Durasi Ternak (bulan) <span>*</span></label>
          <input type="number" class="form-control" id="s3-durasi" value="${t.durationMonths || 4}" min="3" max="8" onchange="updateTimelinePreview()">
          <div class="form-hint">Rata-rata pengemukan: 4–5 bulan</div>
        </div>
      </div>

      <div class="form-control-row">
        <div class="form-group">
          <label class="form-label">Estimasi Berat per Ekor saat Panen (kg) <span>*</span></label>
          <input type="number" class="form-control" id="s3-berat" value="${t.estimasiBeratPerEkor || 100}" min="50" max="200" oninput="updateTimelinePreview()">
          <div class="form-hint">Rata-rata panen: 90–110 kg/ekor</div>
        </div>
        <div class="form-group">
          <label class="form-label">Target Panen (manual override)</label>
          <input type="date" class="form-control" id="s3-targetPanen" value="${t.targetPanen || ''}">
          <div class="form-hint">Kosongkan untuk auto dari durasi</div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Catatan Timeline</label>
        <input type="text" class="form-control" id="s3-notes" placeholder="cth: Rencana panen saat Galungan" value="${t.notes || ''}">
      </div>

      <!-- Preview Timeline -->
      <div id="timeline-preview" style="margin-top:16px;"></div>

      <!-- Hari Raya Tip -->
      ${renderHariRayaTip()}
    </div>
  `;
}

function renderHariRayaTip() {
  const hr = Kalkulasi.nextHariRaya();
  return `
    <div class="alert-musim" style="margin-top:16px;">
      <div class="alert-musim-icon">💡</div>
      <div>
        <div class="alert-musim-title">Tips: Sesuaikan dengan Hari Raya</div>
        <div class="alert-musim-desc">
          ${hr.nama} berikutnya: <strong>${hr.dateStr}</strong> (${hr.daysUntil} hari lagi).
          Harga babi umumnya naik 15–25% saat Galungan/Kuningan. Pertimbangkan atur durasi agar panen tepat saat musim ini.
        </div>
      </div>
    </div>
  `;
}

function updateTimelinePreview() {
  const tgl = document.getElementById('s3-tglMasuk')?.value;
  const dur = parseInt(document.getElementById('s3-durasi')?.value) || 4;
  const berat = parseInt(document.getElementById('s3-berat')?.value) || 100;
  const jumlahEkor = (App.wizardData.bibit?.jumlahJantan||0) + (App.wizardData.bibit?.jumlahBetina||0) || 4;

  if (!tgl) return;
  const progress = Kalkulasi.progressTimeline(tgl, dur);
  const totalBerat = jumlahEkor * berat;

  const prevEl = document.getElementById('timeline-preview');
  if (!prevEl) return;
  prevEl.innerHTML = `
    <div class="card" style="background:rgba(245,158,11,0.05);border-color:rgba(245,158,11,0.2);">
      <div style="font-size:0.78rem;font-weight:700;color:var(--primary);margin-bottom:12px;">📅 Preview Timeline</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:12px;">
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Tanggal Masuk</div><div style="font-weight:700;color:var(--text-primary);">${fmt.date(tgl)}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Target Panen</div><div style="font-weight:700;color:var(--primary);">${progress.targetPanen}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Total Hari</div><div style="font-weight:700;color:var(--text-primary);">${progress.totalDays} hari</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Total Berat Panen</div><div style="font-weight:700;color:var(--accent-green);">${totalBerat} kg</div></div>
      </div>

      <div style="margin-bottom:8px;font-size:0.75rem;color:var(--text-muted);">Progress saat ini: ${progress.percent}%</div>
      <div class="timeline-bar-wrap"><div class="timeline-bar" style="width:${progress.percent}%"></div></div>
      <div style="margin-top:8px;font-size:0.72rem;color:var(--text-muted);">
        Hari ke-${progress.passedDays} dari ${progress.totalDays} · Sisa ${progress.sisaHari} hari
      </div>

      <div class="timeline-phases" style="margin-top:14px;">
        ${['intro','growth','finishing','ready_harvest'].map(ph => {
          const phMap = { intro:'🐣 Adaptasi', growth:'📈 Pertumbuhan', finishing:'💪 Finishing', ready_harvest:'🏆 Panen' };
          return `<div class="phase-chip ${progress.phase===ph?'active':''}">
            <div class="phase-chip-icon">${phMap[ph].split(' ')[0]}</div>
            <div class="phase-chip-name">${phMap[ph].split(' ')[1]}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// Step 4 — Kalkulasi
function renderStep4() {
  const bibit = App.wizardData.bibit || {};
  const pakan = App.wizardData.pakan || [];
  const timeline = App.wizardData.timeline || {};
  const hargaPasar = App.wizardData.hargaPasar || DB.getHargaPasar();

  const jumlahEkor = (bibit.jumlahJantan||0)+(bibit.jumlahBetina||0) || 4;
  const bibitCalc = Kalkulasi.modalBibit(bibit);
  const { totalBiaya: biayaPakan } = Kalkulasi.totalBiayaPakan(pakan, jumlahEkor, timeline.durationMonths||4);
  const totalModal = bibitCalc.totalModal + biayaPakan;
  const totalBerat = Kalkulasi.beratPanen(jumlahEkor, timeline.estimasiBeratPerEkor||100);
  const { scenarios, breakEven } = Kalkulasi.hitungSkenario(totalModal, totalBerat, hargaPasar, [
    { nama: 'Custom', key:'custom', hargaPerKg: hargaPasar.custom || 41000, warna:'#8b5cf6', icon:'⚙️' }
  ]);

  App._kalkulasiData = { bibitCalc, biayaPakan, totalModal, totalBerat, scenarios, breakEven, hargaPasar };

  return `
    <div>
      <div class="page-header">
        <div class="page-title">💰 <span>Kalkulasi</span> Keuntungan</div>
        <div class="page-desc">Review total modal dan prediksi keuntungan per skenario harga pasar.</div>
      </div>

      <!-- Modal Breakdown -->
      <div class="stat-grid" style="margin-bottom:20px;">
        <div class="stat-card gold">
          <div class="stat-label">🐷 Modal Bibit</div>
          <div class="stat-value" style="font-size:1.2rem;">${fmt.rp(bibitCalc.totalModal)}</div>
          <div class="stat-sub">${jumlahEkor} ekor total</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">🌾 Biaya Pakan</div>
          <div class="stat-value" style="font-size:1.2rem;">${fmt.rp(biayaPakan)}</div>
          <div class="stat-sub">${timeline.durationMonths||4} bulan</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-label">📦 Total Modal</div>
          <div class="stat-value" style="font-size:1.2rem;">${fmt.rp(totalModal)}</div>
          <div class="stat-sub">Bibit + Pakan</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">⚖️ Harga Break-Even</div>
          <div class="stat-value" style="font-size:1.2rem;">${fmt.rp(breakEven)}/kg</div>
          <div class="stat-sub">Harga min. agar impas</div>
        </div>
      </div>

      <!-- Custom Harga Slider -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-title" style="margin-bottom:14px;"><div class="card-icon gold">⚙️</div> Simulasi Harga Jual</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:160px;">
            <label class="form-label">Harga Normal (Rp/kg)</label>
            <input type="number" class="form-control" id="s4-hargaNormal" value="${hargaPasar.normal}" step="500" oninput="updateStep4()" min="20000" max="100000">
          </div>
          <div style="flex:1;min-width:160px;">
            <label class="form-label">Harga Hari Raya (Rp/kg)</label>
            <input type="number" class="form-control" id="s4-hargaHariRaya" value="${hargaPasar.hariRaya}" step="500" oninput="updateStep4()" min="20000" max="100000">
          </div>
          <div style="flex:1;min-width:160px;">
            <label class="form-label">Harga Custom (Rp/kg)</label>
            <input type="number" class="form-control" id="s4-hargaCustom" value="${hargaPasar.custom||41000}" step="500" oninput="updateStep4()" min="20000" max="100000">
          </div>
        </div>
        <div style="margin-top:12px;font-size:0.75rem;color:var(--text-muted);">Total Berat Panen: <strong style="color:var(--text-primary);">${totalBerat} kg</strong></div>
      </div>

      <!-- Skenario Cards -->
      <div id="s4-scenarios" style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px;">
        ${renderScenarioCards(scenarios, breakEven)}
      </div>

      <!-- Chart -->
      <div class="card">
        <div class="card-title" style="margin-bottom:16px;"><div class="card-icon blue">📊</div> Grafik Perbandingan Skenario</div>
        <div class="chart-container" style="height:260px;">
          <canvas id="chart-step4"></canvas>
        </div>
      </div>
    </div>
  `;
}

function renderScenarioCards(scenarios, breakEven) {
  return scenarios.map(s => {
    const isBest = s === scenarios.reduce((b, x) => x.margin > b.margin ? x : b, scenarios[0]);
    const colorCls = s.key === 'normal' ? 'normal' : s.key === 'hariRaya' ? 'hari-raya' : '';
    return `
      <div class="scenario-card ${colorCls} ${isBest?'best':''}">
        ${isBest ? '<div style="font-size:0.65rem;color:var(--primary);font-weight:800;margin-bottom:8px;">⭐ TERBAIK</div>' : ''}
        <div class="scenario-name">${s.icon} ${s.nama}</div>
        <div class="scenario-row"><span class="scenario-label">Harga/kg</span><span class="scenario-val">${fmt.rpFull(s.hargaPerKg)}</span></div>
        <div class="scenario-row"><span class="scenario-label">Penjualan</span><span class="scenario-val">${fmt.rp(s.penjualan)}</span></div>
        <div class="scenario-row">
          <span class="scenario-label">Margin</span>
          <span class="scenario-val" style="color:${s.margin>=0?'var(--accent-green)':'var(--accent-red)'};">${fmt.rp(s.margin)}</span>
        </div>
        <div class="scenario-row">
          <span class="scenario-label">ROI</span>
          <span class="scenario-val" style="color:${s.roi>=0?'var(--accent-green)':'var(--accent-red)'};">${fmt.pct(s.roi)}</span>
        </div>
        <div style="margin-top:8px;">
          <span class="badge ${s.status==='untung'?'badge-success':s.status==='rugi'?'badge-danger':'badge-warning'}">
            ${s.status==='untung'?'✓ Untung':s.status==='rugi'?'✗ Rugi':'≈ Impas'}
          </span>
        </div>
      </div>`;
  }).join('');
}

function updateStep4() {
  const hN = parseInt(document.getElementById('s4-hargaNormal')?.value) || 38000;
  const hR = parseInt(document.getElementById('s4-hargaHariRaya')?.value) || 45000;
  const hC = parseInt(document.getElementById('s4-hargaCustom')?.value) || 41000;

  App.wizardData.hargaPasar = { normal: hN, hariRaya: hR, custom: hC };

  const bibit = App.wizardData.bibit || {};
  const pakan = App.wizardData.pakan || [];
  const timeline = App.wizardData.timeline || {};
  const jumlahEkor = (bibit.jumlahJantan||0)+(bibit.jumlahBetina||0) || 4;
  const bibitCalc = Kalkulasi.modalBibit(bibit);
  const { totalBiaya } = Kalkulasi.totalBiayaPakan(pakan, jumlahEkor, timeline.durationMonths||4);
  const totalModal = bibitCalc.totalModal + totalBiaya;
  const totalBerat = Kalkulasi.beratPanen(jumlahEkor, timeline.estimasiBeratPerEkor||100);
  const { scenarios, breakEven } = Kalkulasi.hitungSkenario(totalModal, totalBerat, { normal:hN, hariRaya:hR }, [
    { nama:'Custom', key:'custom', hargaPerKg:hC, warna:'#8b5cf6', icon:'⚙️' }
  ]);

  document.getElementById('s4-scenarios').innerHTML = renderScenarioCards(scenarios, breakEven);
  updateChartStep4(scenarios, totalModal);
}

function initChartStep4() {
  const data = App._kalkulasiData;
  if (!data) return;
  setTimeout(() => updateChartStep4(data.scenarios, data.totalModal), 100);
}

function updateChartStep4(scenarios, totalModal) {
  const ctx = document.getElementById('chart-step4');
  if (!ctx) return;

  if (App.charts.step4) { App.charts.step4.destroy(); }
  App.charts.step4 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: scenarios.map(s => s.nama),
      datasets: [
        {
          label: 'Total Modal',
          data: scenarios.map(() => totalModal),
          backgroundColor: 'rgba(107,114,128,0.5)',
          borderRadius: 6,
        },
        {
          label: 'Penjualan',
          data: scenarios.map(s => s.penjualan),
          backgroundColor: scenarios.map(s => s.margin >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
          borderRadius: 6,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9ca3af', font: { size: 12 } } } },
      scales: {
        x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: {
          ticks: { color: '#9ca3af', callback: v => 'Rp ' + (v/1e6).toFixed(1) + 'jt' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

// Step 5 — Rekomendasi
function renderStep5() {
  const cycle = {
    bibit: App.wizardData.bibit,
    pakan: App.wizardData.pakan,
    timeline: App.wizardData.timeline,
    hargaPasar: App.wizardData.hargaPasar || DB.getHargaPasar(),
  };
  const r = Kalkulasi.generateRekomendasi(cycle);
  if (!r) return `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Data tidak lengkap</div><div class="empty-desc">Harap isi data bibit, pakan, dan timeline terlebih dahulu.</div></div>`;

  const riskBlocks = Array.from({length:5}, (_,i) => {
    const filled = r.riskLevel==='rendah'?(i<1):(r.riskLevel==='sedang'?(i<3):(i<5));
    const lvl = r.riskLevel==='rendah'?'low':r.riskLevel==='sedang'?'mid':'high';
    return `<div class="risk-block ${filled?`filled ${lvl}`:''}"></div>`;
  }).join('');

  return `
    <div>
      <div class="page-header">
        <div class="page-title">🧠 <span>Rekomendasi</span> SPK</div>
        <div class="page-desc">Analisis otomatis berdasarkan data yang Anda masukkan.</div>
      </div>

      <!-- Main Recommendation -->
      <div class="rekomendasi-result ${r.status}" style="margin-bottom:20px;">
        <div class="rekomendasi-title">${r.judulReko}</div>
        <div class="rekomendasi-desc">${r.descReko}</div>
        <div style="margin-top:12px;font-size:0.78rem;color:var(--text-secondary);">
          ⏰ Waktu panen optimal: <strong>${r.optimalWaktu}</strong>
        </div>
      </div>

      <!-- Risk Level -->
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div class="card-title"><div class="card-icon ${r.riskLevel==='rendah'?'green':r.riskLevel==='sedang'?'gold':'red'}">⚡</div> Level Risiko</div>
          <span class="badge ${r.riskLevel==='rendah'?'badge-success':r.riskLevel==='sedang'?'badge-warning':'badge-danger'}">
            ${r.riskLevel.toUpperCase()}
          </span>
        </div>
        <div class="risk-bar">${riskBlocks}</div>
        ${r.riskFactors.length > 0 ? `
        <div style="margin-top:12px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;">Faktor Risiko:</div>
          ${r.riskFactors.map(f => `<div style="font-size:0.78rem;color:var(--accent-red);margin-bottom:4px;">⚠️ ${f}</div>`).join('')}
        </div>` : ''}
      </div>

      <!-- Insights -->
      <div class="insight-grid">
        ${r.insights.map(i => `
          <div class="insight-card">
            <div class="insight-icon">${i.icon}</div>
            <div>
              <div class="insight-label">${i.label}</div>
              <div class="insight-value">${i.value}</div>
              <div class="insight-sub">${i.sub}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Step 6 — Review & Save
function renderStep6() {
  const cycle = {
    bibit: App.wizardData.bibit,
    pakan: App.wizardData.pakan,
    timeline: App.wizardData.timeline,
    hargaPasar: App.wizardData.hargaPasar || DB.getHargaPasar(),
  };
  const r = Kalkulasi.generateRekomendasi(cycle);
  const nama = App.wizardData.bibit?.nama || ('Siklus ' + new Date().toLocaleDateString('id-ID', {month:'long',year:'numeric'}));

  return `
    <div style="max-width:600px;">
      <div class="page-header">
        <div class="page-title">✅ <span>Review</span> & Simpan</div>
        <div class="page-desc">Periksa ringkasan siklus Anda sebelum disimpan.</div>
      </div>

      <div class="card" style="margin-bottom:16px;border-color:rgba(245,158,11,0.2);">
        <div style="font-size:0.78rem;font-weight:700;color:var(--primary);margin-bottom:14px;">📋 RINGKASAN SIKLUS</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${[
            { label:'Nama Siklus', val: App.wizardData.nama || nama, icon:'🏷️' },
            { label:'Jenis Ternak', val: App.wizardData.bibit?.tipeTernak || 'pengemukan', icon:'🐷' },
            { label:'Total Ekor', val: ((App.wizardData.bibit?.jumlahJantan||0)+(App.wizardData.bibit?.jumlahBetina||0)) + ' ekor', icon:'🔢' },
            { label:'Modal Bibit', val: fmt.rp(Kalkulasi.modalBibit(App.wizardData.bibit||{}).totalModal), icon:'💵' },
            { label:'Biaya Pakan ('+( App.wizardData.timeline?.durationMonths||4)+'bln)', val: r ? fmt.rp(r.biayaPakan) : '-', icon:'🌾' },
            { label:'Total Modal', val: r ? fmt.rp(r.totalModal) : '-', icon:'📦' },
            { label:'Target Panen', val: App.wizardData.timeline?.tglMasukBibit ? Kalkulasi.progressTimeline(App.wizardData.timeline.tglMasukBibit, App.wizardData.timeline.durationMonths||4).targetPanen : '-', icon:'📅' },
            { label:'Total Berat Panen', val: r ? r.totalBeratPanen + ' kg' : '-', icon:'⚖️' },
            { label:'Margin Terbaik', val: r ? fmt.rp(r.bestScenario?.margin||0) : '-', icon:'📈' },
            { label:'BEP Harga', val: r ? fmt.rp(r.breakEvenPrice) + '/kg' : '-', icon:'⚖️' },
            { label:'Rekomendasi', val: r ? r.judulReko.replace(/^[^\s]+\s/,'') : '-', icon:'🧠' },
          ].map(row => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
              <span style="font-size:0.8rem;color:var(--text-muted);">${row.icon} ${row.label}</span>
              <span style="font-size:0.85rem;font-weight:600;color:var(--text-primary);text-align:right;max-width:60%;">${row.val}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="border-color:rgba(16,185,129,0.2);background:rgba(16,185,129,0.04);">
        <div style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6;">
          ✅ Setelah disimpan, Anda bisa memantau progress siklus, mengupdate harga pasar kapan saja,
          dan mendapat rekomendasi panen ulang saat kondisi berubah.
        </div>
      </div>
    </div>
  `;
}

// Wizard Navigation
function wizardNext() {
  const step = App.wizardStep;

  // Validate & save current step data
  if (step === 1) {
    const jJ = parseInt(document.getElementById('s1-jmlJantan')?.value) || 0;
    const jB = parseInt(document.getElementById('s1-jmlBetina')?.value) || 0;
    if (jJ + jB === 0) { toast('Masukkan minimal 1 ekor bibit!', 'error'); return; }
    App.wizardData.nama = document.getElementById('s1-nama')?.value;
    App.wizardData.bibit = {
      jumlahJantan: jJ,
      hargaJantan: parseFloat(document.getElementById('s1-hrgJantan')?.value) || 0,
      jumlahBetina: jB,
      hargaBetina: parseFloat(document.getElementById('s1-hrgBetina')?.value) || 0,
      tipeTernak: document.getElementById('s1-tipe')?.value,
      estimasiUmurBibit: parseInt(document.getElementById('s1-umur')?.value) || 60,
      catatan: document.getElementById('s1-catatan')?.value,
    };
  }
  if (step === 2) {
    savePakanToWizard();
    if (!App.wizardData.pakan?.length) { toast('Masukkan minimal 1 jenis pakan!', 'error'); return; }
  }
  if (step === 3) {
    const tgl = document.getElementById('s3-tglMasuk')?.value;
    if (!tgl) { toast('Tanggal masuk bibit wajib diisi!', 'error'); return; }
    App.wizardData.timeline = {
      tglMasukBibit: tgl,
      durationMonths: parseInt(document.getElementById('s3-durasi')?.value) || 4,
      estimasiBeratPerEkor: parseInt(document.getElementById('s3-berat')?.value) || 100,
      targetPanen: document.getElementById('s3-targetPanen')?.value || null,
      notes: document.getElementById('s3-notes')?.value || '',
    };
  }

  App.wizardStep = Math.min(WIZARD_STEPS.length, step + 1);
  navigate('wizard');
}

function wizardPrev() {
  App.wizardStep = Math.max(1, App.wizardStep - 1);
  navigate('wizard');
}

function saveCycle() {
  const data = App.wizardData;
  if (!data.bibit || !data.pakan || !data.timeline) {
    toast('Data tidak lengkap. Harap isi semua langkah.', 'error');
    return;
  }
  const cycle = DB.createCycle({
    nama: data.nama || 'Siklus Ternak',
    bibit: data.bibit,
    pakan: data.pakan,
    timeline: data.timeline,
    hargaPasar: data.hargaPasar || DB.getHargaPasar(),
  });

  toast('✅ Siklus berhasil disimpan!', 'success');
  App.currentCycleId = cycle.id;
  navigate('detail');
}

// ─────────────────────────────────────────────────────────────
// DETAIL CYCLE
// ─────────────────────────────────────────────────────────────
function renderDetail(el) {
  const cycle = DB.getCycleById(App.currentCycleId);
  if (!cycle) { navigate('dashboard'); return; }

  document.getElementById('header-title').textContent = cycle.nama || 'Detail Siklus';
  document.getElementById('header-subtitle').textContent = 'Monitor progress siklus ternak Anda';

  const r = Kalkulasi.generateRekomendasi(cycle);
  const progress = Kalkulasi.progressTimeline(cycle.timeline?.tglMasukBibit, cycle.timeline?.durationMonths || 4);
  const isCompleted = cycle.status === 'completed';

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap;">
      <div>
        <div class="page-title">${cycle.nama || 'Siklus Ternak'}</div>
        <div class="page-desc">
          Mulai: ${fmt.date(cycle.timeline?.tglMasukBibit)} ·
          ${isCompleted ? '✅ Selesai' : `● ${progress.percent}% selesai`}
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="navigate('dashboard')">← Dashboard</button>
        ${!isCompleted ? `
          <button class="btn btn-success" onclick="openPanenModal('${cycle.id}')">🏆 Panen & Finalisasi</button>
        ` : ''}
        <button class="btn btn-primary" onclick="exportPDF('${cycle.id}')">📄 Export PDF</button>
      </div>
    </div>

    <!-- Progress Timeline -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <div class="card-title"><div class="card-icon gold">📅</div> Progress Timeline</div>
        <span class="badge ${isCompleted?'badge-success':'badge-warning'}">
          ${isCompleted ? '✅ Selesai' : '● Berjalan'}
        </span>
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:14px;">
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Masuk</div><div style="font-weight:700;">${fmt.date(cycle.timeline?.tglMasukBibit)}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Target Panen</div><div style="font-weight:700;color:var(--primary);">${progress.targetPanen}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Hari ke</div><div style="font-weight:700;">${progress.passedDays} / ${progress.totalDays}</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Sisa</div><div style="font-weight:700;color:${progress.sisaHari<14?'var(--accent-red)':'var(--text-primary)'};">${progress.sisaHari} hari</div></div>
        <div><div style="font-size:0.72rem;color:var(--text-muted);">Fase</div><div style="font-weight:700;">${progress.phaseInfo?.icon} ${progress.phaseInfo?.label}</div></div>
      </div>
      <div class="timeline-bar-wrap">
        <div class="timeline-bar" style="width:${progress.percent}%"></div>
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">${progress.percent}% selesai</div>
      <div class="timeline-phases" style="margin-top:14px;">
        ${['intro','growth','finishing','ready_harvest'].map(ph => {
          const phMap = { intro:'🐣 Adaptasi', growth:'📈 Pertumbuhan', finishing:'💪 Finishing', ready_harvest:'🏆 Panen' };
          return `<div class="phase-chip ${progress.phase===ph?'active':''}">
            <div class="phase-chip-icon">${phMap[ph].split(' ')[0]}</div>
            <div class="phase-chip-name">${phMap[ph].split(' ')[1]}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${r ? `
    <!-- Stat Cards -->
    <div class="stat-grid" style="margin-bottom:20px;">
      <div class="stat-card gold"><div class="stat-label">💵 Modal Bibit</div><div class="stat-value">${fmt.rp(r.modalBibit)}</div></div>
      <div class="stat-card green"><div class="stat-label">🌾 Biaya Pakan</div><div class="stat-value">${fmt.rp(r.biayaPakan)}</div></div>
      <div class="stat-card blue"><div class="stat-label">📦 Total Modal</div><div class="stat-value">${fmt.rp(r.totalModal)}</div></div>
      <div class="stat-card purple"><div class="stat-label">⚖️ BEP Harga</div><div class="stat-value">${fmt.rp(r.breakEvenPrice)}/kg</div></div>
    </div>

    <div class="grid-2" style="margin-bottom:20px;">
      <!-- Rekomendasi -->
      <div>
        <div class="rekomendasi-result ${r.status}">
          <div class="rekomendasi-title">${r.judulReko}</div>
          <div class="rekomendasi-desc">${r.descReko}</div>
        </div>
        <div class="insight-grid" style="margin-top:14px;">
          ${r.insights.slice(0,4).map(i => `
            <div class="insight-card">
              <div class="insight-icon">${i.icon}</div>
              <div>
                <div class="insight-label">${i.label}</div>
                <div class="insight-value" style="font-size:0.85rem;">${i.value}</div>
                <div class="insight-sub">${i.sub}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Skenario Table -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;"><div class="card-icon gold">📊</div> Skenario Harga</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Skenario</th><th>Harga/kg</th><th>Penjualan</th><th>Margin</th><th>ROI</th><th>Status</th></tr></thead>
            <tbody>
              ${r.scenarios.map(s => `<tr>
                <td class="primary">${s.icon} ${s.nama}</td>
                <td>${fmt.rpFull(s.hargaPerKg)}</td>
                <td>${fmt.rp(s.penjualan)}</td>
                <td class="${s.margin>=0?'green':'red'}">${fmt.rp(s.margin)}</td>
                <td class="${s.roi>=0?'green':'red'}">${fmt.pct(s.roi)}</td>
                <td><span class="badge ${s.status==='untung'?'badge-success':s.status==='rugi'?'badge-danger':'badge-warning'}">${s.status}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- Update Harga -->
        ${!isCompleted ? `
        <div class="divider"></div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:10px;">⚙️ Update Harga Pasar</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <input type="number" class="form-control" id="update-harga-normal" value="${cycle.hargaPasar?.normal||38000}" placeholder="Harga Normal" style="flex:1;min-width:120px;">
          <input type="number" class="form-control" id="update-harga-hr" value="${cycle.hargaPasar?.hariRaya||45000}" placeholder="Harga Hari Raya" style="flex:1;min-width:120px;">
          <button class="btn btn-secondary btn-sm" onclick="updateHargaCycle('${cycle.id}')">Update</button>
        </div>` : ''}
      </div>
    </div>

    <!-- Charts -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;"><div class="card-icon blue">🥧</div> Komposisi Modal</div>
        <div class="chart-container" style="height:220px;">
          <canvas id="chart-pie-detail"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px;"><div class="card-icon green">📈</div> Biaya Kumulatif vs Revenue</div>
        <div class="chart-container" style="height:220px;">
          <canvas id="chart-line-detail"></canvas>
        </div>
      </div>
    </div>
    ` : `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Data tidak lengkap</div></div>`}

    ${isCompleted && cycle.actual ? `
    <!-- Actual Results -->
    <div class="card" style="margin-top:20px;border-color:rgba(16,185,129,0.3);">
      <div class="card-title" style="margin-bottom:14px;"><div class="card-icon green">✅</div> Hasil Actual Panen</div>
      <div class="stat-grid">
        <div class="stat-card green"><div class="stat-label">📅 Tgl Panen</div><div class="stat-value" style="font-size:1rem;">${fmt.date(cycle.actual.tglPanen)}</div></div>
        <div class="stat-card blue"><div class="stat-label">⚖️ Berat Actual</div><div class="stat-value">${cycle.actual.beratActual} kg</div></div>
        <div class="stat-card gold"><div class="stat-label">💰 Harga Jual</div><div class="stat-value">${fmt.rp(cycle.actual.hargaActual)}/kg</div></div>
        <div class="stat-card ${cycle.actual.marginActual>=0?'green':'red'}">
          <div class="stat-label">📈 Margin Actual</div>
          <div class="stat-value">${fmt.rp(cycle.actual.marginActual)}</div>
        </div>
      </div>
    </div>
    ` : ''}
  `;

  // Init charts
  if (r) {
    setTimeout(() => {
      initPieChart(r);
      initLineChart(cycle, r);
    }, 100);
  }
}

function initPieChart(r) {
  const ctx = document.getElementById('chart-pie-detail');
  if (!ctx) return;
  App.charts.pie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Modal Bibit', 'Biaya Pakan'],
      datasets: [{ data: [r.modalBibit, r.biayaPakan], backgroundColor: ['#f59e0b','#10b981'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 11 } } } }
    }
  });
}

function initLineChart(cycle, r) {
  const ctx = document.getElementById('chart-line-detail');
  if (!ctx) return;
  const dur = cycle.timeline?.durationMonths || 4;
  const labels = Array.from({length:dur+1}, (_,i) => `Bln ${i}`);
  const biayaPerBulan = r.biayaPakan / dur;

  const biayaKumulatif = labels.map((_,i) => {
    if (i === 0) return r.modalBibit;
    return r.modalBibit + (biayaPerBulan * i);
  });
  const penjNormal = r.scenarios.find(s=>s.key==='normal')?.penjualan || 0;
  const penjHariRaya = r.scenarios.find(s=>s.key==='hariRaya')?.penjualan || 0;
  const revLine = labels.map((_,i) => i < dur ? 0 : penjNormal);
  const revHR = labels.map((_,i) => i < dur ? 0 : penjHariRaya);

  App.charts.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Biaya Kumulatif', data: biayaKumulatif, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, borderWidth: 2 },
        { label: 'Revenue Normal', data: revLine, borderColor: '#3b82f6', borderDash: [5,5], tension: 0, borderWidth: 2, pointRadius: [0,0,0,0,6] },
        { label: 'Revenue Hari Raya', data: revHR, borderColor: '#f59e0b', borderDash: [5,5], tension: 0, borderWidth: 2, pointRadius: [0,0,0,0,6] },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#9ca3af', callback: v => 'Rp' + (v/1e6).toFixed(1)+'jt' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function updateHargaCycle(id) {
  const normal = parseInt(document.getElementById('update-harga-normal')?.value) || 38000;
  const hariRaya = parseInt(document.getElementById('update-harga-hr')?.value) || 45000;
  DB.updateCycle(id, { hargaPasar: { normal, hariRaya } });
  toast('Harga pasar diupdate!', 'success');
  navigate('detail');
}

function openPanenModal(id) {
  const cycle = DB.getCycleById(id);
  const r = Kalkulasi.generateRekomendasi(cycle);
  const today = new Date().toISOString().split('T')[0];
  openModal(
    '🏆 Finalisasi Panen',
    `<div class="form-group">
      <label class="form-label">Tanggal Panen Actual</label>
      <input type="date" class="form-control" id="panen-tgl" value="${today}">
    </div>
    <div class="form-group">
      <label class="form-label">Total Berat Actual (kg)</label>
      <input type="number" class="form-control" id="panen-berat" value="${r?.totalBeratPanen || 400}" min="1">
    </div>
    <div class="form-group">
      <label class="form-label">Harga Jual Actual (Rp/kg)</label>
      <input type="number" class="form-control" id="panen-harga" value="${cycle.hargaPasar?.normal || 38000}" step="500">
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
     <button class="btn btn-primary" onclick="finalisasiPanen('${id}')">✅ Konfirmasi Panen</button>`
  );
}

function finalisasiPanen(id) {
  const tglPanen = document.getElementById('panen-tgl')?.value;
  const beratActual = parseFloat(document.getElementById('panen-berat')?.value) || 0;
  const hargaActual = parseFloat(document.getElementById('panen-harga')?.value) || 0;
  const cycle = DB.getCycleById(id);
  const r = Kalkulasi.generateRekomendasi(cycle);
  const penjualanActual = beratActual * hargaActual;
  const marginActual = penjualanActual - (r?.totalModal || 0);

  DB.completeCycle(id, { tglPanen, beratActual, hargaActual, penjualanActual, marginActual });
  closeModal();
  toast('🎉 Panen berhasil dicatat!', 'success');
  navigate('detail');
}

// ─────────────────────────────────────────────────────────────
// LAPORAN
// ─────────────────────────────────────────────────────────────
function renderLaporan(el) {
  document.getElementById('header-title').textContent = 'Laporan & Grafik';
  document.getElementById('header-subtitle').textContent = 'Analisis historis seluruh siklus ternak';

  const cycles = DB.getCycles();
  const completed = cycles.filter(c => c.status === 'completed');
  const all = cycles.map(c => {
    const r = Kalkulasi.generateRekomendasi(c);
    return { ...c, r };
  });

  const totalModal = all.reduce((s,c) => s + (c.r?.totalModal||0), 0);
  const totalMargin = completed.reduce((s,c) => {
    const m = c.actual?.marginActual ?? (c.r?.bestScenario?.margin||0);
    return s + m;
  }, 0);
  const avgROI = completed.length > 0
    ? completed.reduce((s,c) => s + (c.r?.bestScenario?.roi||0), 0) / completed.length
    : 0;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">📊 Laporan & <span>Grafik</span></div>
      <div class="page-desc">Analisis historis seluruh siklus ternak Anda.</div>
    </div>

    <div class="stat-grid" style="margin-bottom:24px;">
      <div class="stat-card gold"><div class="stat-label">📋 Total Siklus</div><div class="stat-value">${cycles.length}</div><div class="stat-sub">${completed.length} selesai</div></div>
      <div class="stat-card blue"><div class="stat-label">💰 Total Modal</div><div class="stat-value">${fmt.rp(totalModal)}</div></div>
      <div class="stat-card ${totalMargin>=0?'green':'red'}"><div class="stat-label">📈 Total Margin</div><div class="stat-value">${fmt.rp(totalMargin)}</div></div>
      <div class="stat-card purple"><div class="stat-label">📊 Avg ROI</div><div class="stat-value">${avgROI.toFixed(1)}%</div></div>
    </div>

    ${cycles.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-title">Belum ada data siklus</div>
        <div class="empty-desc">Mulai siklus baru untuk melihat laporan dan grafik.</div>
        <button class="btn btn-primary" onclick="startNewCycle()">➕ Mulai Siklus Baru</button>
      </div>
    ` : `
    <div class="grid-2" style="margin-bottom:20px;">
      <div class="card">
        <div class="card-title" style="margin-bottom:16px;"><div class="card-icon gold">📈</div> Modal vs Margin per Siklus</div>
        <div class="chart-container" style="height:260px;"><canvas id="chart-laporan-bar"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px;"><div class="card-icon blue">🥧</div> Status Siklus</div>
        <div class="chart-container" style="height:260px;"><canvas id="chart-laporan-pie"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title"><div class="card-icon green">📋</div> Riwayat Semua Siklus</div>
        <button class="btn btn-primary btn-sm" onclick="exportPDFAll()">📄 Export PDF</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Nama Siklus</th><th>Tgl Masuk</th><th>Durasi</th>
            <th>Total Ekor</th><th>Total Modal</th><th>BEP Harga</th>
            <th>Best Margin</th><th>Status</th><th>Aksi</th>
          </tr></thead>
          <tbody>
            ${all.map(c => {
              const margin = c.actual?.marginActual ?? (c.r?.bestScenario?.margin||0);
              const ekor = (c.bibit?.jumlahJantan||0)+(c.bibit?.jumlahBetina||0);
              return `<tr>
                <td class="primary">${c.nama||'Siklus'}</td>
                <td>${fmt.date(c.timeline?.tglMasukBibit)}</td>
                <td>${c.timeline?.durationMonths||4} bln</td>
                <td>${ekor} ekor</td>
                <td class="gold">${c.r?fmt.rp(c.r.totalModal):'-'}</td>
                <td>${c.r?fmt.rp(c.r.breakEvenPrice)+'/kg':'-'}</td>
                <td class="${margin>=0?'green':'red'}">${fmt.rp(margin)}</td>
                <td><span class="badge ${c.status==='completed'?'badge-success':'badge-warning'}">${c.status==='completed'?'✅ Selesai':'● Berjalan'}</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onclick="App.currentCycleId='${c.id}';navigate('detail');">Lihat →</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    `}
  `;

  if (cycles.length > 0) {
    setTimeout(() => {
      initLaporanCharts(all, completed);
    }, 100);
  }
}

function initLaporanCharts(all, completed) {
  const ctxBar = document.getElementById('chart-laporan-bar');
  const ctxPie = document.getElementById('chart-laporan-pie');

  if (ctxBar) {
    App.charts.lBar = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: all.map(c => c.nama || 'Siklus'),
        datasets: [
          { label: 'Total Modal', data: all.map(c => c.r?.totalModal||0), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
          { label: 'Best Margin', data: all.map(c => Math.max(0, (c.actual?.marginActual ?? c.r?.bestScenario?.margin) || 0)), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9ca3af' } } },
        scales: {
          x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#9ca3af', callback: v => 'Rp' + (v/1e6).toFixed(1)+'jt' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  if (ctxPie) {
    const ongoing = all.filter(c => c.status==='ongoing').length;
    App.charts.lPie = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['Selesai', 'Berjalan'],
        datasets: [{ data: [completed.length, ongoing], backgroundColor: ['#10b981','#f59e0b'], borderWidth: 0, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } }
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// HARGA PASAR
// ─────────────────────────────────────────────────────────────
function renderHargaPasar(el) {
  document.getElementById('header-title').textContent = 'Harga Pasar';
  document.getElementById('header-subtitle').textContent = 'Update harga babi & pantau musim hari raya';

  const hp = DB.getHargaPasar();
  const hr = Kalkulasi.nextHariRaya();

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">💹 Harga <span>Pasar</span></div>
      <div class="page-desc">Update harga pasar babi secara berkala untuk kalkulasi profit yang akurat.</div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><div class="card-icon gold">💹</div> Update Harga Pasar Babi</div>
        </div>
        <div class="form-group">
          <label class="form-label">Harga Normal (Rp/kg)</label>
          <input type="number" class="form-control" id="hp-normal" value="${hp.normal}" step="500" min="20000">
          <div class="form-hint">Harga rata-rata di luar musim hari raya. Saat ini: ${fmt.rpFull(hp.normal)}/kg</div>
        </div>
        <div class="form-group">
          <label class="form-label">Harga Musim Hari Raya (Rp/kg)</label>
          <input type="number" class="form-control" id="hp-hariRaya" value="${hp.hariRaya}" step="500" min="20000">
          <div class="form-hint">Harga saat Galungan, Kuningan, Nyepi, dll.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Custom Harga (Rp/kg)</label>
          <input type="number" class="form-control" id="hp-custom" value="${hp.custom||41000}" step="500" min="20000">
          <div class="form-hint">Harga spesifik untuk simulasi manual</div>
        </div>
        ${hp.updatedAt ? `<div style="font-size:0.72rem;color:var(--text-muted);">Terakhir diupdate: ${fmt.date(hp.updatedAt)}</div>` : ''}
        <div style="margin-top:16px;">
          <button class="btn btn-primary" onclick="saveHargaPasar()">💾 Simpan Harga</button>
        </div>
      </div>

      <div>
        <!-- Hari Raya Card -->
        <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.05));border-color:rgba(245,158,11,0.3);">
          <div style="text-align:center;padding:10px 0;">
            <div style="font-size:2.5rem;margin-bottom:8px;">🎊</div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--primary);">Galungan Berikutnya</div>
            <div style="font-size:2rem;font-weight:800;color:var(--text-primary);margin:8px 0;">${hr.daysUntil} Hari</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);">${hr.dateStr}</div>
            <div class="divider"></div>
            <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;">
              📈 Historis: harga babi naik 15–25% saat Galungan<br>
              🌾 Harga pakan juga cenderung naik 10–15%<br>
              ⚡ Pastikan timing panen tepat sasaran!
            </div>
          </div>
        </div>

        <!-- Harga Referensi Bali -->
        <div class="card">
          <div class="card-title" style="margin-bottom:14px;"><div class="card-icon blue">📖</div> Referensi Harga Bali</div>
          <table style="font-size:0.82rem;">
            <thead><tr><th>Kondisi</th><th>Harga/kg</th><th>Keterangan</th></tr></thead>
            <tbody>
              ${[
                { kondisi:'Harga Terendah', harga:'30.000–35.000', ket:'Supply berlebih, off-season' },
                { kondisi:'Harga Normal', harga:'38.000–42.000', ket:'Kondisi pasar stabil' },
                { kondisi:'Menjelang Galungan', harga:'43.000–48.000', ket:'2–4 minggu sebelum hari raya' },
                { kondisi:'Saat Galungan', harga:'45.000–55.000', ket:'Permintaan puncak' },
                { kondisi:'Post Hari Raya', harga:'36.000–40.000', ket:'Harga turun setelah puncak' },
              ].map(r => `<tr>
                <td class="primary">${r.kondisi}</td>
                <td class="gold">${r.harga}</td>
                <td style="color:var(--text-muted);">${r.ket}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function saveHargaPasar() {
  const normal = parseInt(document.getElementById('hp-normal')?.value) || 38000;
  const hariRaya = parseInt(document.getElementById('hp-hariRaya')?.value) || 45000;
  const custom = parseInt(document.getElementById('hp-custom')?.value) || 41000;
  DB.setHargaPasar({ normal, hariRaya, custom });
  toast('✅ Harga pasar berhasil disimpan!', 'success');
}

// ─────────────────────────────────────────────────────────────
// RIWAYAT SIKLUS
// ─────────────────────────────────────────────────────────────
function renderRiwayat(el) {
  document.getElementById('header-title').textContent = 'Riwayat Siklus';
  document.getElementById('header-subtitle').textContent = 'Semua siklus ternak Anda';

  const cycles = DB.getCycles();

  el.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="page-title">📋 Riwayat <span>Siklus</span></div>
          <div class="page-desc">${cycles.length} siklus terdaftar</div>
        </div>
        <button class="btn btn-primary" onclick="startNewCycle()">➕ Siklus Baru</button>
      </div>
    </div>

    ${cycles.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🐷</div>
        <div class="empty-title">Belum ada siklus</div>
        <div class="empty-desc">Mulai siklus pertama Anda untuk mulai tracking!</div>
        <button class="btn btn-primary" onclick="startNewCycle()">➕ Mulai Siklus Baru</button>
      </div>
    ` : `
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${cycles.map(c => {
        const r = Kalkulasi.generateRekomendasi(c);
        const progress = c.timeline ? Kalkulasi.progressTimeline(c.timeline.tglMasukBibit, c.timeline.durationMonths||4) : null;
        const margin = c.actual?.marginActual ?? (r?.bestScenario?.margin || 0);
        const ekor = (c.bibit?.jumlahJantan||0)+(c.bibit?.jumlahBetina||0);

        return `
          <div class="card" style="cursor:pointer;" onclick="App.currentCycleId='${c.id}';navigate('detail');"
            onmouseover="this.style.borderColor='rgba(245,158,11,0.3)'"
            onmouseout="this.style.borderColor='var(--border)'">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:12px;">
              <div>
                <div style="font-size:1rem;font-weight:700;color:var(--text-primary);">${c.nama || 'Siklus Ternak'}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px;">
                  Masuk: ${fmt.date(c.timeline?.tglMasukBibit)} · ${ekor} ekor · ${c.timeline?.durationMonths||4} bulan
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
                <span class="badge ${c.status==='completed'?'badge-success':'badge-warning'}">${c.status==='completed'?'✅ Selesai':'● Berjalan'}</span>
                <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();deleteCycle('${c.id}')" title="Hapus">🗑️</button>
              </div>
            </div>

            ${progress && c.status==='ongoing' ? `
            <div class="timeline-bar-wrap" style="margin-bottom:8px;">
              <div class="timeline-bar" style="width:${progress.percent}%"></div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:12px;">
              ${progress.percent}% · Sisa ${progress.sisaHari} hari
            </div>
            ` : ''}

            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              ${r ? `
                <div><div style="font-size:0.7rem;color:var(--text-muted);">Total Modal</div><div style="font-weight:700;color:var(--primary);">${fmt.rp(r.totalModal)}</div></div>
                <div><div style="font-size:0.7rem;color:var(--text-muted);">BEP</div><div style="font-weight:700;">${fmt.rp(r.breakEvenPrice)}/kg</div></div>
                <div><div style="font-size:0.7rem;color:var(--text-muted);">Margin Terbaik</div><div style="font-weight:700;color:${margin>=0?'var(--accent-green)':'var(--accent-red)'};">${fmt.rp(margin)}</div></div>
                <div><div style="font-size:0.7rem;color:var(--text-muted);">Status SPK</div><div style="font-size:0.78rem;font-weight:600;color:${r.status==='lanjut'?'var(--accent-green)':r.status==='pertimbangkan'?'var(--primary)':'var(--accent-red)'};">${r.judulReko.replace(/^[^\s]+\s/,'').substring(0,30)}...</div></div>
              ` : '<div style="color:var(--text-muted);font-size:0.8rem;">Data tidak lengkap</div>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    `}
  `;
}

function deleteCycle(id) {
  if (!confirm('Hapus siklus ini? Tindakan tidak dapat dibatalkan.')) return;
  DB.deleteCycle(id);
  toast('Siklus dihapus', 'info');
  navigate('riwayat');
}

// ─────────────────────────────────────────────────────────────
// EXPORT PDF
// ─────────────────────────────────────────────────────────────
function exportPDF(id) {
  const cycle = DB.getCycleById(id);
  if (!cycle) return;
  const r = Kalkulasi.generateRekomendasi(cycle);
  const user = DB.getUser();

  const printWin = window.open('', '_blank');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan SPK - ${cycle.nama || 'Siklus Ternak'}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #1a1a1a; }
        h1 { color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 20px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 12px 0; }
        .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        .val { font-size: 16px; font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th { background: #f9fafb; padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-size: 11px; }
        td { padding: 8px; border: 1px solid #e5e7eb; }
        .green { color: #059669; } .red { color: #dc2626; } .gold { color: #d97706; font-weight: 700; }
        .alert { padding: 12px; border-radius: 8px; margin: 12px 0; }
        .alert-green { background: #f0fdf4; border: 1px solid #86efac; }
        .alert-yellow { background: #fffbeb; border: 1px solid #fde68a; }
        .alert-red { background: #fef2f2; border: 1px solid #fca5a5; }
      </style>
    </head>
    <body>
      <h1>🐷 SPK Ternak Babi — Laporan Siklus</h1>
      <p><strong>Peternak:</strong> ${user?.nama || '-'} | <strong>Lokasi:</strong> ${user?.lokasi || '-'}</p>
      <p><strong>Siklus:</strong> ${cycle.nama || 'Siklus Ternak'} | <strong>Tgl Generate:</strong> ${new Date().toLocaleDateString('id-ID')}</p>

      <h2>📋 Ringkasan Modal</h2>
      <div class="grid">
        <div class="box"><div class="label">Modal Bibit</div><div class="val gold">${r ? Kalkulasi.formatRpFull(r.modalBibit) : '-'}</div></div>
        <div class="box"><div class="label">Biaya Pakan</div><div class="val gold">${r ? Kalkulasi.formatRpFull(r.biayaPakan) : '-'}</div></div>
        <div class="box"><div class="label">Total Modal</div><div class="val gold">${r ? Kalkulasi.formatRpFull(r.totalModal) : '-'}</div></div>
        <div class="box"><div class="label">Harga Break-Even</div><div class="val">${r ? Kalkulasi.formatRpFull(r.breakEvenPrice) + '/kg' : '-'}</div></div>
      </div>

      <h2>📅 Data Ternak</h2>
      <div class="grid">
        <div class="box"><div class="label">Total Ekor</div><div class="val">${(cycle.bibit?.jumlahJantan||0)+(cycle.bibit?.jumlahBetina||0)} ekor</div></div>
        <div class="box"><div class="label">Tanggal Masuk</div><div class="val">${cycle.timeline?.tglMasukBibit || '-'}</div></div>
        <div class="box"><div class="label">Durasi Ternak</div><div class="val">${cycle.timeline?.durationMonths || 4} bulan</div></div>
        <div class="box"><div class="label">Target Berat Panen</div><div class="val">${r?.totalBeratPanen || '-'} kg</div></div>
      </div>

      <h2>💰 Skenario Keuntungan</h2>
      <table>
        <thead><tr><th>Skenario</th><th>Harga/kg</th><th>Penjualan</th><th>Margin</th><th>ROI</th><th>Status</th></tr></thead>
        <tbody>
          ${r?.scenarios.map(s => `<tr>
            <td>${s.nama}</td>
            <td>${Kalkulasi.formatRpFull(s.hargaPerKg)}</td>
            <td>${Kalkulasi.formatRpFull(s.penjualan)}</td>
            <td class="${s.margin>=0?'green':'red'}">${Kalkulasi.formatRpFull(s.margin)}</td>
            <td class="${s.roi>=0?'green':'red'}">${s.roi.toFixed(1)}%</td>
            <td>${s.status}</td>
          </tr>`).join('') || ''}
        </tbody>
      </table>

      <h2>🧠 Rekomendasi SPK</h2>
      <div class="alert ${r?.status==='lanjut'?'alert-green':r?.status==='pertimbangkan'?'alert-yellow':'alert-red'}">
        <strong>${r?.judulReko || '-'}</strong><br>
        <span style="font-size:12px;">${r?.descReko || '-'}</span>
      </div>

      ${cycle.actual ? `
      <h2>✅ Hasil Actual Panen</h2>
      <div class="grid">
        <div class="box"><div class="label">Tgl Panen Actual</div><div class="val">${cycle.actual.tglPanen || '-'}</div></div>
        <div class="box"><div class="label">Berat Actual</div><div class="val">${cycle.actual.beratActual} kg</div></div>
        <div class="box"><div class="label">Harga Jual</div><div class="val">${Kalkulasi.formatRpFull(cycle.actual.hargaActual)}/kg</div></div>
        <div class="box"><div class="label">Margin Actual</div><div class="val ${cycle.actual.marginActual>=0?'green':'red'}">${Kalkulasi.formatRpFull(cycle.actual.marginActual)}</div></div>
      </div>` : ''}

      <p style="margin-top:30px;font-size:10px;color:#9ca3af;text-align:center;">
        Digenerate oleh SPK Ternak Babi — ${new Date().toLocaleString('id-ID')}
      </p>
    </body>
    </html>
  `);
  printWin.document.close();
  printWin.print();
}

function exportPDFAll() {
  toast('Membuka laporan PDF...', 'info');
  const cycles = DB.getCycles();
  if (cycles.length > 0) exportPDF(cycles[0].id);
}

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Auto-init step 1 preview
  if (document.getElementById('s1-calc-preview')) updateStep1Calc();
  if (document.getElementById('pakan-preview-table')) updatePakanPreview();
  if (document.getElementById('timeline-preview')) updateTimelinePreview();

  const user = DB.getUser();
  if (user) {
    initApp();
  } else {
    renderLogin();
  }
});
