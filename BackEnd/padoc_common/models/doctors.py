# app/models/doctors.py

from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import Mapped
from .enums import GenderEnum
if TYPE_CHECKING:
    from .accounts import Account
    from .patient_doctor_access import PatientDoctorAccess
    from .doctor_notes import DoctorNote
    from .doctor_patient_view_settings import DoctorPatientViewSetting
    


# 의사 고유 정보만 포함하는 DoctorBase 모델
class DoctorBase(SQLModel):
    valid_license_id: str = Field(max_length=255, unique=True)
    is_verified: bool = Field(default=False, nullable=False)
    address: Optional[str] = Field(default=None, max_length=500)
    gender: Optional["GenderEnum"] = Field(default=None)
    age: Optional[int] = Field(default=None)

# 데이터베이스 테이블과 매핑되는 Doctor 모델
class Doctor(DoctorBase, table=True):
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
    account: Mapped["Account"] = Relationship(back_populates="doctor")

    # 다른 테이블과의 관계 설정
    patient_accesses: Mapped[List["PatientDoctorAccess"]] = Relationship(back_populates="doctor")
    notes_written: Mapped[List["DoctorNote"]] = Relationship(back_populates="doctor")
    view_setting: Mapped[Optional["DoctorPatientViewSetting"]] = Relationship(back_populates="doctor")

# API에서 의사 계정 생성 시 받을 데이터를 위한 모델
# Account 정보와 Doctor 정보를 모두 포함
class DoctorCreate(SQLModel):
    login_id: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    is_verified: bool 
    valid_license_id: str
    address: Optional[str] = None
    gender: Optional["GenderEnum"] = None
    age: Optional[int] = None

# API에서 의사 정보를 반환할 때 사용할 모델
# Account 정보와 Doctor 정보를 통합하여 제공
class DoctorRead(DoctorBase):
    account_id: int
    login_id: str
    full_name: str
    email: Optional[str]
    phone_number: Optional[str]
    role: str

# 의사 정보 수정을 위한 모델
# Account와 Doctor 정보 중 수정 가능한 필드를 Optional로 정의
class DoctorUpdate(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None # 비밀번호 변경 시 사용
    
    address: Optional[str] = None
    gender: Optional["GenderEnum"] = None
    age: Optional[int] = None