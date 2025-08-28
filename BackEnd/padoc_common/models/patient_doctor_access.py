# app/models/user_doctor_access.py


from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import func, UniqueConstraint
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import Mapped # 1. Mapped 타입을 임포트합니다.
from .enums import ConnectionStatusEnum

if TYPE_CHECKING:
    from .patients import Patient
    from .doctors import Doctor


class PatientDoctorAccessBase(SQLModel):
    patient_id: int
    doctor_id: int
    connection_status: "ConnectionStatusEnum" = Field(default=ConnectionStatusEnum.PENDING)

class PatientDoctorAccess(PatientDoctorAccessBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(sa_column=Column(Integer, ForeignKey("patient.account_id", ondelete="CASCADE"), nullable=False, index=True))
    doctor_id: int = Field(sa_column=Column(Integer, ForeignKey("doctor.account_id", ondelete="CASCADE"), nullable=False, index=True))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": func.now()}
    )
    __table_args__ = (UniqueConstraint("patient_id", "doctor_id", name="uq_patient_doctor_access"),)

    # 2. 모든 Relationship의 타입 힌트를 Mapped[...]로 감싸줍니다.
    patient: Mapped["Patient"] = Relationship(back_populates="doctor_accesses")
    doctor: Mapped["Doctor"] = Relationship(back_populates="patient_accesses")

class PatientDoctorAccessCreate(PatientDoctorAccessBase):
    pass

class PatientDoctorAccessRead(PatientDoctorAccessBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class PatientDoctorAccessUpdate(SQLModel):
    connection_status: "ConnectionStatusEnum"
