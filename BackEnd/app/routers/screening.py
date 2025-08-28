import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
import httpx

from padoc_common.models.enums import RecordingTypeEnum
from padoc_common.schemas.screening import ScreeningResponse
from padoc_common.schemas.base import ErrorResponse
from padoc_common.exceptions import BackEndInternalError

MODEL_SERV_URL = os.getenv("MODEL_SERV_URL")

router = APIRouter(
    prefix="/screening",
    tags=["screening"]
)

@router.post(
    "",
    response_model=ScreeningResponse,
    responses={
        400: {"model": ErrorResponse, "description": "잘못된 요청(ex: 잘못된 파일 형식, 빈 파일 등)"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류"},
    },
)
async def analyze_voice(
    voice_file: UploadFile = File(..., description="분석할 음성 wav 파일"),
    recording_type: RecordingTypeEnum = Form(..., description="'a' 또는 문장 녹음 유형"),
):
    """
    IoT 기기에서 음성 파일을 받아 AI 모델로 분석하고, 그 결과를 즉시 반환합니다.
    이 엔드포인트는 인증이 필요 없으며, 결과를 데이터베이스에 저장하지 않습니다.
    """
    # httpx에 파일의 내용을 읽는 대신, 파일 스트림 객체 자체를 전달합니다.
    # FastAPI의 UploadFile 객체는 .file 속성을 통해 내부 파일 스트림에 접근할 수 있습니다.
    files = {'voice_file': (voice_file.filename, voice_file.file, voice_file.content_type)}

    # 5. httpx를 사용하여 모델 서버에 비동기 POST 요청을 보냅니다.
    async with httpx.AsyncClient() as client:
        try:
            if recording_type == RecordingTypeEnum.voice_ah:
                response = await client.post(MODEL_SERV_URL+"/ah-features", files=files, timeout=30.0)
            elif recording_type == RecordingTypeEnum.voice_sentence:
                response = await client.post(MODEL_SERV_URL+"/parkinson-prediction", files=files, timeout=30.0)
            else:
                raise HTTPException(status_code=400, detail="잘못된 요청입니다.")
            
            # 6. 모델 서버의 응답을 확인하고 처리합니다.
            if response.status_code == 200:
                # 성공 시, 모델 서버가 보낸 json 결과를 그대로 클라이언트에게 반환합니다.
                return response.json()
            else:
                # 모델 서버에서 에러가 발생한 경우, 그 내용을 담아 클라이언트에게 에러를 전달합니다.
                # 예를 들어, 모델 서버가 4xx 에러를 반환하면 우리 API 서버도 400 에러를 반환합니다.
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("detail") or "Model server returned an error"
                )

        except httpx.RequestError as exc:
            # 모델 서버에 연결할 수 없는 등 네트워크 오류 발생 시 500 에러를 반환합니다.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error connecting to the model server: {exc}"
            )
