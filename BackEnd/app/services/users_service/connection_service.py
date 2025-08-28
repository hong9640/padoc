# app/services/users_service/connection_service.py
"""의사-환자 연결 관련 서비스 로직"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import aliased

from padoc_common.models.patient_doctor_access import PatientDoctorAccess
from padoc_common.models.enums import UserRoleEnum, ConnectionStatusEnum
from padoc_common.models import Doctor, Patient, Account

from padoc_common.exceptions import AlreadyConnectedError, BadRequestError
import padoc_common.exceptions as exc

from padoc_common.schemas.connection import Connection


async def check_connection(db: AsyncSession, doctor_id: int, patient_id: int) -> bool:
    """의사와 환자 간에 승인된(APPROVED) 연결이 존재하는지 확인합니다.

    Args:
        db: 데이터베이스 세션입니다.
        doctor_id: 의사의 계정 ID (account_id) 입니다.
        patient_id: 환자의 계정 ID (account_id) 입니다.

    Returns:
        승인된 연결이 존재하면 True, 그렇지 않으면 False를 반환합니다.
    """
    statement = (
        select(PatientDoctorAccess)
        .where(PatientDoctorAccess.doctor_id == doctor_id)
        .where(PatientDoctorAccess.patient_id == patient_id)
        .where(PatientDoctorAccess.connection_status == ConnectionStatusEnum.APPROVED)
    )

    connection = (await db.execute(statement)).first()

    return connection is not None


async def get_connection_list(
    db: AsyncSession, account_id: int, role: UserRoleEnum
) -> list[Connection]:
    """주어진 사용자 ID와 역할에 따라 모든 연결 목록을 이름과 함께 조회합니다.

    Args:
        db: 데이터베이스 세션입니다.
        account_id: 조회할 사용자의 계정 ID입니다.
        role: 사용자의 역할 (doctor 또는 patient) 입니다.

    Returns:
        이름 정보가 추가된 Connection 뷰 모델 객체의 리스트를 반환합니다.
    """

    # 1. Account 모델에 대한 두 개의 별칭(alias)을 생성합니다.
    PatientAccount = aliased(Account, name="patient_account")
    DoctorAccount = aliased(Account, name="doctor_account")

    # 기본 SELECT 문: 필요한 모든 정보를 JOIN으로 가져옴
    statement = (
        select(
            PatientDoctorAccess,
            PatientAccount.full_name.label("patient_name"),
            DoctorAccount.full_name.label("doctor_name"),
        )
        .join(PatientAccount, PatientDoctorAccess.patient_id == PatientAccount.id)
        .join(DoctorAccount, PatientDoctorAccess.doctor_id == DoctorAccount.id)
        .where(
            PatientDoctorAccess.connection_status.in_(
                [ConnectionStatusEnum.APPROVED, ConnectionStatusEnum.PENDING]
            )
        )
    )

    # 역할에 따라 WHERE 조건 추가
    if role == UserRoleEnum.DOCTOR:
        statement = statement.where(PatientDoctorAccess.doctor_id == account_id)
    elif role == UserRoleEnum.PATIENT:
        statement = statement.where(PatientDoctorAccess.patient_id == account_id)
    else:
        raise exc.BadRequestError("잘못된 역할입니다.")

    # 단 한 번의 DB 쿼리 실행
    results = (await db.execute(statement)).all()

    # 메모리에서 데이터 조합 (DB 부하 없음)
    connections = []
    for pda, patient_name, doctor_name in results:
        # PatientDoctorAccess 객체를 딕셔너리로 변환
        connection_data = pda.model_dump()

        # Connection 뷰 모델 생성
        connections.append(
            Connection(
                **connection_data, patient_name=patient_name, doctor_name=doctor_name
            )
        )

    return connections


async def create_connection_request(
    db: AsyncSession, *, doctor_id: int, patient_id: int
) -> PatientDoctorAccess:
    """의사가 환자에게 연결을 요청하여 'PENDING' 상태의 연결을 생성합니다.

    Args:
        db: 데이터베이스 세션입니다.
        doctor_id: 연결을 요청하는 의사의 계정 ID입니다.
        patient_id: 연결을 요청받는 환자의 계정 ID입니다.

    Raises:
        AlreadyConnectedError: 두 사용자 간에 이미 연결 관계가 존재하는 경우 발생합니다.

    Returns:
        새롭게 생성된 PatientDoctorAccess 객체를 반환합니다.
    """
    # 1. 두 사용자 간에 어떤 상태로든 연결이 이미 존재하는지 확인
    existing = await _get_connection_by_ids(
        db, doctor_id=doctor_id, patient_id=patient_id
    )
    if existing:
        if existing.connection_status == ConnectionStatusEnum.APPROVED:
            raise AlreadyConnectedError("이미 승인된 연결입니다.")
        elif existing.connection_status == ConnectionStatusEnum.PENDING:
            raise AlreadyConnectedError("이미 요청 중인 연결입니다.")
        else:
            existing.connection_status = ConnectionStatusEnum.PENDING
            await db.commit()
            await db.refresh(existing)
            return existing
    else:
        # 2. 새로운 연결 요청 객체 생성 (기본 상태: PENDING)
        new_connection = PatientDoctorAccess(
            doctor_id=doctor_id,
            patient_id=patient_id,
            connection_status=ConnectionStatusEnum.PENDING,
        )

        # 3. DB에 추가 및 저장
        db.add(new_connection)
        await db.commit()
        await db.refresh(new_connection)

        return new_connection


async def update_connection_status(
    db: AsyncSession, *, connection_id: int, new_status: ConnectionStatusEnum
) -> PatientDoctorAccess:
    """특정 연결의 상태를 변경합니다 (예: PENDING -> APPROVED).

    Args:
        db: 데이터베이스 세션입니다.
        connection_id: 상태를 변경할 연결의 고유 ID입니다.
        new_status: 변경할 새로운 연결 상태입니다.

    Raises:
        BadRequestError: 주어진 connection_id에 해당하는 연결이 존재하지 않을 경우 발생합니다.

    Returns:
        상태가 변경된 후의 PatientDoctorAccess 객체를 반환합니다.
    """
    # 1. ID를 기반으로 기존 연결 정보 조회
    connection_to_update = await db.get(PatientDoctorAccess, connection_id)
    if not connection_to_update:
        raise BadRequestError(f"Connection with ID {connection_id} not found.")

    # 2. 상태 변경 및 DB에 반영
    connection_to_update.connection_status = new_status
    await db.commit()
    await db.refresh(connection_to_update)

    return connection_to_update


async def verify_connection_ownership(
    db: AsyncSession, *, user_id: int, role: UserRoleEnum, connection_id: int
) -> Optional[PatientDoctorAccess]:
    """주어진 connection_id가 해당 사용자의 소유가 맞는지 확인합니다.

    Args:
        db: 데이터베이스 세션입니다.
        user_id: 현재 요청을 보낸 사용자의 계정 ID입니다.
        role: 현재 요청을 보낸 사용자의 역할입니다.
        connection_id: 확인할 연결의 고유 ID입니다.

    Returns:
        소유권이 확인되면 해당 PatientDoctorAccess 객체를 반환하고,
        연결이 존재하지 않거나 소유권이 없으면 None을 반환합니다.
    """
    # 1. ID로 해당 연결 정보를 먼저 조회합니다.
    connection = await db.get(PatientDoctorAccess, connection_id)

    # 2. 연결 정보가 없으면 바로 None을 반환합니다.
    if not connection:
        return None

    # 3. 역할에 따라 소유권 확인
    ownership_verified = False
    if role == UserRoleEnum.DOCTOR:
        # 사용자가 의사일 경우, 연결의 doctor_id와 일치하는지 확인
        if connection.doctor_id == user_id:
            ownership_verified = True
    elif role == UserRoleEnum.PATIENT:
        # 사용자가 환자일 경우, 연결의 patient_id와 일치하는지 확인
        if connection.patient_id == user_id:
            ownership_verified = True

    # 4. 소유권이 확인되면 연결 객체를, 그렇지 않으면 None을 반환합니다.
    return connection if ownership_verified else None


# --- 보조 함수 ---


async def _get_connection_by_ids(
    db: AsyncSession, *, doctor_id: int, patient_id: int
) -> Optional[PatientDoctorAccess]:
    """ID를 기반으로 특정 의사-환자 연결 정보를 조회합니다.

    이 함수는 내부적으로만 사용되므로 함수명을 언더스코어(_)로 시작합니다.

    Args:
        db: 데이터베이스 세션입니다.
        doctor_id: 의사의 계정 ID입니다.
        patient_id: 환자의 계정 ID입니다.

    Returns:
        조회된 PatientDoctorAccess 객체 또는 존재하지 않을 경우 None을 반환합니다.
    """
    statement = (
        select(PatientDoctorAccess)
        .where(PatientDoctorAccess.doctor_id == doctor_id)
        .where(PatientDoctorAccess.patient_id == patient_id)
    )
    return (await db.execute(statement)).scalars().first()
