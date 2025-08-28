from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict
from padoc_common.models.enums import RecordingTypeEnum, AdvTrainingProgressEnum
from padoc_common.schemas.features import AhFeatures, SentenceFeatures


class VoiceInformation(BaseModel):
    """음성 분석 정보 통합 스키마"""
    voice_id: int
    patient_id: int
    related_voice_info_id: Optional[int]
    file_path: str
    recording_type: RecordingTypeEnum
    ah_features: Optional[AhFeatures] = None
    sentence_features: Optional[SentenceFeatures] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class VoiceInformationList(BaseModel):
    voices: List[VoiceInformation]
    model_config = ConfigDict(from_attributes=True)


class ScreeningRequest(BaseModel):
    file: bytes


class BasicTrainingRequest(BaseModel):
    file: bytes


class AdvTrainingInformation(BaseModel):
    """심화 훈련 결과 정보"""
    avg_score: int
    progress: AdvTrainingProgressEnum
    date: datetime

    model_config = ConfigDict(from_attributes=True)


class AdvTrainingInformationList(BaseModel):
    trainings: List[AdvTrainingInformation]
