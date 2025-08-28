"""
WAV 파일 음성을 AI 모델로 분류하는 커맨드 라인 스크립트.

이 스크립트는 `librosa`와 `tensorflow`를 사용하여 주어진 WAV 파일을 전처리하고,
미리 학습된 Keras 모델(`.h5`)을 로드하여 예측을 수행합니다.
오디오의 특정 구간에서 추출한 멜 스펙트로그램(Mel Spectrogram)을 이미지로 변환하여
CNN(Convolutional Neural Network) 모델의 입력으로 사용합니다.

실행 방법:
    - python voice_predict.py <wav_file_path>

입력:
    - 커맨드 라인 인자로 분석할 WAV 파일의 경로 1개.

출력:
    - 예측 결과(클래스 0 또는 1)를 표준 출력(stdout)으로 한 줄 출력합니다.
    - 모든 오류 메시지는 표준 에러(stderr)로 출력됩니다.
"""
import sys
import io
import librosa
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

from PIL import Image
from pathlib import Path

# 모델 경로
MODEL_PATH = Path.home() / "padoc" / "ai" / "savemodel_101_all_Dense_32.h5"

def preprocess_wav_for_prediction(wav_path):
    try:
        sr = 48000
        signal, sr = librosa.load(wav_path, sr=sr)

        required_length = int(sr * 1.5)
        if len(signal) < required_length:
            signal = np.pad(signal, (0, required_length - len(signal)), 'constant')

        segment = signal[int(sr):int(sr * 2)]

        melspec = librosa.feature.melspectrogram(y=segment, sr=sr, n_mels=256)
        melspec_db = librosa.power_to_db(melspec, ref=np.max)

        fig, ax = plt.subplots()
        ax.axes.get_xaxis().set_visible(False)
        ax.axes.get_yaxis().set_visible(False)
        plt.axis('off')
        plt.margins(0)

        plt.imshow(melspec_db, aspect='auto', origin='lower') # 대체 표시
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
        plt.close(fig)
        buf.seek(0)

        img = Image.open(buf).convert('RGB')
        img = img.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(img) / 255.0

        return np.expand_dims(img_array, axis=0)  # (1, 224, 224, 3)

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return None

def main():
    if len(sys.argv) != 2:
        print("Usage: python voice_predict.py [wav_file_path]", file=sys.stderr)
        sys.exit(1)
    wav_path = sys.argv[1]

    try:
        model = tf.keras.models.load_model(str(MODEL_PATH))
    except Exception as e:
        print(f"ERROR: 모델 로딩 실패: {e}", file=sys.stderr)
        sys.exit(2)

    x = preprocess_wav_for_prediction(wav_path)
    if x is None:
        print(f"ERROR: 입력 파일 전처리 실패", file=sys.stderr)
        sys.exit(3)

    # 예측
    pred = model.predict(x)
    prob = float(pred[0][0])   # 예: sigmoid 이진분류 기준
    result = int(prob > 0.5)   # 0: HC, 1: PD

    # 결과 출력: Qt에서 stdout으로 읽을 수 있음
    print(result)

if __name__ == "__main__":
    main()
