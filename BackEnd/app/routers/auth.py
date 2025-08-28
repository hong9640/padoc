# app/routers/auth.py
"""인증 및 인가 관련 라우터"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
import padoc_common.exceptions as exc
from app.services import auth_service
from padoc_common.schemas import auth
from padoc_common.schemas.base import ErrorResponse, SuccessResponse, CheckResponse

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post(
    "/patients",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"model": ErrorResponse, "description": "ID가 중복될 경우"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
    summary="환자 회원가입"
)
async def signup_patient(payload: auth.PatientSignup, db: AsyncSession = Depends(get_session)):
    """환자 계정을 생성합니다."""
    if await auth_service.is_id_duplicate(db, login_id=payload.login_id):
        raise exc.DuplicateIdError("이미 사용 중인 아이디입니다.")
    
    await auth_service.register_patient(db=db, signup_data=payload)
    return SuccessResponse(message="회원가입이 성공적으로 완료되었습니다.")


@router.post(
    "/doctors",
    response_model=SuccessResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "의사 면허증이 유효하지 않을 경우"},
        409: {"model": ErrorResponse, "description": "ID가 중복될 경우"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
    summary="의사 회원가입"
)
async def signup_doctor(payload: auth.DoctorSignup, db: AsyncSession = Depends(get_session)):
    """의사 계정을 생성합니다."""
    if await auth_service.is_id_duplicate(db, login_id=payload.login_id):
        raise exc.DuplicateIdError("이미 사용 중인 아이디입니다.")

    await auth_service.register_doctor(db=db, signup_data=payload)
    return SuccessResponse(message="회원가입이 성공적으로 완료되었습니다.")


@router.post(
    "/sessions",
    response_model=auth.LoginResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "로그인 실패"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
    summary="로그인 및 토큰 발급"
)
async def login_for_access_token(
    payload: auth.LoginRequest, db: AsyncSession = Depends(get_session)
):
    """사용자 로그인 후 JWT 액세스 토큰을 발급합니다."""
    account = await auth_service.authenticate_user(
        db, login_id=payload.login_id, password=payload.password
    )
    if not account:
        raise exc.InvalidCredentialsError("로그인 ID 또는 비밀번호가 잘못되었습니다.")

    token_payload = auth.TokenPayload(account_id=str(account.id), role=account.role.value)
    access_token = auth_service.create_access_token(data=token_payload.model_dump())
    
    return auth.LoginResponse(
        access_token=access_token,
        account_id=account.id,
        role=account.role,
    )

@router.delete(
    "/sessions",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    responses={
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
    summary="로그아웃"
)
async def logout_user():
    """
    사용자 로그아웃
    """
    # 참고: 실제 로그아웃 로직은 클라이언트에서 토큰을 삭제하는 것입니다.
    return SuccessResponse()

@router.post(
    "/check-duplicate-id",
    response_model=CheckResponse,
    status_code=status.HTTP_200_OK,
    responses={
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
    summary="아이디 중복 확인"
)
async def check_id_duplication(
    payload: auth.CheckDuplicateIdRequest, db: AsyncSession = Depends(get_session)
):
    """로그인 ID의 중복 여부를 확인합니다."""
    if await auth_service.is_id_duplicate(db, login_id=payload.login_id):
        return CheckResponse(result=False, message="이미 사용 중인 아이디입니다.")
    else:
        return CheckResponse(result=True, message="사용 가능한 아이디입니다.")


@router.post(
    "/verify-password",
    response_model=CheckResponse,
    status_code=status.HTTP_200_OK,
    responses={
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
    summary="비밀번호 재확인"
)
async def verify_password(
    payload: auth.VerifyPasswordRequest,
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    """현재 로그인된 사용자의 비밀번호가 맞는지 확인합니다."""
    account_id = session_info["account_id"]
    is_valid = await auth_service.verify_password_for_account(
        db, account_id=account_id, password=payload.password
    )
    if not is_valid:
        return CheckResponse(result=False, message="비밀번호가 일치하지 않습니다.")
    else:
        return CheckResponse(result=True, message="비밀번호가 일치합니다.")


@router.post(
    "/verify-doctor-license", 
    response_model=CheckResponse,
    status_code=status.HTTP_200_OK,
    responses={
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
    summary="의사 면허 번호 확인"
)
async def verify_and_update_doctor_license(
    payload: auth.VerifyDoctorLicenseRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    의사 면허 번호 확인 및 인증 상태 변경
    """
    # 1. 면허 번호로 의사 조회 및 인증 상태 변경
    was_verified = await auth_service.request_license_verification(
        db, valid_license_id=payload.valid_license_id
    )

    was_duplicated = await auth_service.check_license_duplicate(
        db, valid_license_id=payload.valid_license_id
    )
    
    if was_verified:
        return CheckResponse(result=True, message="의사 면허 번호가 유효합니다.")
    elif was_duplicated:
        return CheckResponse(result=True, message="이미 사용중인 면허입니다.")
    else:
        return CheckResponse(result=False, message="의사 면허 번호가 유효하지 않습니다.")