import numpy as np
import pandas as pd

def ahp_geometric_mean(matrices):
    """
    Menghitung geometric mean dari list of matrices (DM 1-4).
    matrices: list of 2D numpy arrays (nxn).
    """
    if not matrices:
        return None
    k = len(matrices)
    stacked = np.stack(matrices)
    # Geometric mean: product of elements ^ (1/k)
    geom_mean = np.power(np.prod(stacked, axis=0), 1/k)
    return geom_mean

def ahp_weights_and_cr(matrix, ri=1.54):
    """
    Menghitung bobot kriteria (Eigenvector) dan Consistency Ratio (CR).
    matrix: 2D numpy array (nxn).
    ri: Random Index (untuk n=12 adalah 1.54).
    """
    n = matrix.shape[0]
    
    # 1. Normalisasi matriks (bagi tiap elemen dengan jumlah kolom)
    col_sums = np.sum(matrix, axis=0)
    # Hindari pembagian dengan nol
    col_sums[col_sums == 0] = 1
    norm_matrix = matrix / col_sums
    
    # 2. Hitung bobot (Eigenvector) - rata-rata tiap baris
    weights = np.mean(norm_matrix, axis=1)
    
    # 3. Hitung Maximum Eigenvalue (Lambda Max)
    aw = np.dot(matrix, weights)
    lambda_max = np.mean(aw / weights)
    
    # 4. Hitung CI dan CR
    ci = (lambda_max - n) / (n - 1) if n > 1 else 0
    cr = ci / ri if ri > 0 else 0
    
    return weights, cr

def moora_calculate(decision_matrix, weights, criteria_types):
    """
    Menghitung skor MOORA untuk penentuan peringkat.
    decision_matrix: pandas DataFrame atau 2D array (m alternatif x n kriteria).
    weights: list/array dari bobot kriteria (dari AHP).
    criteria_types: list 'benefit' atau 'cost'.
    """
    X = np.array(decision_matrix).astype(float)
    
    # 1. Normalisasi
    denominators = np.sqrt(np.sum(X**2, axis=0))
    denominators[denominators == 0] = 1 
    norm_X = X / denominators
    
    # 2. Optimasi Bobot
    weighted_X = norm_X * weights
    
    # 3. Hitung Nilai Yi (Benefit - Cost)
    y_scores = np.zeros(X.shape[0])
    for j in range(len(criteria_types)):
        if criteria_types[j].lower() == 'benefit':
            y_scores += weighted_X[:, j]
        else:
            y_scores -= weighted_X[:, j]
            
    return y_scores
