from pydantic import BaseModel, Field
from padoc_common.models import enums
from typing import Optional, Union

# screening 스키마의 응답 모델을 가져와 재사용합니다.
from padoc_common.schemas.features import AhFeatures
from padoc_common.schemas.screening import SentenceScreeningResult


# 훈련 음성 파일 제출 요청 시 받는 데이터
class BasicTrainingUploadRequest(BaseModel):
    file_name: str = Field(..., example="training_voice_20250804.wav")
    type: enums.RecordingTypeEnum = Field(..., example="voice_ah")
    related_voice_record_id: Optional[int] = Field(None, example=1)


# 백엔드가 클라이언트에 응답할 데이터 (업로드 URL)
class TrainingBasicUploadResponse(BaseModel):
    record_id: int
    upload_url: str

# 심화 훈련 요청
class AdvTrainingInfromation(BaseModel):
    avg_score: int
    progress: enums.AdvTrainingProgressEnum = Field(..., example="level 3")

# 심화 훈련 결과 응답
class AdvancedTrainingResultResponse(BaseModel):
    message: str = "심화 훈련 결과가 성공적으로 처리되었습니다."
    record_id: int
    # 수정된 부분: screening 스키마의 응답 모델을 사용합니다.
    result: Optional[Union[AhFeatures, SentenceScreeningResult]]

class UploadStatusResponse(BaseModel):
    message: str = "업로드 요청이 처리되었습니다."
    status: enums.FileStatusEnum = Field(..., example="PENDING_UPLOAD")

class UploadStatusRequest(BaseModel):
    record_id: int = Field(..., alias='id', example=1)

# S3에서 받아올 데이터 (다운로드 URL)
class TrainingBasicDownloadResponse(BaseModel):
    download_url: str
