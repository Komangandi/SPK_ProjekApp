import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

# Setup page config must be the first Streamlit command
st.set_page_config(page_title="GDSS AHP-MOORA", layout="wide")

import database as db
import spk_core as core

# Inisialisasi Data (Jalankan sekali di awal)
try:
    db.init_seed_data()
except Exception as e:
    st.error(f"Gagal inisialisasi database: {e}")
    st.warning("Menunggu koneksi database dikonfigurasi dengan benar...")

# Inisialisasi Session State
if 'user' not in st.session_state:
    st.session_state['user'] = None

def login():
    st.title("Login Sistem GDSS")
    with st.form("login_form"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")
        if submitted:
            user = db.authenticate_user(username, password)
            if user:
                st.session_state['user'] = user
                st.success(f"Selamat datang, {user['username']}!")
                st.rerun()
            else:
                st.error("Username atau password salah")

def logout():
    st.session_state['user'] = None
    st.rerun()

def render_ahp_page():
    st.header("Kuesioner AHP (Pairwise Comparison)")
    st.write(f"Login sebagai: **{st.session_state['user']['username']}**")
    
    kriteria = db.get_kriteria()
    n = len(kriteria)
    kriteria_names = [k['nama'] for k in kriteria]
    
    # Ambil matriks dari database jika sudah ada
    existing = db.get_ahp_matrix(st.session_state['user']['username'])
    if existing and 'matrix' in existing:
        matrix = np.array(existing['matrix'])
    else:
        matrix = np.ones((n, n))
    
    st.write("Isi nilai perbandingan baris terhadap kolom (skala 1-9).")
    st.write("Nilai diagonal otomatis 1, kebalikan otomatis dihitung.")
    
    # Create DataFrame for Editor
    df_matrix = pd.DataFrame(matrix, columns=kriteria_names, index=kriteria_names)
    
    # Hanya izinkan edit di atas diagonal utama (Upper triangle)
    edited_df = st.data_editor(df_matrix, use_container_width=True)
    
    if st.button("Simpan Matriks AHP"):
        new_matrix = edited_df.values
        # Paksa konsistensi reciprokal
        for i in range(n):
            for j in range(n):
                if i == j:
                    new_matrix[i, j] = 1.0
                elif i < j:
                    val = new_matrix[i, j]
                    if val <= 0:
                        st.error("Nilai perbandingan harus > 0.")
                        return
                    new_matrix[j, i] = 1.0 / val
                
        db.save_ahp_matrix(st.session_state['user']['username'], new_matrix.tolist())
        st.success("Matriks AHP berhasil disimpan!")

def render_decision_matrix_page():
    st.header("Matriks Keputusan")
    
    kriteria = db.get_kriteria()
    alternatif = db.get_alternatif()
    
    kriteria_names = [k['kode'] for k in kriteria]
    alternatif_names = [a['nama'] for a in alternatif]
    
    existing_df = db.get_decision_matrix()
    if existing_df is not None and not existing_df.empty:
        df = existing_df
    else:
        # Inisialisasi matriks kosong dengan nilai 0
        df = pd.DataFrame(0.0, index=alternatif_names, columns=kriteria_names)
    
    # Pastikan index match (karena JSON tidak menyimpan index secara eksplisit jika orient=records)
    # Oleh karena itu, kita tambahkan kolom 'Alternatif' untuk editor
    if 'Alternatif' not in df.columns:
        df.insert(0, 'Alternatif', alternatif_names)
    else:
        df['Alternatif'] = alternatif_names
        
    st.write("Isi nilai performa untuk masing-masing alternatif terhadap kriteria.")
    
    # Gunakan data_editor
    edited_df = st.data_editor(df, use_container_width=True, disabled=['Alternatif'])
    
    if st.button("Simpan Matriks Keputusan"):
        db.save_decision_matrix(edited_df)
        st.success("Matriks Keputusan berhasil disimpan!")

def render_dashboard_page():
    st.header("Dashboard Pimpinan (Hasil AHP - MOORA)")
    
    # 1. AHP Aggregation
    st.subheader("1. Konsolidasi Bobot AHP")
    matrices_records = db.get_all_ahp_matrices()
    if not matrices_records:
        st.warning("Belum ada DM yang mengisi matriks AHP.")
        return
        
    matrices = [np.array(r['matrix']) for r in matrices_records]
    
    # Geometric Mean dari semua matriks DM
    aggr_matrix = core.ahp_geometric_mean(matrices)
    
    # Hitung Eigenvector dan CR
    weights, cr = core.ahp_weights_and_cr(aggr_matrix)
    
    kriteria = db.get_kriteria()
    kriteria_names = [k['nama'] for k in kriteria]
    criteria_types = [k['jenis'] for k in kriteria]
    
    df_weights = pd.DataFrame({'Kriteria': kriteria_names, 'Tipe': criteria_types, 'Bobot': weights})
    
    col1, col2 = st.columns(2)
    with col1:
        st.write("Bobot Kriteria Akhir:")
        st.dataframe(df_weights, use_container_width=True)
    with col2:
        st.write(f"**Consistency Ratio (CR):** {cr:.4f}")
        if cr <= 0.1:
            st.success("Status CR: Konsisten (Valid)")
        else:
            st.error("Status CR: Tidak Konsisten (> 0.1). Mohon tinjau ulang input DM.")
            
    # 2. MOORA Calculation
    st.subheader("2. Hasil Perankingan MOORA")
    dec_matrix = db.get_decision_matrix()
    
    if dec_matrix is None or dec_matrix.empty:
        st.warning("Matriks Keputusan belum diisi.")
        return
        
    alternatif_names = dec_matrix['Alternatif'].values
    eval_matrix = dec_matrix.drop(columns=['Alternatif'])
    
    # Hitung MOORA
    y_scores = core.moora_calculate(eval_matrix, weights, criteria_types)
    
    # Perankingan
    df_ranking = pd.DataFrame({
        'Alternatif': alternatif_names,
        'Skor (Yi)': y_scores
    })
    # Urutkan berdasarkan Skor Yi tertinggi
    df_ranking = df_ranking.sort_values(by='Skor (Yi)', ascending=False).reset_index(drop=True)
    df_ranking.index = df_ranking.index + 1
    df_ranking.index.name = 'Peringkat'
    
    st.dataframe(df_ranking, use_container_width=True)
    
    # 3. Visualisasi
    st.subheader("3. Grafik Peringkat Alternatif")
    fig = px.bar(df_ranking, x='Alternatif', y='Skor (Yi)', title='Skor MOORA Alternatif',
                 color='Skor (Yi)', color_continuous_scale='Viridis')
    st.plotly_chart(fig, use_container_width=True)
    
    # 4. Unduh Laporan
    st.subheader("4. Unduh Laporan CSV")
    csv = df_ranking.to_csv().encode('utf-8')
    st.download_button(
        label="Download Hasil Peringkat",
        data=csv,
        file_name='hasil_spk_ahp_moora.csv',
        mime='text/csv',
    )


# --- MAIN APP ROUTING ---
if st.session_state['user'] is None:
    login()
else:
    role = st.session_state['user']['role']
    st.sidebar.title(f"Aplikasi SPK")
    st.sidebar.write(f"User: **{st.session_state['user']['username']}** ({role})")
    
    if st.sidebar.button("Logout"):
        logout()
    
    # Menu berdasarkan role
    if role == 'admin':
        menu = st.sidebar.radio("Navigasi", ["Matriks Keputusan"])
        if menu == "Matriks Keputusan":
            render_decision_matrix_page()
            
    elif role == 'dm':
        menu = st.sidebar.radio("Navigasi", ["Kuesioner AHP", "Matriks Keputusan"])
        if menu == "Kuesioner AHP":
            render_ahp_page()
        elif menu == "Matriks Keputusan":
            render_decision_matrix_page()
            
    elif role == 'pimpinan':
        menu = st.sidebar.radio("Navigasi", ["Dashboard Pimpinan"])
        if menu == "Dashboard Pimpinan":
            render_dashboard_page()
