# app/schemas/base.py
from datetime import date, datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict


class SuccessResponse(BaseModel):
    """요청 성공 시 공통 응답"""
    message: str = "요청이 성공적으로 처리되었습니다."
    data: Optional[Any] = None

class CheckResponse(BaseModel):
    """유효성, 중복 등 확인 결과 응답"""
    result: bool
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    """요청 실패 시 공통 에러 응답"""
    timestamp: datetime
    status: int
    error: str
    code: Optional[str] = None
    message: str

    model_config = ConfigDict(from_attributes=True)