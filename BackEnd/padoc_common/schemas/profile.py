from datetime import date, datetime
from enum import Enum
from typing import Optional, List, TYPE_CHECKING, Any, Union
from pydantic import BaseModel, ConfigDict, Field, EmailStr

from padoc_common.schemas.auth import PatientProfile
from padoc_common.schemas.auth import DoctorProfile
from padoc_common.schemas.auth import GenderEnum
# --- 응답용 프로필 (DB ID 포함) ---
class PatientWithAccountId(PatientProfile):
    """DB ID가 포함된 환자 정보"""

    account_id: int
    model_config = ConfigDict(from_attributes=True)


class DoctorWithAccountId(DoctorProfile):
    """DB ID가 포함된 의사 정보"""

    account_id: int
    model_config = ConfigDict(from_attributes=True)


class PatientList(BaseModel):
    patients: List[PatientWithAccountId]


class DoctorList(BaseModel):
    doctors: List[DoctorWithAccountId]

# --- 프로필 수정 ---
class UpdateProfileRequest(BaseModel):
    login_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    gender: Optional[GenderEnum] = None
    age: Optional[int] = None

ProfileResponse = Union[PatientWithAccountId, DoctorWithAccountId]