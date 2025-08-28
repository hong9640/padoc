import io
import json
import asyncio
import pathlib
import numpy as np
import parselmouth
import soundfile as sf

# ============================
# 1. 상수 정의
# ============================
PITCH_FLOOR = 75.0
PITCH_CEILING = 500.0
JITTER_SHIMMER_COMMON_ARGS = (0, 0, 0.0001, 0.02, 1.3)
SHIMMER_EXTRA_ARGS = (1.6,)


# ============================
# 2. '아' 발성 특징 추출 함수
# ============================
async def extract_ah_features(voice_data: bytes) -> dict:
    """
    음성 데이터(bytes)에서 '아' 발성 음향 특성을 추출하여 딕셔너리로 반환합니다.

    Args:
        voice_data (bytes): 분석할 음성 파일의 바이트 데이터입니다.

    Returns:
        dict: 추출된 음향 특성들이 담긴 딕셔너리입니다.

    Raises:
        ValueError: 음성 파일을 처리하는 중 오류가 발생할 경우 발생합니다.
    """
    try:
        # 1. 음성 데이터 로드 및 parselmouth 객체 생성
        samples, sampling_frequency = sf.read(io.BytesIO(voice_data))

        # 스테레오(2D 배열)인 경우, 채널을 평균내어 모노(1D 배열)로 변환
        if samples.ndim == 2:
            samples = samples.mean(axis=1)

        # parselmouth.Sound 객체 생성
        snd = parselmouth.Sound(samples, sampling_frequency=sampling_frequency)
        
        # 음높이(Pitch)와 관련 객체 생성
        point_process = parselmouth.praat.call(snd, "To PointProcess (periodic, cc)", PITCH_FLOOR, PITCH_CEILING)
        pitch = snd.to_pitch(pitch_floor=PITCH_FLOOR, pitch_ceiling=PITCH_CEILING)
        harmonicity = snd.to_harmonicity(minimum_pitch=PITCH_FLOOR)

        # 2. 특성 추출
        jitter_types = ["local", "rap", "ppq5", "ddp"]
        jitter_features = {
            f"jitter_{j_type}": parselmouth.praat.call(point_process, f"Get jitter ({j_type})", *JITTER_SHIMMER_COMMON_ARGS)
            for j_type in jitter_types
        }

        shimmer_types = ["local", "apq3", "apq5", "apq11", "dda"]
        shimmer_features = {
            f"shimmer_{s_type}": parselmouth.praat.call(
                (snd, point_process), f"Get shimmer ({s_type})", *JITTER_SHIMMER_COMMON_ARGS, *SHIMMER_EXTRA_ARGS
            )
            for s_type in shimmer_types
        }

        hnr = parselmouth.praat.call(harmonicity, "Get mean", 0, 0)
        nhr = 10 ** (-hnr / 10) if hnr > 0 else 0.0

        f0 = parselmouth.praat.call(pitch, "Get mean", 0, 0, "Hertz")
        max_f0 = parselmouth.praat.call(pitch, "Get maximum", 0, 0, "Hertz", "Parabolic")
        min_f0 = parselmouth.praat.call(pitch, "Get minimum", 0, 0, "Hertz", "Parabolic")

        other_features = {
            "hnr": hnr,
            "nhr": nhr,
            "f0": f0,
            "max_f0": max_f0,
            "min_f0": min_f0,
        }

        # 3. 추출된 특성들을 딕셔너리 구조에 맞게 재구성하여 반환
        jitter_data = {key.replace('jitter_', ''): value for key, value in jitter_features.items()}
        shimmer_data = {key.replace('shimmer_', ''): value for key, value in shimmer_features.items()}

        # 최종 딕셔너리를 생성하여 반환
        final_features = {
            "jitter": jitter_data,
            "shimmer": shimmer_data,
            **other_features
        }
        return final_features

    except Exception as e:
        # 간단한 예외로 처리하여 외부 의존성을 없앱니다.
        raise ValueError(f"특징 추출 중 오디오 데이터 처리 오류: {e}")

