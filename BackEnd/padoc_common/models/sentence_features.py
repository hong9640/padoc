# app/models/sentence_features.py

from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, JSON

if TYPE_CHECKING:
    from .voice_records import VoiceRecord

# =================================================================
# 3. Sentence Features (문장 특성 - 자식 테이블)
# =================================================================

class SentenceFeaturesBase(SQLModel):
    """SentenceFeaturess의 공통 필드"""
    cpp: Optional[float] = None
    csid: Optional[float] = None
    sampling_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class SentenceFeatures(SentenceFeaturesBase, table=True):
    record_id: int = Field(foreign_key="voicerecord.id", unique=True, primary_key=True)
    record: "VoiceRecord" = Relationship(back_populates="sentence_features")

class SentenceFeaturesCreate(SentenceFeaturesBase):
    """내부적으로 SentenceFeaturess를 생성할 때 사용하는 스키마"""
    pass

class SentenceFeaturesRead(SentenceFeaturesBase):
    """API 응답으로 SentenceFeaturess 정보를 보낼 때 사용하는 스키마"""
    record_id: int

class SentenceFeaturesUpdate(SQLModel):
    """SentenceFeaturess를 업데이트할 때 사용하는 스키마"""
    cpp: Optional[float] = None
    csid: Optional[float] = None
    sampling_data: Optional[Dict[str, Any]] = None
