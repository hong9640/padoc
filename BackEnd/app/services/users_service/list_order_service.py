# app/services/users_service/list_order_service.py
import logging
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from padoc_common.models import DoctorPatientViewSetting, PatientDoctorAccess
from padoc_common.models.enums import ConnectionStatusEnum, UserRoleEnum
from padoc_common.exceptions import PermissionDeniedError
from padoc_common.schemas.list_order import PatientOrder
from app.services.users_service.connection_service import get_connection_list


async def _init_patient_order(db: AsyncSession, doctor_id: int) -> PatientOrder:
    """의사의 환자 목록 순서를 최초로 생성하고 저장합니다.

    현재 의사와 연결된 환자 목록을 기반으로 기본 순서를 생성하여 DB에 저장한 후,
    생성된 순서 정보를 반환합니다. 내부적으로만 사용되는 헬퍼 함수입니다.

    Args:
        db: 데이터베이스 세션입니다.
        doctor_id: 순서를 초기화할 의사의 계정 ID입니다.

    Returns:
        새롭게 생성되고 저장된 PatientOrder 스키마 객체를 반환합니다.
    """
    connection_list = await get_connection_list(db, doctor_id, UserRoleEnum.DOCTOR)
    patient_order = PatientOrder(
        patient_order=[connection.patient_id for connection in connection_list]
    )

    view_setting_stmt = select(DoctorPatientViewSetting).where(
        DoctorPatientViewSetting.doctor_id == doctor_id
    )
    view_setting = (await db.execute(view_setting_stmt)).scalars().first()

    if not view_setting:
        view_setting = DoctorPatientViewSetting(doctor_id=doctor_id)
        db.add(view_setting)

    view_setting.connected_patient_order = patient_order.patient_order

    await db.commit()
    return patient_order


async def get_patient_order(db: AsyncSession, doctor_id: int) -> PatientOrder:
    """의사의 환자 목록 순서를 조회하고, 최신 연결 상태와 동기화합니다.

    만약 저장된 순서 정보가 없다면, 현재 연결된 환자 목록을 기반으로
    기본 순서를 생성하고 저장한 뒤 그 결과를 반환합니다.
    
    저장된 순서가 있더라도 실제 연결 상태와 다를 경우(새 환자 추가/삭제),
    자동으로 목록을 동기화하여 최신 상태를 유지합니다.

    Args:
        db: 데이터베이스 세션입니다.
        doctor_id: 환자 목록 순서를 조회할 의사의 계정 ID입니다.

    Returns:
        저장되어 있거나 새로 생성/동기화된 PatientOrder 스키마 객체를 반환합니다.
    """
    statement = select(DoctorPatientViewSetting).where(
        DoctorPatientViewSetting.doctor_id == doctor_id
    )
    current_view_setting = (await db.execute(statement)).scalars().first()
    
    # 설정이 없으면 새로 생성하여 반환
    if not current_view_setting:
        return await _init_patient_order(db, doctor_id)

    # 현재 승인된 환자 목록을 DB에서 조회
    connection_list = await get_connection_list(db, doctor_id, UserRoleEnum.DOCTOR)
    approved_patient_ids = [connection.patient_id for connection in connection_list]

    # 저장된 순서와 실제 승인된 목록이 다를 경우 동기화 수행
    if set(current_view_setting.connected_patient_order or []) != set(approved_patient_ids):
        saved_order_set = set(current_view_setting.connected_patient_order or [])
        approved_set = set(approved_patient_ids)

        ids_to_add = list(approved_set - saved_order_set)
        ids_to_remove = saved_order_set - approved_set

        synced_order = [
            pid
            for pid in current_view_setting.connected_patient_order
            if pid not in ids_to_remove
        ]
        synced_order.extend(ids_to_add)

        current_view_setting.connected_patient_order = synced_order

        await db.commit()
        await db.refresh(current_view_setting)
    
    return PatientOrder(patient_order=current_view_setting.connected_patient_order)


async def update_patient_order(
    db: AsyncSession, doctor_id: int, new_order: List[int]
) -> None:
    """의사의 환자 목록 순서를 사용자가 원하는 순서로 업데이트합니다.

    제공된 새로운 순서(new_order)가 현재 의사와 'APPROVED' 상태인
    환자 목록 전체와 정확히 일치하는지 검증 후 업데이트를 수행합니다.

    Args:
        db: 데이터베이스 세션입니다.
        doctor_id: 순서를 업데이트할 의사의 계정 ID입니다.
        new_order: 새롭게 정렬된 환자 계정 ID의 리스트입니다.

    Raises:
        PermissionDeniedError: new_order 리스트가 실제 승인된 환자 목록과 일치하지 않을 경우 발생합니다.
        
    Returns:
        None
    """
    # 1. 의사와 연결된 'APPROVED' 상태의 모든 환자 ID를 조회합니다.
    approved_patients_stmt = (
        select(PatientDoctorAccess.patient_id)
        .where(PatientDoctorAccess.doctor_id == doctor_id)
        .where(PatientDoctorAccess.connection_status == ConnectionStatusEnum.APPROVED)
    )
    approved_patient_ids = (await db.execute(approved_patients_stmt)).scalars().all()

    # 2. new_order의 모든 patient_id가 approved_patient_ids에 포함되어 있는지 확인합니다.
    if set(new_order) != set(approved_patient_ids):
        logging.error(f"환자 목록 불일치: 요청된 목록={new_order}, 승인된 목록={approved_patient_ids}")
        raise PermissionDeniedError("제공된 환자 목록이 실제 승인된 환자 목록과 일치하지 않습니다.")

    # 3. DoctorPatientViewSetting을 조회하거나 새로 생성합니다.
    view_setting_stmt = select(DoctorPatientViewSetting).where(
        DoctorPatientViewSetting.doctor_id == doctor_id
    )
    view_setting = (await db.execute(view_setting_stmt)).scalars().first()

    if not view_setting:
        view_setting = DoctorPatientViewSetting(doctor_id=doctor_id)
        db.add(view_setting)

    # 4. 순서를 업데이트하고 커밋합니다.
    view_setting.connected_patient_order = new_order

    await db.commit()
    await db.refresh(view_setting)