/* ============================================================
   DATA ENGINE — SPK TERNAK BABI
   localStorage-based persistence
   ============================================================ */

const DB = {
  // ── Keys ─────────────────────────────────────────────────
  KEYS: {
    USER:   'spk_user',
    CYCLES: 'spk_cycles',
    HARGA_PASAR: 'spk_harga_pasar',
  },

  // ── Helpers ───────────────────────────────────────────────
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // ── User ─────────────────────────────────────────────────
  getUser() { return this.get(this.KEYS.USER); },
  setUser(u) { this.set(this.KEYS.USER, u); },
  logout() { localStorage.removeItem(this.KEYS.USER); },

  // ── Cycles ────────────────────────────────────────────────
  getCycles() { return this.get(this.KEYS.CYCLES) || []; },
  saveCycles(cycles) { this.set(this.KEYS.CYCLES, cycles); },

  getCycleById(id) {
    return this.getCycles().find(c => c.id === id) || null;
  },

  createCycle(data) {
    const cycles = this.getCycles();
    const newCycle = {
      id: 'cycle_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'ongoing',
      ...data
    };
    cycles.unshift(newCycle);
    this.saveCycles(cycles);
    return newCycle;
  },

  updateCycle(id, updates) {
    const cycles = this.getCycles();
    const idx = cycles.findIndex(c => c.id === id);
    if (idx === -1) return null;
    cycles[idx] = { ...cycles[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveCycles(cycles);
    return cycles[idx];
  },

  deleteCycle(id) {
    const cycles = this.getCycles().filter(c => c.id !== id);
    this.saveCycles(cycles);
  },

  completeCycle(id, actual) {
    return this.updateCycle(id, {
      status: 'completed',
      actual,
      completedAt: new Date().toISOString()
    });
  },

  // ── Harga Pasar ───────────────────────────────────────────
  getHargaPasar() {
    return this.get(this.KEYS.HARGA_PASAR) || {
      normal: 38000,
      hariRaya: 45000,
      custom: null,
      updatedAt: null,
    };
  },
  setHargaPasar(h) { this.set(this.KEYS.HARGA_PASAR, { ...h, updatedAt: new Date().toISOString() }); },
};


// ─────────────────────────────────────────────────────────────
// KALKULASI ENGINE
// ─────────────────────────────────────────────────────────────
const Kalkulasi = {

  /**
   * Hitung modal bibit
   */
  modalBibit(bibit) {
    const jantan = (bibit.jumlahJantan || 0) * (bibit.hargaJantan || 0);
    const betina = (bibit.jumlahBetina || 0) * (bibit.hargaBetina || 0);
    return {
      modalJantan: jantan,
      modalBetina: betina,
      totalModal: jantan + betina,
      totalEkor: (bibit.jumlahJantan || 0) + (bibit.jumlahBetina || 0),
    };
  },

  /**
   * Hitung konsumsi dan biaya pakan per satu SKU
   */
  hitungPakanSKU(sku, jumlahEkor, durationMonths) {
    const konsumsiHari = jumlahEkor * (sku.porsiPerEkor || 1) * (sku.frekuensiPerHari || 3);
    const konsumsiTotal = konsumsiHari * (durationMonths * 30);
    const karung = Math.ceil(konsumsiTotal / (sku.beratPerKarung || 50));
    const biayaTotal = karung * (sku.hargaPerKarung || 0);
    return {
      ...sku,
      konsumsiHari: parseFloat(konsumsiHari.toFixed(2)),
      konsumsiTotal: parseFloat(konsumsiTotal.toFixed(2)),
      karung,
      biayaTotal,
      preview: [1,2,3,4,5,6].map(m => ({
        bulan: m,
        konsumsiKg: parseFloat((konsumsiHari * 30 * m).toFixed(2)),
        karungNeeded: Math.ceil((konsumsiHari * 30 * m) / (sku.beratPerKarung || 50)),
        biaya: Math.ceil((konsumsiHari * 30 * m) / (sku.beratPerKarung || 50)) * (sku.hargaPerKarung || 0),
      }))
    };
  },

  /**
   * Hitung total biaya semua pakan
   */
  totalBiayaPakan(pakanList, jumlahEkor, durationMonths) {
    const computed = pakanList.map(p => this.hitungPakanSKU(p, jumlahEkor, durationMonths));
    const totalBiaya = computed.reduce((s, p) => s + p.biayaTotal, 0);
    return { computed, totalBiaya };
  },

  /**
   * Hitung estimasi berat panen
   */
  beratPanen(jumlahEkor, estimasiBeratPerEkor) {
    return jumlahEkor * estimasiBeratPerEkor;
  },

  /**
   * Hitung progress timeline
   */
  progressTimeline(tglMasuk, durationMonths) {
    const start = new Date(tglMasuk);
    const end = new Date(tglMasuk);
    end.setMonth(end.getMonth() + durationMonths);
    const now = new Date();

    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    const passedDays = Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)));
    const percent = Math.min(100, Math.round((passedDays / totalDays) * 100));
    const sisaHari = Math.max(0, totalDays - passedDays);

    let phase = 'intro';
    if (percent >= 75) phase = 'finishing';
    else if (percent >= 40) phase = 'growth';
    else if (percent >= 10) phase = 'intro';
    if (percent >= 95) phase = 'ready_harvest';

    const phaseMap = {
      intro: { label: 'Adaptasi', icon: '🐣', desc: 'Bibit baru masuk, fase adaptasi kandang.' },
      growth: { label: 'Pertumbuhan', icon: '📈', desc: 'Fase pertumbuhan aktif, pantau konsumsi pakan.' },
      finishing: { label: 'Finishing', icon: '💪', desc: 'Fase pengemukan final, siap menjelang panen.' },
      ready_harvest: { label: 'Siap Panen', icon: '🏆', desc: 'Babi sudah mencapai target berat, pertimbangkan waktu panen.' },
    };

    return {
      start, end, totalDays, passedDays, sisaHari, percent,
      phase, phaseInfo: phaseMap[phase],
      targetPanen: end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  },

  /**
   * Hitung semua skenario keuntungan
   */
  hitungSkenario(totalModal, totalBeratPanen, hargaPasar, customHarga = []) {
    const scenarios = [
      { nama: 'Harga Normal', key: 'normal', hargaPerKg: hargaPasar.normal, warna: '#3b82f6', icon: '📊' },
      { nama: 'Musim Hari Raya', key: 'hariRaya', hargaPerKg: hargaPasar.hariRaya, warna: '#f59e0b', icon: '🎊' },
      ...customHarga,
    ];

    const results = scenarios.map(s => {
      const penjualan = totalBeratPanen * s.hargaPerKg;
      const margin = penjualan - totalModal;
      const roi = totalModal > 0 ? ((margin / totalModal) * 100) : 0;
      const status = margin > 0 ? 'untung' : margin === 0 ? 'impas' : 'rugi';
      return { ...s, penjualan, margin, roi: parseFloat(roi.toFixed(1)), status };
    });

    const breakEven = totalBeratPanen > 0 ? Math.ceil(totalModal / totalBeratPanen) : 0;
    const bestScenario = results.reduce((best, s) => s.margin > best.margin ? s : best, results[0]);

    return { scenarios: results, breakEven, bestScenario };
  },

  /**
   * Generate rekomendasi SPK
   */
  generateRekomendasi(cycle) {
    const { bibit, pakan, timeline, hargaPasar } = cycle;
    if (!bibit || !pakan || !timeline) return null;

    const bibitCalc = this.modalBibit(bibit);
    const jumlahEkor = bibitCalc.totalEkor;
    const { totalBiaya: totalBiayaPakan } = this.totalBiayaPakan(
      pakan, jumlahEkor, timeline.durationMonths
    );
    const totalModal = bibitCalc.totalModal + totalBiayaPakan;
    const totalBerat = this.beratPanen(jumlahEkor, timeline.estimasiBeratPerEkor || 100);
    const { scenarios, breakEven, bestScenario } = this.hitungSkenario(totalModal, totalBerat, hargaPasar || DB.getHargaPasar());

    const marginTerbaik = bestScenario.margin;
    const skenarioNormal = scenarios.find(s => s.key === 'normal');
    const skenarioHariRaya = scenarios.find(s => s.key === 'hariRaya');

    // Rule-based SPK
    let shouldProceed = true;
    let status = 'lanjut';
    let judulReko = '';
    let descReko = '';
    let riskLevel = 'rendah';
    const riskFactors = [];
    const insights = [];
    let optimalWaktu = 'kapan siap';

    // Rule 1: Profitability
    if (marginTerbaik <= 0) {
      shouldProceed = false;
      status = 'hati-hati';
      riskLevel = 'tinggi';
      judulReko = '⚠️ Pertimbangkan Ulang Investasi Ini';
      descReko = `Berdasarkan kalkulasi, bahkan pada skenario terbaik (${bestScenario.nama}) margin masih negatif (${this.formatRp(marginTerbaik)}). Investasi ini berisiko tinggi.`;
      riskFactors.push('Margin negatif di semua skenario harga');
    } else if (skenarioNormal && skenarioNormal.margin <= 0 && skenarioHariRaya && skenarioHariRaya.margin > 0) {
      status = 'pertimbangkan';
      riskLevel = 'sedang';
      judulReko = '🕐 Tunggu Hari Raya — Waktu Panen Kritis';
      descReko = `Pada harga normal (${this.formatRp(hargaPasar?.normal || 38000)}/kg) investasi ini RUGI. Namun saat hari raya (${this.formatRp(hargaPasar?.hariRaya || 45000)}/kg) bisa untung ${this.formatRp(skenarioHariRaya.margin)}. Pastikan panen tepat saat hari raya.`;
      optimalWaktu = 'saat hari raya (Galungan/Kuningan)';
      riskFactors.push('Hanya profitable saat musim hari raya');
      riskFactors.push('Keterlambatan panen = kerugian');
    } else if (marginTerbaik > 0 && skenarioNormal && skenarioNormal.margin > 0) {
      status = 'lanjut';
      riskLevel = 'rendah';
      judulReko = '✅ Lanjutkan Investasi — Projek Menguntungkan';
      descReko = `Investasi ini profitable di semua skenario. Margin tertinggi ${this.formatRp(marginTerbaik)} (ROI ${bestScenario.roi}%) saat ${bestScenario.nama}. Modal akan kembali dalam estimasi ${Math.ceil(timeline.durationMonths * 1.1)} bulan.`;
    }

    // Rule 2: Hari Raya timing
    if (skenarioHariRaya && skenarioNormal) {
      const premiumHariRaya = ((skenarioHariRaya.penjualan - skenarioNormal.penjualan) / skenarioNormal.penjualan) * 100;
      if (premiumHariRaya >= 15) {
        insights.push({
          icon: '🎊',
          label: 'Premium Hari Raya',
          value: `+${premiumHariRaya.toFixed(0)}% harga`,
          sub: `Panen saat hari raya tambah ${this.formatRp(skenarioHariRaya.penjualan - skenarioNormal.penjualan)}`
        });
        if (status !== 'hati-hati') optimalWaktu = 'saat hari raya untuk margin maksimal';
      }
    }

    // Rule 3: Break-even insight
    const hargaNormal = hargaPasar?.normal || 38000;
    const marginPerKg = hargaNormal - breakEven;
    insights.push({
      icon: '⚖️',
      label: 'Harga Break-Even',
      value: this.formatRp(breakEven) + '/kg',
      sub: marginPerKg >= 0
        ? `Aman — harga pasar ${this.formatRp(marginPerKg)}/kg di atas BEP`
        : `⚠️ Harga pasar ${this.formatRp(Math.abs(marginPerKg))}/kg DI BAWAH BEP`
    });

    insights.push({
      icon: '💰',
      label: 'ROI Terbaik',
      value: `${bestScenario.roi}%`,
      sub: bestScenario.nama
    });

    insights.push({
      icon: '📦',
      label: 'Total Modal',
      value: this.formatRp(totalModal),
      sub: `Bibit: ${this.formatRp(bibitCalc.totalModal)} | Pakan: ${this.formatRp(totalBiayaPakan)}`
    });

    // Risk: harga pakan naik 10%
    const modalIfPakanNaik = bibitCalc.totalModal + (totalBiayaPakan * 1.10);
    const marginIfPakanNaik = (totalBerat * (hargaPasar?.hariRaya || 45000)) - modalIfPakanNaik;
    if (marginIfPakanNaik < 0) {
      riskFactors.push('Jika harga pakan naik 10%, margin skenario hari raya pun bisa negatif');
      if (riskLevel === 'rendah') riskLevel = 'sedang';
    }

    // Pakan efficiency
    const bepHarga = breakEven;
    insights.push({
      icon: '🐷',
      label: 'Total Berat Panen',
      value: `${totalBerat} kg`,
      sub: `${jumlahEkor} ekor × ${timeline.estimasiBeratPerEkor || 100} kg/ekor`
    });

    return {
      shouldProceed,
      status,
      judulReko,
      descReko,
      riskLevel,
      riskFactors,
      optimalWaktu,
      breakEvenPrice: breakEven,
      profitabilityScore: marginTerbaik > 0 ? Math.min(1, marginTerbaik / totalModal) : 0,
      insights,
      scenarios,
      bestScenario,
      totalModal,
      totalBeratPanen: totalBerat,
      modalBibit: bibitCalc.totalModal,
      biayaPakan: totalBiayaPakan,
    };
  },

  // ── Format Helpers ────────────────────────────────────────
  formatRp(n) {
    if (n === undefined || n === null) return 'Rp 0';
    const abs = Math.abs(n);
    const prefix = n < 0 ? '-Rp ' : 'Rp ';
    if (abs >= 1_000_000_000) return prefix + (abs / 1_000_000_000).toFixed(1) + ' M';
    if (abs >= 1_000_000) return prefix + (abs / 1_000_000).toFixed(2) + ' jt';
    return prefix + abs.toLocaleString('id-ID');
  },

  formatRpFull(n) {
    if (n === undefined || n === null) return 'Rp 0';
    const abs = Math.abs(n);
    const prefix = n < 0 ? '-Rp ' : 'Rp ';
    return prefix + abs.toLocaleString('id-ID');
  },

  // ── Hari Raya Bali Calendar ───────────────────────────────
  // Galungan cycle: every 210 days (Pawukon calendar)
  nextHariRaya() {
    // Known Galungan dates 2026
    const galunganDates2026 = [
      new Date('2026-01-07'),
      new Date('2026-07-06'),
    ];
    const now = new Date();
    let next = galunganDates2026.find(d => d > now);
    if (!next) next = new Date('2027-01-27');

    const daysUntil = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    return {
      date: next,
      nama: 'Galungan',
      daysUntil,
      dateStr: next.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  },

  // ── Seed Data Demo ────────────────────────────────────────
  seedDemo() {
    if (DB.getCycles().length > 0) return;

    // Set user demo
    DB.setUser({ nama: 'Ni Putu Ayu Lesparini', lokasi: 'Gianyar, Bali', email: 'ayu@spkternak.id' });

    // Seed siklus demo dari data PRD
    DB.createCycle({
      nama: 'Siklus Juni 2026',
      bibit: {
        jumlahJantan: 2, hargaJantan: 1800000,
        jumlahBetina: 2, hargaBetina: 1700000,
        tipeTernak: 'pengemukan',
        estimasiUmurBibit: 60,
        catatan: 'Bibit beli dari pak Ketut, Ubud',
      },
      pakan: [
        {
          id: 'pakan_1',
          jenisPakan: 'Glower Standar',
          hargaPerKarung: 385000,
          beratPerKarung: 50,
          porsiPerEkor: 1,
          frekuensiPerHari: 3,
        }
      ],
      timeline: {
        tglMasukBibit: '2026-06-01',
        durationMonths: 4,
        estimasiBeratPerEkor: 100,
      },
      hargaPasar: { normal: 38000, hariRaya: 45000 },
    });
  }
};

// Auto seed on first load
DB.seedDemo();
