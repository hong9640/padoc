import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field

class ScheduleDate(BaseModel):
    schedule_id: int
    date: datetime.date

class ScheduleListResponse(BaseModel):
    appointment_dates: List[ScheduleDate]

class ScheduleCreate(BaseModel):
    date: datetime.date

class ScheduleNotFoundError(Exception):
    pass

class PermissionDeniedError(Exception):
    pass