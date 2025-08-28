
from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy import func
from sqlalchemy.orm import Mapped # 1. Mapped 타입을 임포트합니다.

if TYPE_CHECKING:
    from .patients import Patient
    from .doctors import Doctor

class DoctorNoteBase(SQLModel):
    patient_id: int
    doctor_id: int
    note_content: str

class DoctorNote(DoctorNoteBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(sa_column=Column(Integer, ForeignKey("patient.account_id", ondelete="CASCADE"), nullable=False, index=True))
    doctor_id: int = Field(sa_column=Column(Integer, ForeignKey("doctor.account_id", ondelete="CASCADE"), nullable=False, index=True))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": func.now()}
    )

    patient: Mapped["Patient"] = Relationship(back_populates="notes_about")
    doctor: Mapped["Doctor"] = Relationship(back_populates="notes_written")

class DoctorNoteCreate(DoctorNoteBase):
    pass

class DoctorNoteRead(DoctorNoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class DoctorNoteUpdate(SQLModel):
    note_content: Optional[str] = Field(default=None)