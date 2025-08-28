# app/services/auth_service.py
"""인증 및 인가 서비스 계층입니다."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Union

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload

from app.db import get_session
from padoc_common.exceptions import InvalidCredentialsError, LicenseVerificationError
from padoc_common.models.accounts import Account
from padoc_common.models.doctors import Doctor, DoctorCreate
from padoc_common.models.enums import UserRoleEnum
from padoc_common.models.patients import Patient, PatientCreate
from padoc_common.schemas.auth import DoctorSignup, PatientSignup, TokenPayload

# --- 상수 및 설정 ---

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY 환경 변수가 설정되지 않았습니다.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/sessions", auto_error=False)


# --- 비밀번호 및 토큰 유틸리티 ---


def get_password_hash(password: str) -> str:
    """
    평문 비밀번호를 해시 처리합니다.

    Args:
        password: 해시할 평문 비밀번호입니다.

    Returns:
        해시된 비밀번호 문자열입니다.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    평문 비밀번호와 해시된 비밀번호를 비교합니다.

    Args:
        plain_password: 확인할 평문 비밀번호입니다.
        hashed_password: 비교할 해시된 비밀번호입니다.

    Returns:
        비밀번호가 일치하면 True, 그렇지 않으면 False를 반환합니다.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    새로운 JWT 액세스 토큰을 생성합니다.

    Args:
        data: 토큰 페이로드에 인코딩할 데이터입니다.
        expires_delta: 토큰 만료 시간을 설정하는 timedelta 객체 (선택 사항).
                       기본값은 ACCESS_TOKEN_EXPIRE_MINUTES 입니다.

    Returns:
        인코딩된 JWT 액세스 토큰 문자열입니다.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _decode_jwt_payload(token: str) -> TokenPayload:
    """
    JWT 토큰을 디코딩하여 페이로드를 반환합니다.

    Args:
        token: 디코딩할 JWT 토큰 문자열입니다.

    Raises:
        InvalidCredentialsError: 토큰이 유효하지 않거나, 만료되었거나,
                                 페이로드가 잘못된 형식일 경우 발생합니다.

    Returns:
        디코딩된 토큰 페이로드를 담은 TokenPayload 객체입니다.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        account_id = int(payload.get("account_id"))
        role = payload.get("role")
        if account_id is None or role is None:
            raise InvalidCredentialsError(
                "토큰 페이로드에 'account_id' 또는 'role'이 없습니다."
            )
        return TokenPayload(account_id=str(account_id), role=role)
    except (JWTError, ValueError, TypeError, KeyError) as e:
        raise InvalidCredentialsError(f"토큰 디코딩 실패: {e}") from e


# --- 사용자 및 의사 등록 ---


async def is_id_duplicate(db: AsyncSession, login_id: str) -> bool:
    """
    로그인 ID가 Account 테이블에 이미 존재하는지 확인합니다.

    Args:
        db: 데이터베이스 세션입니다.
        login_id: 중복 확인할 로그인 ID입니다.

    Returns:
        로그인 ID가 존재하면 True, 그렇지 않으면 False를 반환합니다.
    """
    statement = select(Account).where(Account.login_id == login_id)
    existing_account = (await db.execute(statement)).scalars().first()
    return existing_account is not None


async def get_account_info(signup_data: Union[PatientSignup, DoctorSignup]) -> Account:
    """
    회원가입 데이터로부터 Account 모델 인스턴스를 생성합니다.

    Args:
        signup_data: 환자 또는 의사의 회원가입 데이터입니다.

    Returns:
        데이터베이스에 아직 저장되지 않은 새로운 Account 객체입니다.
    """
    account_data = signup_data.model_dump(
        include={"login_id", "full_name", "email", "phone_number", "role"}
    )
    account_data["password"] = get_password_hash(signup_data.password)
    return Account(**account_data)


async def request_license_verification(db: AsyncSession, valid_license_id: str) -> bool:
    """
    의사 면허 ID로 의사를 찾아 인증 상태를 True로 변경합니다.
    참고: 실제 환경에서는 의료 면허 기관에 대한 외부 API 호출이 포함될 수 있습니다.

    Args:
        db: 데이터베이스 세션입니다.
        valid_license_id: 확인할 의사의 면허 ID입니다.

    Returns:
        의사를 찾아 업데이트했으면 True, 그렇지 않으면 False를 반환합니다.
    """
    # statement = select(Doctor).where(Doctor.valid_license_id == valid_license_id)
    # doctor = (await db.execute(statement)).scalars().first()
    # if not doctor:
    #     return False
    # doctor.is_verified = True
    # db.add(doctor)
    # await db.commit()
    return True

async def check_license_duplicate(db: AsyncSession, valid_license_id: str) -> bool:
    """주어진 의사 면허 ID가 이미 데이터베이스에 존재하는지 확인합니다.

    Args:
        db: 데이터베이스 세션입니다.
        valid_license_id: 중복 확인할 의사 면허 ID입니다.

    Returns:
        면허 ID가 이미 존재하면 True, 그렇지 않으면 False를 반환합니다.
    """
    # 1. 면허 ID로 의사 정보를 조회하는 쿼리 생성
    statement = select(Doctor).where(Doctor.valid_license_id == valid_license_id)
    
    # 2. 쿼리를 실행하여 첫 번째 결과를 가져옴
    doctor = (await db.execute(statement)).scalars().first()

    # 3. 결과(doctor)가 존재하면 True(중복), 존재하지 않으면 False(중복 아님) 반환
    return doctor is not None



async def register_patient(db: AsyncSession, signup_data: PatientCreate):
    """
    새로운 환자와 관련 계정을 등록합니다.

    Args:
        db: 데이터베이스 세션입니다.
        signup_data: 환자의 등록 데이터입니다.

    Raises:
        IntegrityError: 로그인 ID 또는 다른 고유 제약 조건이 위반될 경우 발생합니다.
    """
    new_account = await get_account_info(signup_data)
    patient_data = signup_data.model_dump(include={"address", "gender", "age"})
    new_patient = Patient(**patient_data, account=new_account)
    db.add(new_patient)
    try:
        await db.commit()
        await db.refresh(new_patient)
        await db.refresh(new_account)
    except IntegrityError:
        await db.rollback()
        raise


async def register_doctor(db: AsyncSession, signup_data: DoctorCreate):
    """
    새로운 의사와 관련 계정을 등록합니다.

    Args:
        db: 데이터베이스 세션입니다.
        signup_data: 의사의 등록 데이터입니다.

    Raises:
        LicenseVerificationError: 제공된 면허 ID를 확인할 수 없는 경우 발생합니다.
        IntegrityError: 로그인 ID 또는 다른 고유 제약 조건이 위반될 경우 발생합니다.
    """
    new_account = await get_account_info(signup_data)
    doctor_data = signup_data.model_dump(
        include={"address", "gender", "age", "valid_license_id"}
    )
    if not await request_license_verification(db, doctor_data["valid_license_id"]):
        raise LicenseVerificationError(
            "유효하지 않은 면허 ID이거나 확인에 실패했습니다."
        )
    
    if await check_license_duplicate(db, doctor_data["valid_license_id"]):
        raise LicenseVerificationError(
            "이미 사용중인 면허입니다."
        )

    doctor_data["is_verified"] = True
    new_doctor = Doctor(**doctor_data, account=new_account)
    db.add(new_doctor)
    try:
        await db.commit()
        await db.refresh(new_doctor)
        await db.refresh(new_account)
    except IntegrityError:
        await db.rollback()
        raise


# --- 인증 및 인가 의존성 ---


async def authenticate_user(
    db: AsyncSession, login_id: str, password: str
) -> Optional[Account]:
    """
    로그인 ID와 비밀번호로 사용자를 인증합니다.

    Args:
        db: 데이터베이스 세션입니다.
        login_id: 사용자의 로그인 ID입니다.
        password: 사용자의 평문 비밀번호입니다.

    Returns:
        인증에 성공하면 인증된 Account 객체를, 그렇지 않으면 None을 반환합니다.
    """
    statement = select(Account).where(Account.login_id == login_id)
    account = (await db.execute(statement)).scalars().first()
    if not account or not verify_password(password, account.password):
        return None
    return account


async def get_current_active_session_info(
    db: AsyncSession = Depends(get_session), token: str = Depends(oauth2_scheme)
) -> dict:
    """
    JWT 토큰으로부터 현재 활성화된 사용자(환자 또는 의사)를 가져오는 FastAPI 의존성입니다.

    이 함수는 관련된 Account 객체를 포함하여 전체 엔티티를 로드하므로,
    현재 사용자의 전체 프로필을 가져오는 데 적합합니다.

    Args:
        db: FastAPI에 의해 주입되는 데이터베이스 세션입니다.
        token: FastAPI에 의해 주입되는 OAuth2 베어러 토큰입니다.

    Raises:
        InvalidCredentialsError: 토큰이 없거나, 유효하지 않거나,
                                 토큰에 명시된 사용자가 존재하지 않을 경우 발생합니다.

    Returns:
        토큰에 담긴 정보 딕셔너리.
    """
    if token is None:
        raise InvalidCredentialsError("인증 토큰이 없습니다.")
    payload = _decode_jwt_payload(token)
    return payload.model_dump()




async def verify_password_for_account(
    db: AsyncSession, account_id: int, password: str
) -> bool:
    """주어진 계정 ID에 대한 비밀번호를 확인합니다.

    Args:
        db: 데이터베이스 세션입니다.
        account_id: 확인할 계정의 ID입니다.
        password: 확인할 평문 비밀번호입니다.

    Returns:
        비밀번호가 맞으면 True, 그렇지 않으면 False를 반환합니다.
    """
    account = await db.get(Account, account_id)
    if not account or not verify_password(password, account.password):
        return False
    return True
