# voice_analysis_server/main.py
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import io
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException

from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

# Pydantic 스키마 및 사용자 정의 예외 import
from padoc_common.schemas.base import ErrorResponse
from padoc_common.schemas.features import AhFeatures, SentenceFeatures, ParkinsonPredictionResult
import padoc_common.exceptions as exceptions

# 분석 모듈 import
from voice_analysis_server.ai_model.parkins_prediction import ParkinsPredictionModel
from voice_analysis_server.voice_feature.praat_ah import extract_ah_features
from voice_analysis_server.voice_feature.praat_sentence import extract_sentence_features



# --- 모델 로딩 및 생명주기 관리 ---
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작 시 모델을 로드하고, 종료 시 정리합니다."""
    print("--- FastAPI app startup: Loading Parkinson's prediction model... ---")
    try:
        ml_models["parkinsons_prediction"] = ParkinsPredictionModel()
        print("--- Model loading successful. ---")
    except exceptions.BackEndInternalError as e:
        print(f"FATAL: Failed to load model - {e}")
        # 모델 로딩 실패는 심각한 문제이므로, 여기서 처리를 중단하거나
        # 상태를 '비정상'으로 설정하는 등의 로직을 추가할 수 있습니다.
        # 지금은 에러 로그만 남깁니다.
    
    yield
    
    print("--- FastAPI app shutdown. ---")
    ml_models.clear()

# --- FastAPI 앱 인스턴스 생성 ---
app = FastAPI(
    lifespan=lifespan,
    title="PaDoc Voice Analysis Server",
    description="음성 특징 추출 및 파킨슨병 예측을 위한 API 서버",
    version="1.0.0"
)

# --- 미들웨어 설정 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 오리진 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 라우터 정의 ---

@app.get("/", summary="서버 상태 확인")
def read_root():
    """서버가 정상적으로 실행 중인지 확인하는 기본 엔드포인트입니다."""
    return {"message": "PaDoc Voice Analysis Server is running successfully!"}

@app.post(
    "/ah-features",
    response_model=AhFeatures,
    summary="'아' 발성 음향 특징 추출",
    description="'아' 발성(sustained vowel) 음성 파일에서 Jitter, Shimmer, HNR 등의 음향 특성을 추출합니다.",
    responses={
        400: {"model": ErrorResponse, "description": "잘못된 파일 형식 또는 처리할 수 없는 오디오"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류"},
    },
)
async def analyze_ah_voice(
    voice_file: UploadFile = File(..., description="분석할 '아' 발성 .wav 파일"),
):
    """
    '아' 발성 음성 파일(.wav)을 받아 음향 특성을 분석하고 결과를 반환합니다.
    """
    if not voice_file.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="잘못된 파일 형식입니다. .wav 파일을 업로드해주세요.")
    
    try:
        voice_data = await voice_file.read()
        features = await extract_ah_features(voice_data)
        return features
    except exceptions.BackEndInternalError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"오디오 파일을 처리할 수 없습니다: {e}")


@app.post(
    "/sentence-features",
    response_model=SentenceFeatures,
    summary="문장 발성 음향 특징 추출",
    description="문장(running speech) 음성 파일에서 CPPS, CSID 등의 음향 특성을 추출합니다.",
    responses={
        400: {"model": ErrorResponse, "description": "잘못된 파일 형식 또는 처리할 수 없는 오디오"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류"},
    },
)
async def analyze_sentence_voice(
    voice_file: UploadFile = File(..., description="분석할 문장 발성 .wav 파일"),
):
    """
    문장 음성 파일(.wav)을 받아 음향 특성을 분석하고 결과를 반환합니다.
    """
    if not voice_file.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="잘못된 파일 형식입니다. .wav 파일을 업로드해주세요.")
        
    try:
        voice_data = await voice_file.read()
        features = await extract_sentence_features(voice_data)
        return features
    except exceptions.BackEndInternalError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"오디오 파일을 처리할 수 없습니다: {e}")


@app.post(
    "/parkinson-prediction",
    response_model=ParkinsonPredictionResult,
    summary="음성 기반 파킨슨병 예측",
    description="음성 파일의 멜-스펙트로그램을 분석하여 파킨슨병 확률을 예측합니다.",
    responses={
        400: {"model": ErrorResponse, "description": "잘못된 파일 형식 또는 처리할 수 없는 오디오"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류"},
    },
)
async def predict_parkinsons(
    voice_file: UploadFile = File(..., description="파킨슨병 예측에 사용할 .wav 파일"),
):
    """
    음성 파일(.wav)을 받아 파킨슨병 여부를 예측하고, AI 점수(확률)를 반환합니다.
    """
    if "parkinsons_prediction" not in ml_models or ml_models["parkinsons_prediction"] is None:
        raise HTTPException(status_code=503, detail="모델이 현재 사용 불가능합니다. 서버 관리자에게 문의하세요.")

    if not voice_file.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="잘못된 파일 형식입니다. .wav 파일을 업로드해주세요.")

    try:
        # predict_parkinsons_from_file 함수는 io.BytesIO 객체를 기대합니다.
        voice_data_stream = io.BytesIO(await voice_file.read())
        prediction_model = ml_models["parkinsons_prediction"]
        result = prediction_model.predict_parkinsons_from_file(voice_data_stream)
        return ParkinsonPredictionResult(ai_score=result)
    except exceptions.BackEndInternalError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"오디오 파일을 처리할 수 없습니다: {e}")


# --- 서버 실행 ---
if __name__ == "__main__":
    # 환경변수에서 포트 번호를 가져오되, 없으면 8001을 기본값으로 사용
    uvicorn.run("voice_analysis_server.main:app", host="0.0.0.0", port=int(os.getenv("VOICE_ANALYSIS_SERV_PORT")), reload=True)