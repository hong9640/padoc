# app/schemas/auth.py
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from padoc_common.models.enums import UserRoleEnum, GenderEnum


# --- 인증 토큰 ---

class Token(BaseModel):
    """로그인 성공 시 반환할 JWT 토큰 정보를 담는 스키마."""
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """JWT 토큰에 담길 데이터 (페이로드)"""
    account_id: str  # 토큰 주체 (사용자 ID)
    role: UserRoleEnum # 사용자 역할
    # exp: Optional[int] = None # 만료 시간 (보안을 위해 추가하는 것을 강력히 권장)
    model_config =  ConfigDict(from_attributes=True)


# --- 기본 프로필 ---
# 1단계: 공통 로직을 담은 Base 모델
class EmptyStringToNoneModel(BaseModel):
    @model_validator(mode='before')
    @classmethod
    def empty_str_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for key, value in data.items():
                if value == "":
                    data[key] = None
        return data


class AccountProfile(EmptyStringToNoneModel):
    """사용자 공통 계정 정보"""

    login_id: str
    full_name: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: UserRoleEnum


class PatientProfile(AccountProfile):
    """환자/보호자 프로필 정보 (공통 정보 상속)"""

    role: UserRoleEnum = Field(UserRoleEnum.PATIENT, frozen=True)
    address: Optional[str] = None
    gender: Optional[GenderEnum] = None
    age: Optional[int] = None


class DoctorProfile(AccountProfile):
    """의사 프로필 정보 (공통 정보 상속)"""

    role: UserRoleEnum = Field(UserRoleEnum.DOCTOR, frozen=True)
    address: Optional[str] = None
    gender: Optional[GenderEnum] = None
    age: Optional[int] = None
    valid_license_id: str
    is_verified: bool = False


# --- 회원가입 ---
class PatientSignup(PatientProfile):
    """환자 회원가입 요청"""

    password: str


class DoctorSignup(DoctorProfile):
    """의사 회원가입 요청"""

    password: str


# --- 로그인 ---
class LoginRequest(BaseModel):
    """로그인 요청"""

    login_id: str
    password: str


class LoginResponse(BaseModel):
    """로그인 응답"""

    access_token: str
    role: UserRoleEnum
    account_id: int


# --- 기타 인증 ---
class VerifyPasswordRequest(BaseModel):
    password: str


class VerifyDoctorLicenseRequest(BaseModel):
    valid_license_id: str


class CheckDuplicateIdRequest(BaseModel):
    login_id: str


# --- 프로필 수정 ---
class UpdateProfileRequest(BaseModel):
    login_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    gender: Optional[GenderEnum] = None
    age: Optional[int] = None


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
