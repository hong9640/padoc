import os
import io
import uuid
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from padoc_common.models.advanced_training_informations import AdvancedTrainingInformation
from padoc_common.schemas.training import AdvTrainingInfromation
from app import db, storage
from padoc_common.models import Account, AhFeatures, SentenceFeatures, PatientDoctorAccess
from padoc_common.models.enums import FileStatusEnum, RecordingTypeEnum
from padoc_common.models.voice_records import VoiceRecord, VoiceRecordCreate
from padoc_common.exceptions import PermissionDeniedError, BackEndInternalError, NotFoundError
from padoc_common.schemas.training import (
    BasicTrainingUploadRequest,
    TrainingBasicUploadResponse,
    AdvancedTrainingResultResponse,
    UploadStatusResponse
)
from padoc_common.schemas.screening import (
    AhScreeningResult as AhFeaturesResponse,
    SentenceScreeningResult as SentenceFeaturessResponse,
)
from padoc_common.models.enums import ConnectionStatusEnum
import boto3
from botocore.exceptions import ClientError
from fastapi import Depends, HTTPException, status
import botocore
from padoc_common.schemas.base import SuccessResponse
import os
import uuid



S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
DEFAULT_EXPIRES_IN = 120


def generate_s3_key(base_dir: str, patient_id: int, original_filename: str) -> str:
    """
    S3 객체 키(경로)를 안전하고 고유한 방식으로 생성합니다.

    Args:
        base_dir: S3 버킷 내의 최상위 디렉터리 (예: "training-data").
        patient_id: 사용자 ID.
        original_filename: 사용자가 업로드한 원본 파일 이름 (확장자 추출용).

    Returns:
        생성된 S3 객체 키 (예: "training-data/123/a1b2c3d4-....wav").
    """
    # 1. 원본 파일명에서 확장자만 안전하게 추출합니다.
    _, extension = os.path.splitext(original_filename)

    # 2. UUID를 사용해 고유하고 안전한 새 파일명을 생성합니다.
    unique_filename = f"{uuid.uuid4()}{extension}"

    # 3. f-string이나 os.path.join 대신 '/'로 명시적으로 결합합니다.
    #    S3 경로는 항상 '/'를 사용하기 때문입니다.
    return "/".join([base_dir, str(patient_id), unique_filename])


async def create_upload_presigned_url(
    s3_client: boto3.client, s3_key: str, expires_in: int = DEFAULT_EXPIRES_IN
) -> str:
    presigned_url = s3_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=expires_in,
    )
    return presigned_url


async def create_download_presigned_url(
    s3_client: boto3.client, s3_key: str, expires_in: int = DEFAULT_EXPIRES_IN
) -> str:
    """
    S3 객체 다운로드를 위한 Presigned URL을 생성합니다.

    Args:
        s3_client: Boto3 S3 클라이언트 객체입니다.
        s3_key: 다운로드할 파일의 S3 키(경로)입니다.
        expires_in: URL의 만료 시간(초)입니다.

    Returns:
        생성된 Presigned URL 문자열을 반환합니다. 실패 시 None을 반환할 수 있습니다.
    """
    presigned_url = s3_client.generate_presigned_url(
        ClientMethod="get_object",  # 👈 'put_object'를 'get_object'로 변경
        Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=expires_in,
    )
    return presigned_url






async def create_voice_record(
    db: AsyncSession,
    file_path: str,
    patient_id: int,
    type: RecordingTypeEnum,
    related_voice_record_id: int = None,
) -> int:
    """
    훈련 음성 파일 업로드를 위해 DB 레코드를 생성
    """

    record_create_data = VoiceRecordCreate(
        patient_id=patient_id,
        file_path=file_path,
        type=type,
        related_voice_record_id=related_voice_record_id,
    )

    new_record = VoiceRecord.model_validate(record_create_data)

    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)

    if related_voice_record_id is not None:
        statement = select(VoiceRecord).where(VoiceRecord.id == related_voice_record_id)
        related_record = await db.execute(statement)
        related_record = related_record.scalars().first()

        if related_record is None:
            raise BackEndInternalError("접근하려는 연관 음성 데이터가 존재하지 않습니다.")

        related_record.related_voice_record_id = new_record.id

        db.add(related_record)
        await db.commit()
        await db.refresh(related_record)


    return new_record.id

async def update_voice_record_status(
    db: AsyncSession, record_id: int, new_status: FileStatusEnum
) -> None:
    """
    주어진 record_id에 해당하는 음성 기록의 상태(status)를 업데이트합니다.

    Args:
        db: 데이터베이스 세션입니다.
        record_id: 상태를 변경할 음성 기록의 고유 ID입니다.
        new_status: 변경할 새로운 상태 값 (FileStatusEnum) 입니다.

    Raises:
        NotFoundError: 주어진 record_id에 해당하는 음성 기록이 없을 경우 발생합니다.
    """
    # 1. ID를 기반으로 업데이트할 음성 기록을 조회합니다.
    record_to_update = await db.get(VoiceRecord, record_id)

    # 2. 해당 기록이 없으면 에러를 발생시킵니다.
    if not record_to_update:
        raise NotFoundError(f"음성 기록(ID: {record_id})을 찾을 수 없습니다.")

    # 3. 객체의 상태를 새로운 상태로 변경합니다.
    record_to_update.status = new_status

    # 4. 변경사항을 DB에 커밋(저장)합니다.
    #    (db.add는 객체가 세션에 이미 있으므로 생략 가능하지만, 명시적으로 추가해도 괜찮습니다.)
    db.add(record_to_update)
    await db.commit()
    await db.refresh(record_to_update)


async def process_advanced_training(
    db: AsyncSession,
    training_data: AdvTrainingInfromation,
    patient_id: int,
) -> SuccessResponse:
    
    try:
        # 1. DB에 저장할 새로운 레코드 객체를 생성합니다.
        new_training_record = AdvancedTrainingInformation(
            avg_score=training_data.avg_score,
            progress=training_data.progress,
            patient_id=patient_id,
        )

        # 생성된 객체를 DB 세션에 추가합니다.
        db.add(new_training_record)

        # 변경사항을 DB에 최종적으로 커밋(저장)합니다.
        await db.commit()

        # 성공 응답을 반환합니다.
        return SuccessResponse()

    except Exception as e:
        # DB 작업 중 에러가 발생하면 롤백하여 데이터 일관성을 유지합니다.
        await db.rollback()
        # 실제 운영 환경에서는 로깅(logging)을 통해 에러를 기록하는 것이 좋습니다.
        print(f"심화 훈련 결과 저장 실패: {e}")
        # 적절한 에러를 발생시켜 라우터에서 처리하도록 합니다.
        raise BackEndInternalError("데이터베이스 저장 중 오류가 발생했습니다.")


async def process_check_status(
    db: AsyncSession, record_id: int, current_user: dict
) -> UploadStatusResponse:
    """
    db에서 record_id에 해당하는 status를 확인해 iot에 상태를 보냅니다.
    """
    statement = select(VoiceRecord).where(VoiceRecord.id == record_id)
    result = await db.execute(statement)
    record = result.scalars().first()
    
    if record.patient_id != int(current_user.get("account_id")):
        raise PermissionDeniedError("접근 권한이 없습니다.")
    
    if not record:
        raise NotFoundError("해당 음성 기록을 찾을 수 없습니다.")
    
    return UploadStatusResponse(status=record.status)

async def generate_download_url_for_doctor(
    db: AsyncSession,
    s3_client: botocore.client.BaseClient,
    record_id: int,
    doctor_id: int,
) -> str:
    """
    환자 본인의 음성 파일 다운로드 URL을 생성합니다.
    """
    # 1. record_id로 VoiceRecord 조회 
    record = await db.get(VoiceRecord, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID가 {record_id}인 레코드를 찾을 수 없습니다."
        )


    # 2. 새로운 소유권 확인
    patient_id = record.patient_id
    statement = select(PatientDoctorAccess).where(
    PatientDoctorAccess.doctor_id == doctor_id,
    PatientDoctorAccess.patient_id == patient_id,
    PatientDoctorAccess.connection_status == ConnectionStatusEnum.APPROVED
    )
    connection_result = await db.execute(statement)
    connection = connection_result.scalars().first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="해당 환자의 데이터에 접근할 권한이 없습니다."
        )

    
    # 3. S3 키 생성
    s3_key = record.file_path
    
    # 4. Presigned URL 생성
    download_url = await create_download_presigned_url(
        s3_client,
        s3_key,
    )

    return download_url



