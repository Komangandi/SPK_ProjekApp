import streamlit as st
from supabase import create_client, Client
import bcrypt
import json
import pandas as pd

# Supabase Initialization
@st.cache_resource
def init_connection() -> Client:
    try:
        url = st.secrets["SUPABASE_URL"]
        key = st.secrets["SUPABASE_KEY"]
        return create_client(url, key)
    except Exception as e:
        st.error("Gagal terhubung ke Supabase. Pastikan SUPABASE_URL dan SUPABASE_KEY sudah diset di secrets.toml")
        raise e

supabase = init_connection()

# Password Hashing
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Seed Data
def init_seed_data():
    # Cek & inisialisasi tabel users
    users = supabase.table('users').select('*').limit(1).execute().data
    if not users:
        default_users = [
            {'username': 'admin', 'password_hash': hash_password('admin123'), 'role': 'admin'},
            {'username': 'dm1', 'password_hash': hash_password('dm123'), 'role': 'dm'},
            {'username': 'dm2', 'password_hash': hash_password('dm123'), 'role': 'dm'},
            {'username': 'dm3', 'password_hash': hash_password('dm123'), 'role': 'dm'},
            {'username': 'dm4', 'password_hash': hash_password('dm123'), 'role': 'dm'},
            {'username': 'pimpinan', 'password_hash': hash_password('pimpinan123'), 'role': 'pimpinan'}
        ]
        supabase.table('users').insert(default_users).execute()
    
    # Cek & inisialisasi tabel kriteria
    kriteria = supabase.table('kriteria').select('*').limit(1).execute().data
    if not kriteria:
        kriteria_data = [
            {'kode': 'C1',  'nama': 'Jumlah Penduduk',                      'jenis': 'benefit'},
            {'kode': 'C2',  'nama': 'Potensi Pelanggan',                     'jenis': 'benefit'},
            {'kode': 'C3',  'nama': 'Kepadatan Permukiman',                  'jenis': 'benefit'},
            {'kode': 'C4',  'nama': 'Aksesibilitas Lokasi',                  'jenis': 'benefit'},
            {'kode': 'C5',  'nama': 'Tingkat Kebutuhan Internet',            'jenis': 'benefit'},
            {'kode': 'C6',  'nama': 'Potensi Pertumbuhan Wilayah',           'jenis': 'benefit'},
            {'kode': 'C7',  'nama': 'Jarak dari Jaringan Existing',          'jenis': 'cost'},
            {'kode': 'C8',  'nama': 'Ketersediaan Infrastruktur Pendukung',  'jenis': 'benefit'},
            {'kode': 'C9',  'nama': 'Potensi Pendapatan',                    'jenis': 'benefit'},
            {'kode': 'C10', 'nama': 'Tingkat Permintaan Layanan',            'jenis': 'benefit'},
            {'kode': 'C11', 'nama': 'Estimasi Biaya Pembangunan',            'jenis': 'cost'},
            {'kode': 'C12', 'nama': 'Tingkat Kesulitan Instalasi',           'jenis': 'cost'},
        ]
        supabase.table('kriteria').insert(kriteria_data).execute()

    # Cek & inisialisasi tabel alternatif
    alternatif = supabase.table('alternatif').select('*').limit(1).execute().data
    if not alternatif:
        alternatif_data = [
            {'kode': 'A1',  'nama': 'Banjar Koripan Kaja'},
            {'kode': 'A2',  'nama': 'Banjar Koripan Kelod'},
            {'kode': 'A3',  'nama': 'Banjar Taman Surodadi'},
            {'kode': 'A4',  'nama': 'Banjar Suralaga'},
            {'kode': 'A5',  'nama': 'Banjar Tapesan'},
            {'kode': 'A6',  'nama': 'Banjar Pangkung Nyuling'},
            {'kode': 'A7',  'nama': 'Banjar Yangapi'},
            {'kode': 'A8',  'nama': 'Banjar Balu'},
            {'kode': 'A9',  'nama': 'Banjar Pasekan'},
            {'kode': 'A10', 'nama': 'Banjar Abiantuwung Kaja'},
            {'kode': 'A11', 'nama': 'Banjar Abiantuwung Kelod'},
            {'kode': 'A12', 'nama': 'Banjar Dakdakan'},
            {'kode': 'A13', 'nama': 'Banjar Ganter'},
        ]
        supabase.table('alternatif').insert(alternatif_data).execute()

# Reset & Re-seed Kriteria & Alternatif (untuk update data lama)
def reset_seed_kriteria_alternatif():
    """Hapus data lama dan isi ulang dengan data studi kasus yang benar."""
    # Reset kriteria
    supabase.table('kriteria').delete().neq('id', 0).execute()
    kriteria_data = [
        {'kode': 'C1',  'nama': 'Jumlah Penduduk',                      'jenis': 'benefit'},
        {'kode': 'C2',  'nama': 'Potensi Pelanggan',                     'jenis': 'benefit'},
        {'kode': 'C3',  'nama': 'Kepadatan Permukiman',                  'jenis': 'benefit'},
        {'kode': 'C4',  'nama': 'Aksesibilitas Lokasi',                  'jenis': 'benefit'},
        {'kode': 'C5',  'nama': 'Tingkat Kebutuhan Internet',            'jenis': 'benefit'},
        {'kode': 'C6',  'nama': 'Potensi Pertumbuhan Wilayah',           'jenis': 'benefit'},
        {'kode': 'C7',  'nama': 'Jarak dari Jaringan Existing',          'jenis': 'cost'},
        {'kode': 'C8',  'nama': 'Ketersediaan Infrastruktur Pendukung',  'jenis': 'benefit'},
        {'kode': 'C9',  'nama': 'Potensi Pendapatan',                    'jenis': 'benefit'},
        {'kode': 'C10', 'nama': 'Tingkat Permintaan Layanan',            'jenis': 'benefit'},
        {'kode': 'C11', 'nama': 'Estimasi Biaya Pembangunan',            'jenis': 'cost'},
        {'kode': 'C12', 'nama': 'Tingkat Kesulitan Instalasi',           'jenis': 'cost'},
    ]
    supabase.table('kriteria').insert(kriteria_data).execute()

    # Reset alternatif
    supabase.table('alternatif').delete().neq('id', 0).execute()
    alternatif_data = [
        {'kode': 'A1',  'nama': 'Banjar Koripan Kaja'},
        {'kode': 'A2',  'nama': 'Banjar Koripan Kelod'},
        {'kode': 'A3',  'nama': 'Banjar Taman Surodadi'},
        {'kode': 'A4',  'nama': 'Banjar Suralaga'},
        {'kode': 'A5',  'nama': 'Banjar Tapesan'},
        {'kode': 'A6',  'nama': 'Banjar Pangkung Nyuling'},
        {'kode': 'A7',  'nama': 'Banjar Yangapi'},
        {'kode': 'A8',  'nama': 'Banjar Balu'},
        {'kode': 'A9',  'nama': 'Banjar Pasekan'},
        {'kode': 'A10', 'nama': 'Banjar Abiantuwung Kaja'},
        {'kode': 'A11', 'nama': 'Banjar Abiantuwung Kelod'},
        {'kode': 'A12', 'nama': 'Banjar Dakdakan'},
        {'kode': 'A13', 'nama': 'Banjar Ganter'},
    ]
    supabase.table('alternatif').insert(alternatif_data).execute()

# CRUD Functions
def authenticate_user(username, password):
    user_res = supabase.table('users').select('*').eq('username', username).execute().data
    if user_res and check_password(password, user_res[0]['password_hash']):
        return user_res[0]
    return None

def get_kriteria():
    return supabase.table('kriteria').select('*').order('id').execute().data

def get_alternatif():
    return supabase.table('alternatif').select('*').order('id').execute().data

def get_ahp_matrix(username):
    res = supabase.table('ahp_matrix').select('*').eq('username', username).execute().data
    return res[0] if res else None

def save_ahp_matrix(username, matrix_list):
    # matrix_list is a 2D python list
    existing = get_ahp_matrix(username)
    if existing:
        supabase.table('ahp_matrix').update({'matrix': matrix_list}).eq('username', username).execute()
    else:
        supabase.table('ahp_matrix').insert({'username': username, 'matrix': matrix_list}).execute()

def get_all_ahp_matrices():
    return supabase.table('ahp_matrix').select('*').execute().data

def get_decision_matrix():
    res = supabase.table('decision_matrix').select('*').limit(1).execute().data
    if res and 'data' in res[0] and res[0]['data']:
        try:
            # Ensure proper structure
            df = pd.DataFrame(res[0]['data'])
            return df
        except Exception:
            return None
    return None

def save_decision_matrix(df: pd.DataFrame):
    json_data = df.to_dict(orient='records')
    res = supabase.table('decision_matrix').select('*').limit(1).execute().data
    if res:
        supabase.table('decision_matrix').update({'data': json_data}).eq('id', res[0]['id']).execute()
    else:
        supabase.table('decision_matrix').insert({'data': json_data}).execute()
