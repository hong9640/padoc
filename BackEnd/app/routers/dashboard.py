from typing import Optional
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta

from app.db import get_session
from app.services import auth_service, dashboard_service
from app.services.users_service import connection_service
from padoc_common.schemas.dashboard import (
    AdvTrainingInformationList as PatientDashboardResponse,
    VoiceInformation,
    VoiceInformationList as DoctorDashboardResponse,
)
from padoc_common.schemas.base import ErrorResponse
from padoc_common.models.patients import Patient
from padoc_common.models.doctors import Doctor
import padoc_common.exceptions as exc
from padoc_common.models.enums import UserRoleEnum
from app.services.features_service import nest_ah_features

router = APIRouter(
    prefix="/dashboard",
    tags=["대시보드"],
)


@router.get(
    "/patient",
    response_model=PatientDashboardResponse,
    summary="환자/보호자용 대시보드 데이터 조회",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        400: {"model": ErrorResponse, "description": "잘못된 기간 요청"},
    },
)
async def get_patient_dashboard(
    start_date: Optional[date] = Query(None, description="조회 시작일 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="조회 종료일 (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    """환자/보호자가 자신의 대시보드 정보를 조회합니다."""
    account_id = session_info["account_id"]
    role = session_info["role"]

    if role != UserRoleEnum.PATIENT:
        raise exc.PermissionDeniedError(message="환자 또는 보호자만 접근할 수 있습니다.")

    if start_date and end_date:
        if start_date > end_date:
            raise exc.BadRequestError(message="조회 시작일은 종료일보다 늦을 수 없습니다.")

    training_history = await dashboard_service.get_patient_training_history(
        db, account_id, start_date, end_date
    )

    return PatientDashboardResponse(trainings=training_history)


@router.get(
    "/doctor/{patient_id}",
    response_model=DoctorDashboardResponse,
    summary="의사용 특정 환자 상세 데이터 조회",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        400: {"model": ErrorResponse, "description": "잘못된 기간 요청"},
        404: {"model": ErrorResponse, "description": "환자 정보를 찾을 수 없음"},
    },
)
async def get_patient_details_for_doctor(
    patient_id: int = Path(..., title="환자 ID"),
    start_date: Optional[date] = Query(None, description="조회 시작일 (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="조회 종료일 (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_session),
    session_info: dict = Depends(auth_service.get_current_active_session_info),
):
    """의사가 특정 환자의 상세 대시보드 정보를 조회합니다."""
    account_id = session_info["account_id"]
    role = session_info["role"]


    if role != UserRoleEnum.DOCTOR:
        raise exc.PermissionDeniedError(message="환자 또는 보호자만 접근할 수 있습니다.")

    if start_date and end_date:
        if start_date > end_date:
            raise exc.BadRequestError(message="조회 시작일은 종료일보다 늦을 수 없습니다.")

    is_connected = await connection_service.check_connection(db, doctor_id=account_id, patient_id=patient_id)
    if not is_connected:
        raise exc.PermissionDeniedError(message="해당 환자에 대한 접근 권한이 없습니다.")

    patient_voices = await dashboard_service.get_patient_voice_records(
        db, patient_id, start_date, end_date
    )

    wrapped_patient_voices = []
    for voice in patient_voices:
        voice_info = VoiceInformation(
            **voice.model_dump(exclude={"id", "related_voice_record_id", "type" ,"ah_features", "sentence_features", }),
            voice_id=voice.id,
            related_voice_info_id=voice.related_voice_record_id,
            recording_type=voice.type,
            ah_features= nest_ah_features(voice.ah_features) if voice.ah_features else None,
            sentence_features=voice.sentence_features if voice.sentence_features else None,
        )
        
        wrapped_patient_voices.append(voice_info)

    return DoctorDashboardResponse(voices=wrapped_patient_voices)
