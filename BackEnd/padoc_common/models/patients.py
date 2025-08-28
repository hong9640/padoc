# app/models/patients.py

from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped
# 순환 참조 방지를 위해 TYPE_CHECKING 블록 내에서 모델 임포트
from .enums import GenderEnum
if TYPE_CHECKING:
    from .accounts import Account
    from .patient_doctor_access import PatientDoctorAccess
    from .voice_records import VoiceRecord
    from .doctor_notes import DoctorNote
    from .calendar_events import CalendarEvent
    from .advanced_training_informations import AdvancedTrainingInformation

# 환자 고유 정보만 포함하는 PatientBase 모델
class PatientBase(SQLModel):
    address: Optional[str] = Field(default=None, max_length=500)
    gender: Optional["GenderEnum"] = Field(default=None)
    age: Optional[int] = Field(default=None)

# 데이터베이스 테이블과 매핑되는 Patient 모델
class Patient(PatientBase, table=True):
    # PK이자 FK로 accounts.id를 참조
    account_id: int = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("account.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False
        )
    )

    # Account 테이블과의 1:1 관계 설정
    account: Mapped["Account"] = Relationship(back_populates="patient")
    
    # 다른 테이블과의 관계 설정
    doctor_accesses: Mapped[List["PatientDoctorAccess"]] = Relationship(back_populates="patient")
    voice_records: Mapped[List["VoiceRecord"]] = Relationship(back_populates="patient")
    notes_about: Mapped[List["DoctorNote"]] = Relationship(back_populates="patient")
    calendar_events: Mapped[List["CalendarEvent"]] = Relationship(back_populates="patient")
    advanced_training: Mapped[Optional["AdvancedTrainingInformation"]] = Relationship(back_populates="patient")

# API에서 환자 계정 생성 시 받을 데이터를 위한 모델
class PatientCreate(SQLModel):
    login_id: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    
    address: Optional[str] = None
    gender: Optional["GenderEnum"] = None
    age: Optional[int] = None

# API에서 환자 정보를 반환할 때 사용할 모델
class PatientRead(PatientBase):
    account_id: int
    login_id: str
    full_name: str
    email: Optional[str]
    phone_number: Optional[str]
    role: str

# 환자 정보 수정을 위한 모델
class PatientUpdate(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None

    address: Optional[str] = None
    gender: Optional["GenderEnum"] = None
    age: Optional[int] = None