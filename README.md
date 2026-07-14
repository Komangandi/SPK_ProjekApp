# SISTEM PENDUKUNG KEPUTUSAN
### PENENTUAN PRIORITAS WILAYAH PENGEMBANGAN INFRASTRUKTUR JARINGAN FIBER OPTIC MENGGUNAKAN METODE HYBRID AHP–MOORA DENGAN PENDEKATAN GROUP DECISION SUPPORT SYSTEM (GDSS)
**(Studi Kasus: PT Internet Prima Nusantara – Desa Abian Tuwung, Kabupaten Tabanan)**

---

## 👥 Identitas Pembuat
**Disusun Oleh Kelompok Nyawit:**
- **I Komang Andi Kartikajaya** (240030339)
- **I Ketut Arya Pramana** (240030166)
- **I Ketut Cipta Ardyana** (240030141)

**Detail Mata Kuliah:**
- **Mata Kuliah:** Sistem Pendukung Keputusan (SPK)
- **Dosen Pengampu:** IGKG PURITAN WIJAYA ADH, S.Kom., MMSI.
- **Kode Kelas:** SI253529

---

## 🏗️ Arsitektur Sistem
Aplikasi Sistem Pendukung Keputusan Berkelompok (GDSS) ini dibangun menggunakan teknologi modern dengan arsitektur sebagai berikut:
- **Frontend & Backend (Business Logic):** [Streamlit (Python 3.10)](https://streamlit.io/) – Mengelola antarmuka pengguna (UI) yang interaktif dan memproses logika algoritma secara terpusat.
- **Database (BaaS):** [Supabase (PostgreSQL)](https://supabase.com/) – Mengelola basis data relasional (Autentikasi, Data Kriteria, Alternatif, dan Matriks Keputusan).
- **Komputasi Matematika:** `NumPy` dan `Pandas` – Menangani komputasi matriks kompleks (AHP dan MOORA).
- **Visualisasi Data:** `Plotly` – Menghasilkan grafik interaktif untuk hasil akhir di Dashboard Pimpinan.

---

## 🧮 Tahapan Perhitungan Model Hybrid AHP–MOORA
Proses perhitungan model Hybrid AHP–MOORA dilakukan melalui dua tahap utama, yaitu penentuan bobot kriteria menggunakan metode *Analytical Hierarchy Process (AHP)* dan proses perangkingan alternatif menggunakan metode *Multi-Objective Optimization on the Basis of Ratio Analysis (MOORA)*.

### 1. Tahap Pembobotan Kriteria dengan AHP
Pada tahap ini, penilaian perbandingan berpasangan antar kriteria dari seluruh *Decision Maker (DM)* terlebih dahulu digabungkan menggunakan metode *Aggregation of Individual Judgments (AIJ)* dengan rumus rata-rata geometrik (*Geometric Mean*):

$$ \bar{a}_{ij} = \left( \prod_{k=1}^{m} a_{ij}^{(k)} \right)^{\frac{1}{m}} $$

Dengan:
- $\bar{a}_{ij}$ = nilai gabungan perbandingan kriteria ke-$i$ terhadap kriteria ke-$j$.
- $a_{ij}^{(k)}$ = penilaian dari *Decision Maker* ke-$k$.
- $m$ = jumlah *Decision Maker*.

Selanjutnya dilakukan normalisasi matriks perbandingan berpasangan untuk memperoleh vektor prioritas (*eigen vector*) yang menjadi bobot setiap kriteria:

$$ W_j = [w_1, w_2, \dots, w_n] $$

Bobot yang dihasilkan kemudian diuji menggunakan *Consistency Ratio (CR)*. Apabila nilai $CR \le 0.1$, maka matriks perbandingan dianggap konsisten dan bobot dapat digunakan pada tahap berikutnya.

### 2. Tahap Perangkingan Alternatif dengan MOORA
**a. Pembentukan Matriks Keputusan**  
Menyusun matriks keputusan yang terdiri atas seluruh alternatif dan kriteria penilaian:

$$ X = [x_{ij}] $$

Dengan: $x_{ij}$ = nilai alternatif ke-$i$ pada kriteria ke-$j$.

**b. Normalisasi Matriks Keputusan**  
Normalisasi dilakukan menggunakan metode *vector normalization* agar seluruh kriteria berada pada skala yang sama:

$$ r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{i=1}^{m} x_{ij}^2}} $$

Dengan:
- $r_{ij}$ = nilai hasil normalisasi.
- $x_{ij}$ = nilai awal alternatif.
- $m$ = jumlah alternatif.

**c. Perhitungan Nilai Preferensi**  
Nilai preferensi setiap alternatif diperoleh dengan menjumlahkan seluruh nilai kriteria bertipe *benefit* yang telah dikalikan bobot AHP, kemudian dikurangi jumlah nilai kriteria bertipe *cost*.

$$ Y_i = \sum_{j \in \text{Benefit}} W_j r_{ij} - \sum_{j \in \text{Cost}} W_j r_{ij} $$

Dengan:
- $Y_i$ = nilai preferensi alternatif ke-$i$.
- $W_j$ = bobot kriteria hasil AHP.
- $r_{ij}$ = nilai normalisasi alternatif pada kriteria ke-$j$.

### 3. Penentuan Peringkat
Alternatif diurutkan berdasarkan nilai preferensi $Y_i$. Semakin besar nilai $Y_i$, semakin tinggi prioritas alternatif tersebut sehingga menjadi rekomendasi utama dalam pengambilan keputusan pengembangan infrastruktur jaringan *Fiber Optic*.

---

## 🌟 Fitur Utama Aplikasi
- **Multi-user Role**: Admin, DM 1-4 (*Decision Makers*), dan Pimpinan.
- **AHP**: Perhitungan matriks kuesioner otomatis dan *Geometric Mean* untuk menggabungkan 4 DM, disertai *Consistency Ratio (CR)*.
- **MOORA**: Perankingan alternatif 13 Banjar dari 12 Kriteria dengan dinamis.
- **Visualisasi Pimpinan**: Grafik interaktif (Plotly) dan ekspor laporan ke format CSV.

---

## 🔄 Alur Penggunaan (Workflow)
Agar mendapatkan hasil perhitungan akhir yang lengkap, silakan ikuti alur berikut:
1. **Admin**: Login $\rightarrow$ buka **Matriks Keputusan** $\rightarrow$ Masukkan nilai performa setiap alternatif terhadap kriteria $\rightarrow$ **Simpan**.
2. **Decision Maker (DM)**: Login (sebagai dm1, dm2, dll) $\rightarrow$ buka **Kuesioner AHP** $\rightarrow$ Masukkan bobot perbandingan antar kriteria (skala 1-9) $\rightarrow$ **Simpan**. *(Bisa diulang untuk DM lainnya agar hasilnya digabungkan)*.
3. **Pimpinan**: Login $\rightarrow$ buka **Dashboard Pimpinan**. Sistem akan secara otomatis menggabungkan kuesioner semua DM, mengecek validitas rasio konsistensi (CR), menghitung nilai MOORA dari matriks keputusan Admin, dan menampilkan visualisasi grafik peringkat alternatif terbaik.

---

## 🛠️ Cara Instalasi & Menjalankan di Lokal (Localhost)

1. Pastikan Anda menggunakan **Python 3.10**.
2. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```
3. Buat database Supabase (PostgreSQL), lalu eksekusi isi dari file `database.sql` ke dalam menu **SQL Editor** di Supabase. 
   - **PENTING**: Anda harus menonaktifkan *Row Level Security (RLS)* agar aplikasi bisa memasukkan (*insert*) data awal. Jalankan *query* ini di SQL Editor:
     ```sql
     ALTER TABLE users DISABLE ROW LEVEL SECURITY;
     ALTER TABLE kriteria DISABLE ROW LEVEL SECURITY;
     ALTER TABLE alternatif DISABLE ROW LEVEL SECURITY;
     ALTER TABLE ahp_matrix DISABLE ROW LEVEL SECURITY;
     ALTER TABLE decision_matrix DISABLE ROW LEVEL SECURITY;
     ```
4. Ubah nama file `.streamlit/secrets.toml.example` menjadi `.streamlit/secrets.toml`.
5. Ganti `SUPABASE_URL` dan `SUPABASE_KEY` dengan kredensial dari project Anda (di menu **Project Settings $\rightarrow$ API**).  
   *Catatan: Untuk `SUPABASE_KEY`, gunakan kunci `anon` / `public` (versi baru diawali `sb_publishable_`, versi lama `eyJhbG...`).*
6. Jalankan aplikasi Streamlit:
   ```bash
   streamlit run app.py
   ```
   *Saat pertama kali dijalankan, sistem akan otomatis melakukan seeding data jika tabel masih kosong (kriteria, alternatif, dan users).*

### Akun Login (Default)
- **admin** | password: `admin123`
- **dm1**, **dm2**, **dm3**, **dm4** | password: `dm123`
- **pimpinan** | password: `pimpinan123`

---

## 🌐 Cara Deployment ke Streamlit Community Cloud
1. Upload/Push semua folder project (kecuali file `secrets.toml`) ke GitHub Repository.
2. Login ke [Streamlit Community Cloud](https://share.streamlit.io).
3. Klik **New app**.
4. Hubungkan ke repository GitHub Anda, pilih branch `main`, dan set *Main file path* ke `app.py`.
5. Klik **Advanced settings** (atau App settings $\rightarrow$ Secrets) lalu masukkan secret Anda:
   ```toml
   SUPABASE_URL = "https://<id>.supabase.co"
   SUPABASE_KEY = "sb_publishable_..." # atau eyJhb...
   ```
6. Klik **Deploy!** Aplikasi Anda siap digunakan secara online.
