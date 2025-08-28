# app/routers/users/profile.py
from datetime import datetime
from typing import Union

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from padoc_common.schemas.base import ErrorResponse
from padoc_common.schemas.profile import (
    ProfileResponse,
    UpdateProfileRequest,
)
from app.services import auth_service
from app.services.users_service import profile_service
from padoc_common.models import Patient, Doctor
from padoc_common.models.enums import UserRoleEnum
from padoc_common.schemas.base import SuccessResponse

router = APIRouter(
    prefix="/profile",
    tags=["profile"],
)


@router.get(
    "",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    # API 문서에 커스텀 에러 응답을 명시합니다.
    responses={500: {"model": ErrorResponse, "description": "사용자를 찾을 수 없음"}},
)
async def get_my_profile(
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    """
    서비스를 호출하여 프로필 정보를 가져오고, 결과가 없으면 커스텀 에러를 반환합니다.
    """
    # 1. 세션 정보를 바탕으로 유저 정보 파싱하여 account_id와 role 확인
    account_id = session_info.get("account_id")
    role = session_info.get("role")

    profile_data = await profile_service.get_profile(
        db=db, account_id=account_id, role=role
    )

    return profile_data


@router.put(
    "",
    response_model=SuccessResponse,
    summary="내 프로필 정보 수정",
    responses={500: {"model": ErrorResponse, "description": "프로필 업데이트 실패"}},
)
async def update_my_profile(
    payload: UpdateProfileRequest,
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    # 1. 세션 정보를 바탕으로 유저 정보 파싱하여 account_id와 role 확인
    account_id = session_info.get("account_id")
    role = session_info.get("role")

    # 서비스 호출
    await profile_service.update_profile(
        db=db, account_id=account_id, role=role, update_data=payload
    )

    return SuccessResponse(message="프로필이 성공적으로 업데이트되었습니다.")
