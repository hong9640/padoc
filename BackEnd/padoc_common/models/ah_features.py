# app/models/ah_features.py

from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .voice_records import VoiceRecord

# =================================================================
# 2. A-Features (음향 특성 - 자식 테이블)
# =================================================================

class AhFeaturesBase(SQLModel):
    """AhFeaturess의 공통 필드"""
    jitter_local: Optional[float] = None
    jitter_rap: Optional[float] = None
    jitter_ppq5: Optional[float] = None
    jitter_ddp: Optional[float] = None
    shimmer_local: Optional[float] = None
    shimmer_apq3: Optional[float] = None
    shimmer_apq5: Optional[float] = None
    shimmer_apq11: Optional[float] = None
    shimmer_dda: Optional[float] = None
    hnr: Optional[float] = None
    nhr: Optional[float] = None
    f0: Optional[float] = None
    max_f0: Optional[float] = None
    min_f0: Optional[float] = None

class AhFeatures(AhFeaturesBase, table=True):

    record_id: int = Field(default=None, foreign_key="voicerecord.id", primary_key=True)
    record: "VoiceRecord" = Relationship(back_populates="ah_features")

class AhFeaturesCreate(AhFeaturesBase):
    """내부적으로 AhFeaturess를 생성할 때 사용하는 스키마"""
    pass

class AhFeaturesRead(AhFeaturesBase):
    """API 응답으로 AhFeaturess 정보를 보낼 때 사용하는 스키마"""
    record_id: int

class AhFeaturesUpdate(SQLModel):
    """AhFeaturess를 업데이트할 때 사용하는 스키마"""
    jitter_local: Optional[float] = None
    jitter_rap: Optional[float] = None
    jitter_ppq5: Optional[float] = None
    jitter_ddp: Optional[float] = None
    shimmer_local: Optional[float] = None
    shimmer_apq3: Optional[float] = None
    shimmer_apq5: Optional[float] = None
    shimmer_apq11: Optional[float] = None
    shimmer_dda: Optional[float] = None
    hnr: Optional[float] = None
    nhr: Optional[float] = None
    f0: Optional[float] = None
    max_f0: Optional[float] = None
    min_f0: Optional[float] = None
