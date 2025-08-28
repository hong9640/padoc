
from typing import Optional, Union

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from padoc_common.exceptions import BackEndInternalError
from padoc_common.models import (
    Account,
    Doctor,
    Patient,
)
from padoc_common.models.enums import UserRoleEnum
from padoc_common.schemas.profile import DoctorWithAccountId, PatientWithAccountId, UpdateProfileRequest


async def get_profile(
    db: AsyncSession, account_id: int, role: UserRoleEnum
) -> Optional[Union[PatientWithAccountId, DoctorWithAccountId]]:
    """사용자 ID와 역할을 통해 프로필 정보를 조회합니다.

    Account 정보와 역할에 따른(Patient/Doctor) 상세 정보를 조합하여 반환합니다.

    Args:
        db: 데이터베이스 세션입니다.
        account_id: 조회할 사용자의 계정 ID입니다.
        role: 사용자의 역할 (PATIENT 또는 DOCTOR) 입니다.

    Raises:
        BackEndInternalError: role이 유효하지 않을 경우 발생합니다.

    Returns:
        조합된 프로필 정보 스키마 객체(PatientWithAccountId 또는 DoctorWithAccountId)를 반환합니다.
        해당하는 사용자가 없으면 None을 반환합니다.
    """
    if role == UserRoleEnum.PATIENT:
        statement = (
            select(Account, Patient)
            .join(Patient, Account.id == Patient.account_id)
            .where(Patient.account_id == account_id)
        )
    elif role == UserRoleEnum.DOCTOR:
        statement = (
            select(Account, Doctor)
            .join(Doctor, Account.id == Doctor.account_id)
            .where(Doctor.account_id == account_id)
        )
    else:
        raise BackEndInternalError("잘못된 역할이 입력되었습니다.")
    
    result = (await db.execute(statement)).first()
    if not result:
        return None

    account_data, specific_profile_data = result

    # 두 객체의 데이터를 합쳐서 완전한 profile_data를 만듦
    full_profile_data = {**account_data.model_dump(), **specific_profile_data.model_dump()}

    if role == UserRoleEnum.DOCTOR:
        return DoctorWithAccountId(**full_profile_data)
    elif role == UserRoleEnum.PATIENT:
        return PatientWithAccountId(**full_profile_data)


async def update_profile(
    db: AsyncSession,
    account_id: int,
    role: UserRoleEnum,
    update_data: UpdateProfileRequest,
) -> Optional[Union[Patient, Doctor]]:
    """사용자의 프로필 정보를 수정하고, 성공 시 업데이트된 객체를 반환합니다.

    공통 정보는 Account 모델에서, 역할별 상세 정보는 Patient 또는 Doctor 모델에서 수정합니다.

    Args:
        db: 데이터베이스 세션입니다.
        account_id: 수정할 사용자의 계정 ID입니다.
        role: 사용자의 역할 (PATIENT 또는 DOCTOR) 입니다.
        update_data: 수정할 정보가 담긴 스키마 객체입니다.

    Raises:
        BackEndInternalError: role이 유효하지 않을 경우 발생합니다.

    Returns:
        성공적으로 업데이트된 Patient 또는 Doctor 객체를 반환합니다.
        프로필을 찾지 못한 경우 None을 반환합니다.
    """
    # 역할을 기반으로 수정할 프로필 객체를 조회합니다.
    if role == UserRoleEnum.PATIENT:
        statement = (
            select(Patient)
            .where(Patient.account_id == account_id)
            .options(selectinload(Patient.account))
        )
    elif role == UserRoleEnum.DOCTOR:
        statement = (
            select(Doctor)
            .where(Doctor.account_id == account_id)
            .options(selectinload(Doctor.account))
        )
    else:
        raise BackEndInternalError("잘못된 역할이 입력되었습니다.")

    entity_object = (await db.execute(statement)).scalars().first()

    if not entity_object:
        return None  # Profile not found

    # 1. entity_object에 연결된 Account 객체를 가져옵니다.
    account = entity_object.account
    if not account:
        return None

    # 2. 업데이트할 데이터를 사전(dict) 형태로 변환합니다.
    update_dict = update_data.model_dump(exclude_unset=True)

    # 3. 공통 정보(Account)와 역할별 정보(Patient/Doctor)를 순회하며 업데이트합니다.
    for key, value in update_dict.items():
        if hasattr(account, key):
            setattr(account, key, value)
        elif hasattr(entity_object, key):
            setattr(entity_object, key, value)

    # 4. 변경된 내용을 세션에 추가하고 DB에 커밋합니다.
    db.add(account)
    db.add(entity_object)
    await db.commit()

    # 5. DB의 최신 정보로 객체를 갱신합니다.
    await db.refresh(account)
    await db.refresh(entity_object)
    
    return entity_object