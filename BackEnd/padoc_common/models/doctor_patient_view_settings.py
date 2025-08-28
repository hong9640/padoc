# app/models/doctor_user_view_settings.py


from typing import List, Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import func
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import Mapped # 1. Mapped 타입을 임포트합니다.

if TYPE_CHECKING:
    from .doctors import Doctor

class DoctorPatientViewSettingBase(SQLModel):
    doctor_id: int
    connected_patient_order: List[int] = Field(default_factory=list)
    pending_patient_order: List[int] = Field(default_factory=list)
    unconnected_patient_order: List[int] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DoctorPatientViewSetting(DoctorPatientViewSettingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    doctor_id: int = Field(sa_column=Column(Integer, ForeignKey("doctor.account_id", ondelete="CASCADE"), unique=True, nullable=False))
    connected_patient_order: List[int] = Field(default_factory=list, sa_column=Column(JSON))
    pending_patient_order: List[int] = Field(default_factory=list, sa_column=Column(JSON))
    unconnected_patient_order: List[int] = Field(default_factory=list, sa_column=Column(JSON))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": func.now()})

    doctor: Mapped["Doctor"] = Relationship(back_populates="view_setting")

class DoctorPatientViewSettingCreate(DoctorPatientViewSettingBase):
    pass

class DoctorPatientViewSettingRead(DoctorPatientViewSettingBase):
    id: int
    model_config = {"from_attributes": True}

class DoctorPatientViewSettingUpdate(SQLModel):
    connected_patient_order: Optional[List[int]] = Field(default=None)
    pending_patient_order: Optional[List[int]] = Field(default=None)
    unconnected_patient_order: Optional[List[int]] = Field(default=None)