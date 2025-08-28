# tests/conftest.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from typing import Any, Dict
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel # 👈 이 SQLModel이 Base 역할을 합니다.

from app.main import app  # FastAPI app 객체
from app.db import get_session  # 실제 get_session과 DB 모델 Base

# padoc_common.models의 모든 테이블 모델을 import하여 Base.metadata에 등록합니다.
from padoc_common.models import (
    accounts,
    advanced_training_informations,
    ah_features,
    calendar_events,
    doctor_notes,
    doctor_patient_view_settings,
    doctors,
    enums,
    patient_doctor_access,
    patients,
    sentence_features,
    voice_records,
)


# 1. 테스트용 DB로 메모리 SQLite를 설정합니다.
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def engine():
    """테스트용 비동기 DB 엔진을 생성합니다."""
    return create_async_engine(TEST_DB_URL, echo=True)

@pytest_asyncio.fixture(scope="function")
async def tables(engine):
    """테스트 시작 전 모든 테이블을 생성하고, 종료 후 삭제합니다."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session(engine, tables):
    """각 테스트마다 격리된 실제 DB 세션을 제공합니다."""
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

@pytest_asyncio.fixture
async def client(db_session):
    """
    테스트용 비동기 클라이언트를 생성하고, 
    앱의 DB 의존성을 테스트용 DB 세션으로 교체합니다.
    """
    def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    # 1. ASGITransport 객체를 app과 함께 생성합니다.
    transport = ASGITransport(app=app)
    # 2. AsyncClient에는 app 대신 transport를 전달합니다.
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def doctor_signup_data():
    """테스트용 의사 회원가입 데이터"""
    return {
        "login_id": "test_doctor_123",
        "password": "testpassword123!",
        "full_name": "김의사",
        "email": "doctor.kim@test.com",
        "phone_number": "010-1234-5678",
        "role": "doctor",
        "address": "서울시 강남구 테스트병원",
        "gender": "male",
        "age": 45,
        "valid_license_id": "123456",
        "is_verified": True
    }

@pytest.fixture(scope="session")
def patient_signup_data():
    """테스트용 환자 회원가입 데이터"""
    return {
        "login_id": "test_patient_456",
        "password": "testpassword456!",
        "full_name": "박환자",
        "email": "patient.park@test.com",
        "phone_number": "010-8765-4321",
        "role": "patient",
        "address": "서울시 서초구 테스트아파트",
        "gender": "female",
        "age": 62
    }

@pytest_asyncio.fixture
async def patient_auth_headers(client: AsyncClient, patient_signup_data: dict) -> dict:
    """회원가입 및 로그인 후 환자의 인증 헤더를 반환합니다."""
    await client.post("/auth/patients", json=patient_signup_data)
    
    login_credentials = {
        "login_id": patient_signup_data["login_id"], 
        "password": patient_signup_data["password"]
    }
    response = await client.post("/auth/sessions", json=login_credentials)
    response.raise_for_status() # 로그인 성공 확인
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}

@pytest_asyncio.fixture
async def doctor_auth_headers(client: AsyncClient, doctor_signup_data: dict) -> dict:
    """회원가입 및 로그인 후 의사의 인증 헤더를 반환합니다."""
    await client.post("/auth/doctors", json=doctor_signup_data)
    
    login_credentials = {
        "login_id": doctor_signup_data["login_id"], 
        "password": doctor_signup_data["password"]
    }
    response = await client.post("/auth/sessions", json=login_credentials)
    response.raise_for_status() # 로그인 성공 확인
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}