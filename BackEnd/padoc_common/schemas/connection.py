# app/schemas/connection.py
from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict

from padoc_common.models.enums import ConnectionStatusEnum


class ConnectionRequestPayload(BaseModel):
    patient_id: int

class UpdateConnectionStatus (BaseModel):
    connection_id: int

class Connection(BaseModel):
    """의사-환자 간 데이터 열람 연결 정보 (patient_doctor_access 테이블)"""
    id: int
    doctor_id: int
    doctor_name: str
    patient_id: int
    patient_name: str
    connection_status: ConnectionStatusEnum = ConnectionStatusEnum.PENDING

    model_config = ConfigDict(
        from_attributes=True
    )

class ConnectionList(BaseModel):
    """연결 정보 목록"""
    connections: List[Connection]
