from fastapi import APIRouter, Query, Depends, HTTPException, status
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from padoc_common.schemas.base import ErrorResponse
from app.services.users_service.search_service import search_users_by_name
from padoc_common.schemas.search import UserSearchResponse
from app.services import auth_service
from padoc_common.models import Account
from padoc_common.models.enums import UserRoleEnum
from padoc_common.exceptions import PermissionDeniedError, BadRequestError


router = APIRouter(prefix="/search", tags=["search"])


@router.get(
    "",
    summary="이름으로 사용자 검색",
    description="쿼리 문자열과 일치하는 이름을 가진 사용자를 검색합니다.",
    response_model=UserSearchResponse,
    responses={
        403: {
            "model": ErrorResponse,
            "description": "의사만 환자를 검색할 수 있습니다.",
        },
        422: {"model": ErrorResponse, "description": "검색어를 입력하지 않았습니다."},
        400: {"model": ErrorResponse, "description": "검색어가 빈 문자열 입니다."},
        500: {"model": ErrorResponse, "description": "검색 기능의 심각한 오류 발생"},
    },
)
async def search_users(
    q: str = Query(..., description="검색할 사용자 이름의 일부 또는 전체"),
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    """
    이름으로 사용자 검색 API
    """
    if q is "":
        raise BadRequestError("검색어를 입력하지 않았습니다.")

    account_id = session_info.get("account_id")
    role = session_info.get("role")

    if role != UserRoleEnum.DOCTOR:
        raise PermissionDeniedError("의사만 환자를 검색할 수 있습니다.")

    users = await search_users_by_name(db, q)
    return UserSearchResponse.model_validate(users)
