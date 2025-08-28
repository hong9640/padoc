# app/routers/users/schedules.py
from typing import List
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.db import get_session
from padoc_common.schemas.base import ErrorResponse
from padoc_common.schemas.schedule import ScheduleDate, ScheduleListResponse, ScheduleCreate, PermissionDeniedError, ScheduleNotFoundError
from padoc_common.schemas.base import SuccessResponse
from app.services import auth_service
from app.services.users_service import schedules_service
from padoc_common.models.enums import UserRoleEnum
from padoc_common.models import Account
from padoc_common.exceptions import BackEndInternalError, PermissionDeniedError


router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
)

@router.get(
    "",
    response_model=ScheduleListResponse,
    summary="환자의 스케줄 목록 조회",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        500: {"model": ErrorResponse, "description": "스케줄 목록 조회 실패"},
    },
)
async def get_schedules(
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    patient_id = session_info.get("account_id")
    role = session_info.get("role")
    
    if role != UserRoleEnum.PATIENT:
        raise PermissionDeniedError(message="환자만 스케줄을 조회할 수 있습니다.")

    # 서비스는 이제 ORM 객체 리스트를 반환합니다. try/except가 필요 없습니다.
    schedules = await schedules_service.get_schedules_by_patient_id(db, patient_id=patient_id)
    return {"appointment_dates": schedules}


@router.post(
    "",
    summary="스케줄 생성",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        409: {"model": ErrorResponse, "description": "잘못된 요청 상태"},
        500: {"model": ErrorResponse, "description": "스케줄 삭제 실패"},
    },
)
async def create_schedule(
    payload: ScheduleCreate,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    patient_id = session_info.get("account_id")
    role = session_info.get("role")

    if role != UserRoleEnum.PATIENT:
       raise PermissionDeniedError("환자만 스케줄을 생성할 수 있습니다.")
    

    new_schedule = await schedules_service.create_schedule(
        db, patient_id=patient_id, schedule_data=payload
    )

    # 서비스단에서 생성에 실패
    if not new_schedule:
        raise BackEndInternalError(message="스케줄 생성에 실패했습니다.")
        
    return {"schedule_id": new_schedule.id}


@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="스케줄 삭제",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        409: {"model": ErrorResponse, "description": "해당하는 스케줄이 없음"},
        500: {"model": ErrorResponse, "description": "스케줄 삭제 실패"},
    },
)
async def delete_schedule(
    schedule_id: int,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    patient_id = session_info.get("account_id")
    role = session_info.get("role")

    if role != UserRoleEnum.PATIENT:
       raise PermissionDeniedError("환자만 스케줄을 생성할 수 있습니다.")
    
    await schedules_service.delete_schedule(
        db, patient_id=patient_id, schedule_id=schedule_id
    )
    
    return SuccessResponse(message="요청이 성공적으로 처리 되었습니다.")