import asyncio
import tempfile
import os
import botocore
import httpx
from app import db, storage
from app.services.features_service import flatten_ah_features
from padoc_common.models import Account, AhFeatures, SentenceFeatures
from padoc_common.exceptions import PermissionDeniedError, BackEndInternalError, NotFoundError
from padoc_common.models.enums import FileStatusEnum, RecordingTypeEnum
from botocore.exceptions import ClientError
from sqlalchemy.ext.asyncio import AsyncSession
from padoc_common.models.voice_records import VoiceRecord
from padoc_common.schemas.training import (
    BasicTrainingUploadRequest,
    TrainingBasicUploadResponse,
    AdvancedTrainingResultResponse,
    UploadStatusResponse
)
from padoc_common.schemas.features import AhFeatures as WrappedAhFeatures
from sqlmodel import select
from app.db import AsyncSessionMaker

from app.services.training_service import DEFAULT_EXPIRES_IN, update_voice_record_status,S3_BUCKET_NAME

# 파일 확인 프로토타입 코드
"""
TODO: 파일 상태를 백엔드 내부의 별도의 스레드로 확인하는 프로토타입 코드입니다
추후 시스템 설계에서 메세지 큐 및 워커를 활용한 기능으로 대체될 예정입니다.
"""    


def check_s3_file_exists(s3_client, bucket_name: str, s3_key: str) -> bool:
    """
    주어진 S3 키(경로)에 파일이 존재하는지 확인합니다.

    Args:
        s3_client: Boto3 S3 클라이언트 객체입니다.
        bucket_name: 파일이 저장된 S3 버킷의 이름입니다.
        s3_key: 확인할 파일의 키(경로)입니다.

    Returns:
        파일이 존재하면 True, 그렇지 않으면 False를 반환합니다.
    """
    try:
        # head_object는 파일의 메타데이터를 요청합니다.
        # 파일이 존재하면 성공적으로 메타데이터를 반환합니다.
        s3_client.head_object(Bucket=bucket_name, Key=s3_key)
        return True
    except ClientError as e:
        # head_object는 파일이 없을 때 '404' 에러 코드를 포함한 ClientError를 발생시킵니다.
        if e.response['Error']['Code'] == '404':
            return False
        else:
            # 그 외 다른 에러(예: 접근 권한 없음)가 발생한 경우
            print(f"S3 확인 중 에러 발생: {e}")
            raise

# --- 사용법 ---
# s3 = boto3.client('s3')
# BUCKET = 'your-bucket-name'
# KEY = 'path/to/your/file.wav'

# if check_s3_file_exists(s3, BUCKET, KEY):
#     print(f"파일 '{KEY}'가 S3 버킷 '{BUCKET}'에 존재합니다.")
# else:
#     print(f"파일 '{KEY}'를 찾을 수 없습니다.")

from operator import __not__
from fastapi import BackgroundTasks, Depends

import time
import threading

MODEL_SERV_URL = os.getenv("MODEL_SERV_URL", "http://127.0.0.1:8001/")

async def process_voice_features(
    db: AsyncSession,
    s3_client: botocore.client.BaseClient,
    record_id: int,
):
    """
    음성 파일의 특징을 추출하고 데이터베이스에 저장합니다.

    1. voice_record 테이블에서 record_id로 S3 키를 가져옵니다.
    2. S3에서 음성 데이터를 다운로드합니다.
    3. 음성 타입에 따라 Praat 서비스로 특징을 추출합니다.
    4. 추출된 특징을 해당 특징 테이블에 저장하고 voice_record에 연결합니다.
    """
    # 1. voice_record 정보 가져오기
    record = await db.get(VoiceRecord, record_id)
    if not record:
        raise NotFoundError(f"음성 기록(ID: {record_id})을 찾을 수 없습니다.")

    # 파일 상태를 처리 중으로 변경
    await update_voice_record_status(db, record_id, FileStatusEnum.PROCESSING)

    try:
        # 2. S3에서 데이터 다운로드
        s3_key = record.file_path
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        # 파일 내용(content)과 메타데이터(metadata)를 분리해서 가져옵니다.
        voice_data = response["Body"].read()   # 파일 내용은 bytes로 정상적으로 읽기
        content_type = response['ContentType'] # 콘텐츠 타입은 S3 응답 정보에서 가져오기

        # 파일 이름은 S3 key(전체 경로)에서 추출합니다.
        filename = os.path.basename(s3_key)  # 예: "audios/my_voice.wav" -> "my_voice.wav"

        # 위에서 구한 3가지 정보로 files 딕셔너리를 다시 구성합니다.
        files = {'voice_file': (filename, voice_data, content_type)}


        async with httpx.AsyncClient() as client:
            # 3. 음성 타입에 따라 특징 추출
            if record.type == RecordingTypeEnum.voice_ah:
                # 'ah' 특징 추출 (nested schema)
                features_dict = (await client.post(MODEL_SERV_URL+"/ah-features", files=files, timeout=30.0)).json()
                # model_validate 메서드를 사용해 Pydantic 모델 객체 생성
                features_dict = WrappedAhFeatures.model_validate(features_dict)
                features_dict = flatten_ah_features(features_dict)
                # 특징 테이블에 저장
                new_ah_features = AhFeatures(
                    record_id=record.id,
                    **(features_dict.model_dump())
                )
                db.add(new_ah_features)
            elif record.type == RecordingTypeEnum.voice_sentence:
                # 문장 특징 추출
                features_dict = (await client.post(MODEL_SERV_URL+"/sentence-features", files=files, timeout=30.0)).json()

                if features_dict is None:
                    raise ValueError("특징 추출 함수(praat_sentence_real)가 실패하여 None을 반환했습니다.")
                
                # 4. 특징 테이블에 저장
                new_sentence_features = SentenceFeatures(
                    record_id=record.id,
                    **features_dict
                )
                db.add(new_sentence_features)
            else:
                # 지원하지 않는 타입이면 실패 처리
                raise ValueError(f"Unsupported recording type: {record.type}")

        # 변경사항 커밋
        await db.commit()

        # 파일 상태를 완료로 변경
        await update_voice_record_status(db, record_id, FileStatusEnum.COMPLETED)

    except Exception as e:
        # 에러 발생 시 롤백 및 상태 변경
        await db.rollback()
        await update_voice_record_status(db, record_id, FileStatusEnum.FAILED)
        # 에러 로깅 또는 재발생
        print(f"특징 추출 실패 (record_id: {record_id}): {e}")
        raise BackEndInternalError("특징 추출 과정에서 오류가 발생했습니다.")


# BackgroundTasks에서 실행될 비동기 폴링 함수
async def poll_s3_file_status(
    s3_client,
    s3_key: str,
    record_id: int,
    interval_seconds: int = 5,
    timeout_seconds: int = DEFAULT_EXPIRES_IN, # 5분
    bucket_name: str = S3_BUCKET_NAME,
):
    """
    S3 파일 존재 여부를 비동기적으로 폴링하고, 파일이 발견되면 후속 처리를 시작합니다.
    이 함수는 BackgroundTasks에 의해 실행됩니다.
    """
    start_time = time.time()
    
    # BackgroundTasks는 의존성 주입을 지원하지 않으므로, DB 세션을 직접 생성합니다.
    async with AsyncSessionMaker() as db:
        while time.time() - start_time < timeout_seconds:
            if check_s3_file_exists(s3_client, bucket_name, s3_key):
                print(f"파일 발견! '{s3_key}' 업로드 완료. 후속 처리 시작...")
                # 1. 상태를 UPLOAD_COMPLETED로 변경
                await update_voice_record_status(db, record_id, FileStatusEnum.UPLOAD_COMPLETED)
                # 2. 특징 추출 및 분석 작업 실행
                await process_voice_features(db, s3_client, record_id)
                return  # 성공적으로 처리 후 함수 종료

            # time.sleep() 대신 asyncio.sleep()을 사용해야 이벤트 루프를 막지 않습니다.
            await asyncio.sleep(interval_seconds)
        
        # Timeout 발생 시
        print(f"⌛️ 시간 초과. {timeout_seconds}초 내에 파일을 찾지 못했습니다.")
        await update_voice_record_status(db, record_id, FileStatusEnum.FAILED)

# 프로토타입 코드는 여기까지