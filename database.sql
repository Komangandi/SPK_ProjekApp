-- Eksekusi kode SQL ini di Supabase SQL Editor untuk membuat tabel yang dibutuhkan.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE kriteria (
    id SERIAL PRIMARY KEY,
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL
);

CREATE TABLE alternatif (
    id SERIAL PRIMARY KEY,
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL
);

CREATE TABLE ahp_matrix (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    matrix JSONB NOT NULL
);

CREATE TABLE decision_matrix (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL
);

-- Note: Data default akan diisi otomatis oleh Streamlit saat aplikasi dijalankan jika tabel kosong.
