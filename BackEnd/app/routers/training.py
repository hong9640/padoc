from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import boto3
from botocore.exceptions import ClientError
import botocore
import os
from padoc_common.schemas.base import SuccessResponse
from sqlmodel import select
from app import storage
from app import db
from padoc_common.models.enums import UserRoleEnum
from padoc_common.models.voice_records import VoiceRecord
from padoc_common.schemas.training import (
    BasicTrainingUploadRequest,
    TrainingBasicUploadResponse,
    AdvTrainingInfromation,
    AdvancedTrainingResultResponse,
    UploadStatusResponse, 
    UploadStatusRequest,
    TrainingBasicDownloadResponse,
)
from app.services import training_service
from padoc_common.models import Account
from app.services import auth_service
from padoc_common.schemas.base import ErrorResponse
from padoc_common.exceptions import BadRequestError, PermissionDeniedError


router = APIRouter(
    prefix="/training",
    tags=["training"],
)

from fastapi import BackgroundTasks
from app.services.background_file_check_service import poll_s3_file_status

@router.post(
    "/basic/upload",
    response_model=TrainingBasicUploadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "허용되지 않는 파일확장자"},
        403: {"model": ErrorResponse, "description": "환자가 아닌 경우"},
        404: {
            "model": ErrorResponse,
            "description": "연결할 음성 기록을 찾을 수 없는 경우",
        },
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
)
async def upload_training_file(
    background_tasks: BackgroundTasks,# 파일 상태 확인 프로토타입
    payload: BasicTrainingUploadRequest,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    s3_client: botocore.client.BaseClient = Depends(storage.get_s3_client),
    db: AsyncSession = Depends(db.get_session),
):
    """
    훈련 음성 파일 제출을 위한 업로드 URL을 반환합니다.
    """
    account_id = session_info["account_id"]
    role = session_info["role"]

    # 1. 원본 파일명에서 확장자만 안전하게 추출합니다.
    _, extension = os.path.splitext(payload.file_name)
    if extension != ".wav":
        raise BadRequestError(
            message="업로드 파일의 형식이 잘못되었습니다. WAV 파일만 업로드 가능합니다."
        )

    if role != UserRoleEnum.PATIENT:
        raise PermissionDeniedError("환자가 아닙니다.")

    if payload.related_voice_record_id:
        result = await db.execute(
            select(VoiceRecord).where(VoiceRecord.id == payload.related_voice_record_id)
        )
        if not result.scalars().first():
            raise BadRequestError(
                f"요청한 연관 데이터가 존재하지 않습니다. ID: {payload.related_voice_record_id}"
            )

    s3_key = training_service.generate_s3_key(
        base_dir="training-data",
        patient_id=account_id,
        original_filename=payload.file_name,
    )

    upload_url = await training_service.create_upload_presigned_url(
        s3_client,
        s3_key,
    )

    record_id = await training_service.create_voice_record(
        db=db,
        file_path=s3_key,
        patient_id=account_id,
        type=payload.type,
        related_voice_record_id=payload.related_voice_record_id,
    )

    # 프로토타입: 백그라운드 작업 추가
    #    응답이 클라이언트에 전송된 후, FastAPI가 이 함수를 실행합니다.
    background_tasks.add_task(
        poll_s3_file_status,
        s3_client=s3_client,
        s3_key=s3_key,  # generate_presigned_url 함수가 s3_key를 반환하도록 수정 필요
        record_id=record_id
    )

    return TrainingBasicUploadResponse(record_id=record_id, upload_url=upload_url)


@router.get(
    "/basic/upload-status/{record_id}",
    response_model=UploadStatusResponse,
    responses={
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
)
async def get_upload_status(
    record_id: int,
    current_user: dict = Depends(auth_service.get_current_active_session_info),
    session: AsyncSession = Depends(db.get_session),
):

    return await training_service.process_check_status(
        db=session, record_id=record_id, current_user=current_user
    )


@router.post(
    "/advanced",
    response_model=SuccessResponse,
    responses={
        409: {"model": ErrorResponse, "description": "ID가 중복될 경우"},
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
    },
)
async def submit_advanced_training_result(
    payload: AdvTrainingInfromation,
    current_user: dict = Depends(auth_service.get_current_active_session_info),
    session: AsyncSession = Depends(db.get_session),
):
    """
    심화 훈련을 시작하고, 게이밍 점수를 반환합니다.
    """
    patient_id = current_user.get("account_id")
    return await training_service.process_advanced_training(
        db=session,
        training_data=payload,
        patient_id=patient_id,
    )

@router.get(
        "/basic/upload_status/{record_id}", 
        response_model=UploadStatusResponse,
        responses={
        500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
        },
        )
async def get_upload_status(
    record_id: int,
    current_user: dict = Depends(auth_service.get_current_active_session_info),
    session: AsyncSession = Depends(db.get_session)
):
    
    return await training_service.process_check_status(
        db=session,
        record_id=record_id,
        current_user=current_user
    )

@router.get(
        "/basic/download/{record_id}", 
        response_model=TrainingBasicDownloadResponse,
        responses={
            400: {"model": ErrorResponse, "description": "허용되지 않는 파일확장자"},
            403: {"model": ErrorResponse, "description": "환자가 아닌 경우"},
            500: {"model": ErrorResponse, "description": "서버 내부 오류로 인한 실패"},
        },
    )
async def get_download_url(
    record_id: int,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    s3_client: botocore.client.BaseClient = Depends(storage.get_s3_client),
    db: AsyncSession = Depends(db.get_session),
):
    account_id = session_info["account_id"]
    role = session_info["role"]

    if role != UserRoleEnum.DOCTOR:
        raise PermissionDeniedError("환자가 아닙니다.")
    
    
    download_url = await training_service.generate_download_url_for_doctor(
        db=db,
        s3_client=s3_client,
        record_id=record_id,
        doctor_id=account_id,
    )

    return TrainingBasicDownloadResponse(download_url=download_url)



