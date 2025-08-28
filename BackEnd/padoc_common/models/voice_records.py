# app/models/voice_records.py

from typing import Optional, TYPE_CHECKING, List
from datetime import datetime, timezone
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy.orm import Mapped
from sqlalchemy import Column, Integer, ForeignKey
from .enums import RecordingTypeEnum, FileStatusEnum

# --- 순환 참조 방지를 위한 타입 체킹 ---
if TYPE_CHECKING:
    from .patients import Patient
    from .ah_features import AhFeatures, AhFeaturesRead
    from .sentence_features import SentenceFeatures, SentenceFeaturesRead


# =================================================================
# 1. Voice Record (음성 녹음 원본 정보 - 부모 테이블)
# =================================================================

class VoiceRecordBase(SQLModel):
    """VoiceRecord의 공통 필드"""
    # ondelete="CASCADE" 적용: patient가 삭제되면 voice_record도 함께 삭제됩니다.
    patient_id: int = Field(
        sa_column=Column(Integer, ForeignKey("patient.account_id", ondelete="CASCADE"), nullable=False, index=True)
    )
    
    # ondelete="SET NULL" 적용: 참조하던 record가 삭제되면 이 필드는 NULL로 설정됩니다.
    related_voice_record_id: Optional[int] = Field(
        default=None, sa_column=Column(Integer, ForeignKey("voicerecord.id", ondelete="SET NULL"))
    )
    
    file_path: str = Field(max_length=255)
    type: "RecordingTypeEnum" = Field(default=RecordingTypeEnum.none_)
    status: "FileStatusEnum" = Field(default=FileStatusEnum.PENDING_UPLOAD)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VoiceRecord(VoiceRecordBase, table=True):

    id: Optional[int] = Field(default=None, primary_key=True)
    patient: Mapped["Patient"] = Relationship(back_populates="voice_records")
    ah_features: Mapped[Optional["AhFeatures"]] = Relationship(
        back_populates="record", sa_relationship_kwargs={"cascade": "all, delete-orphan", "uselist": False}
    )
    sentence_features: Mapped[Optional["SentenceFeatures"]] = Relationship(
        back_populates="record", sa_relationship_kwargs={"cascade": "all, delete-orphan", "uselist": False}
    )

    # --- 자기 참조 관계 정의 ---
    # 이 기록과 관련된 다른 기록들 (하나의 문장을 여러 번 녹음한 경우)
    # 한 기록은 여러 관련 기록을 가질 수 있으므로 List 형태가 됩니다.
    related_records: Mapped[List["VoiceRecord"]] = Relationship(
        back_populates="parent_record",
        sa_relationship_kwargs=dict(
            remote_side="VoiceRecord.id",
            foreign_keys="VoiceRecord.related_voice_record_id",
        ),
    )
    # 이 기록이 참조하는 부모 기록
    parent_record: Mapped[Optional["VoiceRecord"]] = Relationship(
        back_populates="related_records",
        sa_relationship_kwargs=dict(
            remote_side="VoiceRecord.related_voice_record_id",
            foreign_keys="VoiceRecord.related_voice_record_id",
        ),
    )


class VoiceRecordCreate(SQLModel):
    """VoiceRecord 생성용 스키마"""
    patient_id: int
    file_path: str
    type: "RecordingTypeEnum"
    status: "FileStatusEnum" = Field(default=FileStatusEnum.PENDING_UPLOAD)
    related_voice_record_id: Optional[int] = None

class VoiceRecordRead(VoiceRecordBase):
    """VoiceRecord 기본 정보 응답용 스키마"""
    id: int

class VoiceRecordUpdate(SQLModel):
    """VoiceRecord 업데이트용 스키마"""
    type: Optional["RecordingTypeEnum"] = None

