# analyze_voice.py
"""음성 분석 스크립트.

이 스크립트는 Parselmouth (Praat 래퍼)와 Numpy/Scipy를 사용하여
오디오 파일로부터 다양한 음향 음성학적 지표를 추출합니다.

주요 기능:
- Jitter, Shimmer, HNR, NHR, F0 등 표준 음성 지표 계산.
- CPPS  근사 계산.
- L/H Ratio  계산.
- CSID  추정.

실행 방법:
- 단일 파일 분석: python analyze_voice.py <file_path>
- 다중 파일 분석: python analyze_voice.py <file1_path> <file2_path> ...
  (다중 파일의 경우, 각 지표의 평균값을 계산하여 반환)

출력:
- 모든 분석 결과는 표준 출력(stdout)을 통해 단일 JSON 객체로 반환됩니다.
"""
import sys
import json
import math
import parselmouth
import numpy as np

from parselmouth.praat import call
from scipy.signal import get_window

# ========= 파라미터 =========
PITCH_FLOOR = 75
PITCH_CEIL = 600
LH_SPLIT_HZ = 4000.0

def _extract_mono(snd: parselmouth.Sound) -> parselmouth.Sound:
    if snd.n_channels == 2:
        return call(snd, "Extract one channel...", 1)
    return snd

# CPP 계산 함수
def compute_cpp_numpy(file_path: str,
                      fmin=60.0, fmax=330.0,
                      fs_target=16000,
                      frame_len=0.01,   # 10 ms
                      hop_len=0.005,    # 5 ms
                      trend_method="linear",  # "linear" or "exp"
                      eps=1e-12) -> float:
    """
    순수 Python/Numpy로 CPPS(평균) 근사 계산.
    - Praat의 PowerCepstrogram/CPPS와 수치가 완벽히 동일하진 않을 수 있지만,
      분류/회귀용 피처로는 충분히 일관된 경향을 보입니다.
    """

    snd = parselmouth.Sound(file_path)
    if snd.n_channels == 2:
        snd = snd.extract_left_channel()

    # 리샘플(권장)
    if snd.sampling_frequency != fs_target:
        # snd = parselmouth.Sound(values=snd.values, sampling_frequency=snd.sampling_frequency)
        snd = parselmouth.praat.call(snd, "Resample...", fs_target, 50)
    sr = int(snd.sampling_frequency)
    x = snd.values[0].astype(np.float64)

    # 프레이밍
    N = len(x)
    n_frame = int(round(frame_len * sr))
    n_hop   = int(round(hop_len * sr))
    win = get_window("hamming", n_frame, fftbins=True)

    # quefrency(초) 범위
    qmin = 1.0 / fmax
    qmax = 1.0 / fmin

    cpp_list = []
    i = 0
    while i + n_frame <= N:
        seg = x[i:i+n_frame] * win
        i += n_hop

        # 켑스트럼 (log-magnitude cepstrum)
        spec = np.fft.rfft(seg)
        mag  = np.abs(spec) + eps
        log_mag = np.log(mag)
        cep = np.fft.irfft(log_mag)  # quefrency-domain

        # quefrency 샘플 인덱스 범위
        q = np.arange(len(cep)) / sr
        mask = (q >= qmin) & (q <= qmax)
        if not np.any(mask):
            continue

        # 추세선(cepstral trend): 선형 회귀 (또는 exp)
        y = cep[mask]
        xq = q[mask]
        if trend_method == "exp":
            # 지수 추세 근사: log(y+const) 선형화 등 다양한 변형이 가능하나,
            # 간단히 선형과 성능 차이가 크지 않아 linear를 기본으로 사용.
            coef = np.polyfit(xq, y, 1)
        else:
            coef = np.polyfit(xq, y, 1)  # linear
        trend = np.polyval(coef, xq)

        # 피크 찾기 (기본주기 부근 최대치)
        peak_val = np.max(y)
        peak_idx = np.argmax(y)
        trend_at_peak = trend[peak_idx]

        # CPP = (peak - trend_at_peak) [dB]
        cpp = (peak_val - trend_at_peak) * 20 / np.log(10)  # ln→dB 변환
        cpp_list.append(cpp)

    if len(cpp_list) == 0:
        return float("nan")

    # 시간평균 (smoothed)
    return float(np.mean(cpp_list))

def estimate_csid_awan2016(cpp: float, lh_series_db: np.ndarray) -> float:
    """Awan et al., 2016 (J Voice) 회귀식 기반 CSID 계산"""
    if lh_series_db.size == 0 or not np.isfinite(cpp):
        return float("nan")
    lh_mean = float(np.mean(lh_series_db))
    lh_sd = float(np.std(lh_series_db, ddof=1)) if lh_series_db.size > 1 else 0.0
    csid = 154.59 - (10.39 * cpp) - (1.08 * lh_mean) - (3.71 * lh_sd)
    return float(csid)

def compute_lh_ratio_series(file_path):
    """프레임별 L/H ratio(dB). 프레임 스펙트럼을 numpy FFT로 계산."""
    snd = parselmouth.Sound(file_path)
    sr = snd.sampling_frequency
    signal = snd.values[0]
    lh_db_list = []

    frame_len = 0.05
    hop_len = 0.025
    frame_n = int(round(frame_len * sr))
    hop_n   = int(round(hop_len * sr))

    if frame_n <= 0 or hop_n <= 0:
        return np.array([])

    for start in range(0, len(signal) - frame_n + 1, hop_n):
        frame = signal[start:start+frame_n]
        win = np.hamming(len(frame))
        x = frame * win
        spec = np.fft.rfft(x)
        mag2 = np.abs(spec) ** 2
        freqs = np.fft.rfftfreq(len(x), d=1.0/sr)
        low_mask = freqs <= LH_SPLIT_HZ
        high_mask = freqs > LH_SPLIT_HZ
        low_e = float(np.sum(mag2[low_mask])) + 1e-12
        high_e = float(np.sum(mag2[high_mask])) + 1e-12
        lh_db = 10.0 * np.log10(low_e / high_e)
        lh_db_list.append(lh_db)

    return np.array(lh_db_list, dtype=float)

def analyze(filepath):
    try:
        # 음성파일 불러오기
        sound = parselmouth.Sound(filepath)

        # 기본 세팅값 설정
        f0min, f0max = 75, 500
        unit = "Hertz"
        pointProcess = call(sound, "To PointProcess (periodic, cc)", f0min, f0max)

        # Jitter, Shimmer 추출
        localJitter = call(pointProcess, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
        localShimmer = call([sound, pointProcess], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)

        # hnr & nhr 추출
        harmonicity = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
        hnr = call(harmonicity, "Get mean", 0, 0)
        nhr = 10 ** (-hnr / 10)

        # 주파수 추출 
        pitch = call(sound, "To Pitch", 0.0, f0min, f0max)
        meanF0 = call(pitch, "Get mean", 0, 0, unit)
        maxF0 = call(pitch, "Get maximum", 0, 0, unit, "Parabolic")
        minF0 = call(pitch, "Get minimum", 0, 0, unit, "Parabolic")

        # CPP, CSID 추출
        cpps = compute_cpp_numpy(file_path=filepath, fmin=f0min, fmax=f0max)
        snd_tmp = _extract_mono(sound)
        lh_series = compute_lh_ratio_series(snd_tmp)
        csid = estimate_csid_awan2016(cpps, lh_series)

        # rangeST
        rangeST = 12 * math.log2(maxF0 / minF0) if minF0 > 0 else float(0)

        result = {
            "localJitter": float(localJitter),
            "localShimmer": float(localShimmer),
            "hnr": float(hnr),
            "nhr": float(nhr),
            "meanF0": float(meanF0),
            "maxF0": float(maxF0),
            "minF0": float(minF0),
            "cpp": float(cpps),
            "csid": float(csid),
            "rangeST": float(rangeST),
        }

        # 기존 print 대신 dict 반환 (나머지 변수/주석 유지)
        return result
    except Exception as e:
        return {"error": str(e)}

# analyze("C:/Users/SSAFY/Downloads/Muhammad_Ali_PD_3.wav")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path given."}))
        sys.exit(1)

    paths = sys.argv[1:]

    # 파일 1개면 예전과 동일하게 단일 결과 출력
    if len(paths) == 1:
        res = analyze(paths[0])
        print(json.dumps(res))
        if "error" in res:
            sys.exit(1)
        sys.exit(0)

    # 여러 개면 지표별 평균
    keys = ["meanF0", "maxF0", "minF0", "localJitter", "localShimmer", "hnr", "nhr", "cpp", "csid"]
    sums = {k: 0.0 for k in keys}
    counts = {k: 0 for k in keys}

    any_success = False
    for p in paths:
        r = analyze(p)
        if "error" in r:
            continue
        any_success = True
        for k in keys:
            v = float(r.get(k, float("nan")))
            if np.isfinite(v):
                sums[k] += v
                counts[k] += 1

    if not any_success:
        print(json.dumps({"error": "All analyses failed."}))
        sys.exit(1)

    avg = {}
    for k in keys:
        c = counts[k]
        avg[k] = (sums[k] / c) if c > 0 else 0.0

    avg["rangeST"] = 12 * math.log2(avg["maxF0"] / avg["minF0"]) if avg["minF0"] > 0 else float(0)

    # 최종 결과를 기존 result 형태로 단일 객체 출력
    print(json.dumps(avg))
