from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from padoc_common.schemas.base import ErrorResponse, SuccessResponse
from padoc_common.schemas.list_order import PatientOrder, PatientOrderRequest, PatientOrderResponse
from app.services import auth_service
from app.services.users_service import list_order_service
from padoc_common.models import Account
from padoc_common.models.enums import UserRoleEnum
from padoc_common.exceptions import PermissionDeniedError, NotFoundError


router = APIRouter(prefix="/list-order", tags=["list-order"])


@router.get(
    "",
    response_model=PatientOrderResponse,
    status_code=status.HTTP_200_OK,
    summary="의사의 환자 목록 순서 조회",
    responses={403: {"model": ErrorResponse, "description": "의사가 아닌 경우"},
               500: {"model": ErrorResponse, "description": "목록 순서 조회 실패"}},
)
async def get_my_list(
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    """
    로그인된 의사의 환자 목록 순서를 조회합니다.
    - **doctor** 역할만 이 엔드포인트를 사용할 수 있습니다.
    """
    account_id = session_info.get("account_id")
    role = session_info.get("role")

    if role != UserRoleEnum.DOCTOR:
        raise PermissionDeniedError("의사만 접근 가능합니다.")

    patient_order = await list_order_service.get_patient_order(db, account_id)
    return PatientOrderResponse(**patient_order.model_dump())


@router.post(
    "",
    response_model=SuccessResponse,
    summary="의사의 환자 목록 순서 수정",
    responses={403: {"model": ErrorResponse, "description": "의사가 아닌 경우"},
               500: {"model": ErrorResponse, "description": "목록 순서 조회 실패"}},
)
async def update_my_list(
    payload: PatientOrderRequest,
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    """
    로그인된 의사의 환자 목록 순서를 수정합니다.
    - **doctor** 역할만 이 엔드포인트를 사용할 수 있습니다.
    """
    account_id = session_info.get("account_id")
    role = session_info.get("role")

    if role != UserRoleEnum.DOCTOR:
        raise PermissionDeniedError("의사만 접근 가능합니다.")

    await list_order_service.update_patient_order(
        db, account_id, payload.patient_order
    )
    return SuccessResponse(message="환자 목록 순서가 성공적으로 업데이트되었습니다.")