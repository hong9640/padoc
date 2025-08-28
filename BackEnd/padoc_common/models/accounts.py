# app/models/accounts.py

from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import func
from sqlalchemy.orm import Mapped
from .enums import UserRoleEnum

# 순환 참조 방지를 위해 TYPE_CHECKING 블록 내에서 모델을 임포트합니다.
if TYPE_CHECKING:
    from .doctors import Doctor
    from .patients import Patient

# 공통 필드를 정의하는 AccountBase 모델입니다.
class AccountBase(SQLModel):
    login_id: str = Field(max_length=255, unique=True, index=True)
    full_name: Optional[str] = Field(max_length=255, default=None)
    email: Optional[str] = Field(max_length=255, default=None, index=True)
    phone_number: Optional[str] = Field(max_length=20, default=None)
    role: "UserRoleEnum" = Field(max_length=20)


# 데이터베이스 테이블과 직접 매핑되는 Account 모델입니다.
class Account(AccountBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    password: str = Field(max_length=255) # 비밀번호는 항상 해싱하여 저장해야 합니다.

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": func.now()}
    )

    # ERD를 기반으로 관계를 설정합니다.
    # Account는 하나의 Doctor 또는 Patient 정보를 가질 수 있습니다 (One-to-One).
    doctor: Mapped[Optional["Doctor"]] = Relationship(back_populates="account")
    patient: Mapped[Optional["Patient"]] = Relationship(back_populates="account")


# 계정 생성을 위한 Create 모델입니다.
class AccountCreate(AccountBase):
    password: str = Field(max_length=255)


# 계정 조회를 위한 Read 모델입니다.
class AccountRead(AccountBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# 계정 정보 수정을 위한 Update 모델입니다.
# 모든 필드는 선택적으로(Optional) 수정 가능해야 합니다.
class AccountUpdate(SQLModel):
    login_id: Optional[str] = Field(max_length=255, default=None, unique=True, index=True)
    full_name: Optional[str] = Field(max_length=255, default=None)
    email: Optional[str] = Field(max_length=255, default=None, index=True)
    phone_number: Optional[str] = Field(max_length=20, default=None)
    password: Optional[str] = Field(max_length=255, default=None)