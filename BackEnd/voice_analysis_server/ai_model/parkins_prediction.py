import io
import os
import librosa
import numpy as np
import tensorflow as tf

# Pydantic 모델 및 사용자 정의 예외 import
import padoc_common.exceptions as exceptions
from padoc_common.schemas.features import ParkinsonPredictionResult
import matplotlib.pyplot as plt
from PIL import Image


# --- 상수 정의 (기존과 동일) ---
TARGET_SR = 48000
SEGMENT_DURATION_S = 1.0
REQUIRED_DURATION_S = 2.0
N_MELS = 256
IMAGE_SIZE = (224, 224)
MODEL_PATH = os.getenv("MODEL_PATH")


class ParkinsPredictionModel:
    """
    파킨슨병 예측 모델을 로드하고 예측을 수행하는 싱글턴 클래스 (성능 개선 버전).
    """
    _instance = None
    model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            try:
                print(f"파킨슨병 예측 모델을 로드합니다: {MODEL_PATH}")
                cls.model = tf.keras.models.load_model(MODEL_PATH)
                print("모델 로딩에 성공했습니다.")
                """
                모델 워밍업을 위해 (1, 224, 224, 3) 형태의
                더미 데이터를 생성하여 미리 예측을 수행합니다.
                """
                # 1개의 배치, 224x224 크기, 3개 채널(RGB)을 가진 더미 텐서 생성
                dummy_input = tf.zeros((1, 224, 224, 3), dtype=tf.float32)
                
                # 더미 데이터로 예측을 수행하여 모델을 '워밍업'합니다.
                cls.model.predict(dummy_input)
            except (IOError, ImportError) as e:
                raise exceptions.BackEndInternalError(f"예측 모델({MODEL_PATH})을 불러오는 데 실패했습니다.") from e
        return cls._instance

    def _preprocess_wav_for_prediction(self, voice_data: io.BytesIO) -> np.ndarray:
        """
        하나의 WAV 파일을 불러와 모델 예측에 사용할 수 있는 형태로 전처리합니다.
        (멜 스펙트로그램 이미지 변환 -> 리사이징 -> 정규화)
        """
        try:
            # 1. 음성 파일 로드 (샘플링 레이트 48000Hz로 고정)
            signal, sr = librosa.load(voice_data, sr=TARGET_SR)

            # 2. 음성 신호에서 1초 구간 추출 (1.5초 ~ 2.5초)
            
            # 최소 2.5초(120000 샘플) 길이인지 확인
            required_length = int(sr * 1.5)
            if len(signal) < required_length:
                print(f"INFO: 음성 파일 '{voice_data}'의 길이가 2.5초 미만이라 패딩을 추가합니다.")
                # 길이가 짧으면 0으로 채워 2.5초를 만듭니다 (Zero Padding)
                signal = np.pad(signal, (0, required_length - len(signal)), 'constant')
                
            # 1.5초(72000)부터 2.5초(120000)까지의 1초 구간 추출
            segment = signal[int(sr) : int(sr * 2)]
            # segment = signal[int(len(signal) / 2) - original_sr // 2: int(len(signal) / 2) + original_sr // 2]

            # 3. 멜 스펙트로그램 생성
            melspec = librosa.feature.melspectrogram(y=segment, sr=sr, n_mels=N_MELS)
            
            # 4. 스펙트로그램을 데시벨(dB) 단위로 변환
            melspec_db = librosa.power_to_db(melspec, ref=np.max)

            # 5. 스펙트로그램을 이미지로 변환 (메모리 내에서 처리)
            fig, ax = plt.subplots()
            ax.axes.get_xaxis().set_visible(False)
            ax.axes.get_yaxis().set_visible(False)
            librosa.display.specshow(melspec_db, sr=sr, x_axis='time', y_axis='mel', ax=ax)
            plt.axis('off')
            plt.margins(0)
            
            # 이미지를 파일로 저장하지 않고 메모리 버퍼에 저장
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
            # plt.show()
            plt.close(fig)
            buf.seek(0)

            # 6. 이미지 로드, RGB 변환 및 리사이징 (224x224)
            img = Image.open(buf).convert('RGB')
            img = img.resize(IMAGE_SIZE)
            
            # 7. 이미지를 NumPy 배열로 변환 및 정규화
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            img_array = img_array / 255.0

            # 8. 모델 입력에 맞게 차원 추가 (batch 차원)
            # img_array = np.expand_dims(img_array, axis=0) # (1, 224, 224, 3) 형태로 변환

            return img_array

        except Exception as e:
            print(f"파일 처리 중 오류 발생: {e}")
            return None


    def predict_parkinsons_from_file(self, voice_data: io.BytesIO) -> ParkinsonPredictionResult:
        """
        하나의 WAV 파일 경로를 입력받아 파킨슨병 확률을 예측하고 반환합니다.

        Args:
            voice_data (str): 분석할 음성 파일의 경로

        Returns:
            float: 파킨슨병으로 예측될 확률 (0.0 ~ 1.0 사이의 값)
            None: 파일 처리 중 오류 발생 시
        """
        # 1. 음성 파일을 전처리하여 모델 입력 형태로 변환
        processed_image = self._preprocess_wav_for_prediction(voice_data)

        if processed_image is None:
            print(f"오류: '{voice_data}' 파일 전처리에 실패했습니다.")
            return None

        # 2. 모델 예측을 위해 배치(batch) 차원 추가
        #    모델은 (개수, 높이, 너비, 채널) 형태의 입력을 기대하므로
        #    (224, 224, 3) -> (1, 224, 224, 3) 형태로 변환해야 합니다.
        input_tensor = np.expand_dims(processed_image, axis=0)

        # 3. 모델 예측 수행
        probability = self.model.predict(input_tensor)

        # 4. 결과 반환 (결과는 [[확률]] 형태로 나오므로 값만 추출)
        return int(probability[0][0] * 100)