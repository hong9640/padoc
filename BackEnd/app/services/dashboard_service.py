# app/services/dashboard_service.py

from datetime import date, timedelta
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from padoc_common.models.voice_records import VoiceRecord
from padoc_common.models.advanced_training_informations import AdvancedTrainingInformation


async def get_patient_training_history(
    db: AsyncSession,
    patient_id: int,
    start_date: date,
    end_date: date,
) -> List[AdvancedTrainingInformation]:
    """
    특정 환자의 심화 훈련 기록을 기간에 따라 조회합니다.

    Args:
        db: 데이터베이스 세션입니다.
        patient_id: 조회할 환자의 ID (account_id)입니다.
        start_date: 조회 시작일입니다.
        end_date: 조회 종료일입니다.

    Returns:
        조회된 심화 훈련 기록(AdvancedTrainingInformation)의 리스트입니다.
    """
    statement = (
        select(AdvancedTrainingInformation)
        .where(AdvancedTrainingInformation.patient_id == patient_id)
        .order_by(AdvancedTrainingInformation.created_at.desc())
    )
    if start_date and end_date:
        end_date_inclusive = end_date + timedelta(days=1)
        statement = statement.where(
            AdvancedTrainingInformation.created_at >= start_date,
            AdvancedTrainingInformation.created_at < end_date_inclusive
        )


    # 1. DB에서 원본 데이터 조회
    training_history_from_db = (await db.execute(statement)).scalars().all()

    # 2. API 스키마 형식에 맞게 데이터를 가공할 빈 리스트 생성
    processed_history = []

    # 3. DB에서 가져온 각 레코드를 순회하며 가공
    for record in training_history_from_db:
        # a. 먼저 DB 모델을 딕셔너리로 변환합니다.
        record_dict = record.model_dump()

        # b. API 스키마에 맞게 'date' 키를 추가하고, 'created_at'의 날짜 부분을 할당합니다.
        record_dict["date"] = record.created_at.isoformat()

        # c. API 스키마에 없는 'created_at' 키는 제거합니다.
        del record_dict["created_at"]

        # d. 가공된 딕셔너리를 리스트에 추가합니다.
        processed_history.append(record_dict)
    return processed_history


async def get_patient_voice_records(
    db: AsyncSession,
    patient_id: int,
    start_date: date,
    end_date: date,
) -> List[VoiceRecord]:
    """
    의사가 특정 환자의 음성 기록 및 분석 데이터를 기간에 따라 조회합니다.

    Args:
        db: 데이터베이스 세션입니다.
        patient_id: 조회할 환자의 ID (account_id)입니다.
        start_date: 조회 시작일입니다.
        end_date: 조회 종료일입니다.

    Returns:
        음성 기록(VoiceRecord) 및 관련 분석 데이터가 포함된 리스트입니다.
    """
    statement = (
        select(VoiceRecord)
        .options(
            selectinload(VoiceRecord.ah_features),
            selectinload(VoiceRecord.sentence_features),
        )
        .where(VoiceRecord.patient_id == patient_id)
        .order_by(VoiceRecord.created_at.desc())
    )

    if start_date and end_date:
        end_date_inclusive = end_date + timedelta(days=1)
        statement = statement.where(
            VoiceRecord.created_at >= start_date,
            VoiceRecord.created_at < end_date_inclusive
        )

    result = await db.execute(statement)
    return list(result.scalars().all())
