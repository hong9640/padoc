import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, List

from fastapi import HTTPException, Depends, status
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.db import get_session
from padoc_common.exceptions import BadRequestError, BackEndInternalError
from padoc_common.models import (
    CalendarEvent,
)
from padoc_common.models.enums import UserRoleEnum
from padoc_common.schemas.profile import DoctorWithAccountId, PatientWithAccountId
from padoc_common.schemas.schedule import ScheduleCreate, ScheduleDate


async def get_schedules_by_patient_id(
    db: AsyncSession, patient_id: int
) -> List[ScheduleDate]:
    """
    환자 ID로 모든 스케줄을 조회하고, ScheduleDate 스키마 리스트로 변환하여 반환합니다.

    Args:
        db: 데이터베이스 세션입니다.
        patient_id: 스케줄을 조회할 환자의 계정 ID입니다.

    Returns:
        조회된 스케줄 정보를 ScheduleDate 형태로 변환한 리스트를 반환합니다.
    """
    # 1. select 구문에서 필요한 컬럼만 선택하고, .label()로 별칭을 부여합니다.
    statement = (
        select(
            CalendarEvent.id.label("schedule_id"),
            CalendarEvent.event_date.label("date"),
        )
        .where(CalendarEvent.patient_id == patient_id)
        .order_by(CalendarEvent.event_date.asc())
    )
    
    result = await db.execute(statement)
    
    # 2. .mappings()를 사용하여 결과를 딕셔너리 리스트로 가져옵니다.
    schedules_from_db = result.mappings().all()

    # 3. 딕셔너리 리스트를 ScheduleDate 스키마 리스트로 직접 변환합니다.
    return [ScheduleDate(**row) for row in schedules_from_db]


async def create_schedule(
    db: AsyncSession, patient_id: int, schedule_data: ScheduleCreate
) -> CalendarEvent:
    """새로운 스케줄을 생성하고 데이터베이스에 추가합니다.

    Args:
        db: 데이터베이스 세션입니다.
        patient_id: 스케줄을 생성할 환자의 계정 ID입니다.
        schedule_data: 생성할 스케줄의 날짜 정보가 담긴 스키마 객체입니다.

    Raises:
        BadRequestError: 해당 날짜에 이미 스케줄이 존재하는 경우 발생합니다.
        BackEndInternalError: 데이터베이스 저장 과정에서 오류가 발생한 경우입니다.

    Returns:
        성공적으로 생성된 CalendarEvent 객체를 반환합니다.
    """
    statement = (
        select(CalendarEvent)
        .where(CalendarEvent.patient_id == patient_id)
        .where(CalendarEvent.event_date == schedule_data.date)
    )
    result = await db.execute(statement)

    # .first()를 호출하여 실제 데이터 행(row)을 가져옵니다.
    # 조회된 데이터가 없으면 existing_event는 None이 됩니다.
    existing_event = result.scalars().first()

    # 가져온 데이터 행이 존재하는지(None이 아닌지) 확인합니다.
    if existing_event:
        raise BadRequestError("이미 예약된 날짜입니다.")
    try:
        new_schedule = CalendarEvent(
            patient_id=patient_id, event_date=schedule_data.date
        )

        db.add(new_schedule)
        await db.commit()
        await db.refresh(new_schedule)
        
        return new_schedule

    except Exception:
        await db.rollback()
        raise BackEndInternalError("스케줄 생성에 실패했습니다.")


async def delete_schedule(db: AsyncSession, patient_id: int, schedule_id: int) -> None:
    """환자의 특정 스케줄을 삭제합니다.

    Args:
        db: 데이터베이스 세션입니다.
        patient_id: 스케줄을 삭제할 환자의 계정 ID입니다.
        schedule_id: 삭제할 스케줄의 고유 ID입니다.

    Raises:
        BadRequestError: 삭제할 스케줄을 찾을 수 없거나, 해당 환자의 스케줄이 아닐 경우 발생합니다.
    
    Returns:
        None
    """
    # 1. 삭제할 스케줄을 ID로 조회합니다.
    statement = (
        select(CalendarEvent)
        .where(CalendarEvent.patient_id == patient_id)
        .where(CalendarEvent.id == schedule_id)
    )
    schedule_to_delete = (await db.execute(statement)).scalars().first()

    # 2. 스케줄이 존재하지 않으면 에러를 발생시킵니다.
    if schedule_to_delete is None:
        raise BadRequestError("삭제할 스케줄을 찾을 수 없습니다.")

    # 3. 모든 검증을 통과하면 DB에서 삭제를 진행합니다.
    await db.delete(schedule_to_delete)
    await db.commit()
