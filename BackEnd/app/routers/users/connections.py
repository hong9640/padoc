# app/routers/users/connections.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from padoc_common.exceptions import PermissionDeniedError
import padoc_common.exceptions as exc
from app.db import get_session

from padoc_common.models.enums import ConnectionStatusEnum, UserRoleEnum

from padoc_common.schemas.base import SuccessResponse, ErrorResponse
from padoc_common.schemas.connection import (
    UpdateConnectionStatus,
    ConnectionList,
    ConnectionRequestPayload,
)
from app.services import auth_service
from app.services.users_service import connection_service

router = APIRouter(
    prefix="/connections",
    tags=["connections"],
)


@router.get(
    "",
    response_model=ConnectionList,
    status_code=status.HTTP_200_OK,
    summary="연결된/대기 중인 사용자 목록 조회",
    responses={500: {"model": ErrorResponse, "description": "연결 목록 조회 실패"}},
)
async def get_connections(
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    """
    현재 로그인된 사용자(환자 또는 의사)의 연결된 또는 대기 중인 사용자 목록을 조회합니다.
    """
    # 1. 세션 정보를 바탕으로 유저 정보 파싱하여 account_id와 role 확인
    account_id = session_info.get("account_id")
    role = session_info.get("role")

    # 2. 해당 세션 정보를 통해 db에서 연결 또는 대기 중인 사용자 목록 조회
    connections = await connection_service.get_connection_list(
        db, account_id=account_id, role=role
    )
    # 3. DB 데이터를 응답 형식에 맞춰 전송
    return ConnectionList(connections=connections)


@router.post(
    "/requests",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="의사가 환자에게 연결 요청",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        409: {"model": ErrorResponse, "description": "이미 연결된 환자"},
        500: {"model": ErrorResponse, "description": "연결 요청 실패"},
    },
)
async def request_connection(
    payload: ConnectionRequestPayload,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    """
    의사가 환자에게 데이터 열람 연결을 요청합니다.
    """
    # 1. 세션 정보를 바탕으로 유저 정보 파싱하여 account_id와 role 확인
    account_id = session_info.get("account_id")
    role = session_info.get("role")

    if account_id is None:
        raise exc.BackEndInternalError("시스템 에러")

    # 예외: 의사 계정에서 보낸 요청이 아닌 경우
    if role != UserRoleEnum.DOCTOR:
        raise PermissionDeniedError("의사만 연결을 요청할 수 있습니다.")

    # 2. 요청한 환자 id와 연결하는 튜플 생성 및 등록
    await connection_service.create_connection_request(
        db, doctor_id=account_id, patient_id=payload.patient_id
    )
    # 3. 등록 성공 여부를 응답 형식에 맞춰 전송
    return SuccessResponse(message="연결 요청을 성공적으로 보냈습니다.")


@router.put(
    "/approve",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="환자가 의사의 연결 요청을 승인",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        404: {"model": ErrorResponse, "description": "요청을 찾을 수 없음"},
        409: {"model": ErrorResponse, "description": "잘못된 요청 상태"},
        500: {"model": ErrorResponse, "description": "연결 승인 실패"},
    },
)
async def approve_connection(
    payload: UpdateConnectionStatus,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    """
    환자가 의사의 데이터 열람 연결 요청을 승인합니다.
    """
    # 1. 세션 정보를 바탕으로 유저 정보 파싱하여 account_id와 role 확인
    patient_id = session_info.get("account_id")
    role = session_info.get("role")

    # 예외: 환자 계정에서 보낸 요청이 아닌 경우
    if role != UserRoleEnum.PATIENT:
        raise PermissionDeniedError("환자만 연결을 승인할 수 있습니다.")

    # 예외: 해당 연결은 사용자의 연결이 아닌 경우
    if (
        connection_service.verify_connection_ownership(
            db, user_id=patient_id, role=role, connection_id=payload.connection_id
        )
        is None
    ):
        raise PermissionDeniedError("해당 연결은 사용자의 연결이 아닙니다.")

    # 2. 요청한 환자 id와 연결된 튜플 조회 및 상태 변경
    await connection_service.update_connection_status(
        db, connection_id=payload.connection_id, new_status=ConnectionStatusEnum.APPROVED
    )
    # 3. 연결 성공 여부를 응답 형식에 맞춰 전송
    return SuccessResponse()


@router.put(
    "/reject",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="환자가 의사의 연결 요청을 거절",
    responses={
        403: {"model": ErrorResponse, "description": "권한 없음"},
        404: {"model": ErrorResponse, "description": "요청을 찾을 수 없음"},
        409: {"model": ErrorResponse, "description": "잘못된 요청 상태"},
        500: {"model": ErrorResponse, "description": "연결 거절 실패"},
    },
)
async def reject_connection(
    payload: UpdateConnectionStatus,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    """
    환자가 의사의 데이터 열람 연결 요청을 승인합니다.
    """
    # 1. 세션 정보를 바탕으로 유저 정보 파싱하여 account_id와 role 확인
    patient_id = session_info.get("account_id")
    role = session_info.get("role")

    # 예외: 환자 계정에서 보낸 요청이 아닌 경우
    if role != UserRoleEnum.PATIENT:
        raise PermissionDeniedError("환자만 연결을 승인할 수 있습니다.")

    # 예외: 해당 연결은 사용자의 연결이 아닌 경우
    if (
        connection_service.verify_connection_ownership(
            db, user_id=patient_id, role=role, connection_id=payload.connection_id
        )
        is None
    ):
        raise PermissionDeniedError("해당 연결은 사용자의 연결이 아닙니다.")

    # 2. 요청한 환자 id와 연결된 튜플 조회 및 상태 변경
    await connection_service.update_connection_status(
        db, connection_id=payload.connection_id, new_status=ConnectionStatusEnum.REJECTED
    )
    # 3. 연결 성공 여부를 응답 형식에 맞춰 전송
    return SuccessResponse()


@router.delete(
    "/{connection_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="의사-환자 연결 끊기",
    responses={
        404: {"model": ErrorResponse, "description": "연결을 찾을 수 없음"},
        409: {"model": ErrorResponse, "description": "잘못된 연결 상태"},
        500: {"model": ErrorResponse, "description": "연결 끊기 실패"},
    },
)
async def disconnect_connection(
    connection_id: int,
    session_info: dict = Depends(auth_service.get_current_active_session_info),
    db: AsyncSession = Depends(get_session),
):
    """
    의사 또는 환자가 데이터 열람 연결을 끊습니다.
    """
    # 1. 세션 정보를 바탕으로 유저 정보 파싱하여 account_id와 role 확인
    account_id = session_info.get("account_id")
    role = session_info.get("role")

    # 예외: 해당 연결은 사용자의 연결이 아닌 경우
    if (
        connection_service.verify_connection_ownership(
            db, user_id=account_id, role=role, connection_id=connection_id
        )
        is None
    ):
        raise PermissionDeniedError("해당 연결은 사용자의 연결이 아닙니다.")

    # 2. 요청한 환자 id와 연결된 튜플 조회 및 상태 변경
    await connection_service.update_connection_status(
        db, connection_id=connection_id, new_status=ConnectionStatusEnum.TERMINATED
    )
    # 3. 연결 성공 여부를 응답 형식에 맞춰 전송 (204 No Content)
    return
