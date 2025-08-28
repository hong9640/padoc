# app/models/calendar_events.py

from typing import Optional, TYPE_CHECKING
from datetime import datetime, date, timezone
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import func
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import Mapped # 1. Mapped 타입을 임포트합니다.

if TYPE_CHECKING:
    from .patients import Patient

class CalendarEventBase(SQLModel):
    event_date: date
    patient_id: int

class CalendarEvent(CalendarEventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(sa_column=Column(Integer, ForeignKey("patient.account_id", ondelete="CASCADE"), nullable=False, index=True))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": func.now()}
    )

    # 2. Relationship의 타입 힌트를 Mapped[...]로 감싸줍니다.
    patient: Mapped["Patient"] = Relationship(back_populates="calendar_events")

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventRead(CalendarEventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class CalendarEventUpdate(SQLModel):
    event_date: Optional[date] = Field(default=None)