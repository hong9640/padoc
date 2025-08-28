# app/models/advanced_training_informations.py

from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
import enum

from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped
from .enums import AdvTrainingProgressEnum

if TYPE_CHECKING:
    from .patients import Patient




# 공통 필드를 정의하는 Base 모델
class AdvancedTrainingInformationBase(SQLModel):
    # DBML의 오타(petient_id)를 patient_id로 수정하여 반영
    patient_id: int
    avg_score: Optional[int] = Field(default=None)
    progress: Optional["AdvTrainingProgressEnum"] = Field(default=None)

# 데이터베이스 테이블과 매핑되는 모델
class AdvancedTrainingInformation(AdvancedTrainingInformationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Foreign Key를 명시적으로 설정. unique=True로 1:1 관계를 강제합니다.
    patient_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("patient.account_id", ondelete="CASCADE"),
            nullable=False
        )
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Patient 모델과의 1:1 관계 설정
    patient: Mapped["Patient"] = Relationship(back_populates="advanced_training")

# 데이터 생성을 위한 Create 모델
class AdvancedTrainingInformationCreate(AdvancedTrainingInformationBase):
    pass

# 데이터 조회를 위한 Read 모델
class AdvancedTrainingInformationRead(AdvancedTrainingInformationBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}

# 데이터 수정을 위한 Update 모델
class AdvancedTrainingInformationUpdate(SQLModel):
    avg_score: Optional[int] = None
    progress: Optional["AdvTrainingProgressEnum"] = None