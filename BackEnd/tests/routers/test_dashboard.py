import pytest
import httpx
from datetime import date, timedelta

BASE_URL = "http://i13a106.p.ssafy.io:8000"

# Helper function to log in and get a token
async def get_auth_token(client: httpx.AsyncClient, username: str, password: str) -> str:
    response = await client.post("/auth/sessions", json={"login_id": username, "password": password})
    if response.status_code != 200:
        print(f"Login failed for user {username}. Status: {response.status_code}, Response: {response.text}")
    response.raise_for_status()
    return response.json()["access_token"]

@pytest.mark.asyncio
async def test_get_patient_dashboard_success():
    """환자 대시보드 조회 성공 테스트"""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        token = await get_auth_token(client, "user123", "securepassword123!")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await client.get("/dashboard/patient", headers=headers)
        
        assert response.status_code == 200
        response_json = response.json()
        assert "trainings" in response_json

@pytest.mark.asyncio
async def test_get_patient_dashboard_invalid_date_range():
    """잘못된 날짜 범위로 환자 대시보드 조회 실패 테스트"""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        token = await get_auth_token(client, "user123", "securepassword123!")
        headers = {"Authorization": f"Bearer {token}"}
        
        start_date = date.today()
        end_date = start_date - timedelta(days=1)
        
        response = await client.get(f"/dashboard/patient?start_date={start_date}&end_date={end_date}", headers=headers)
        
        assert response.status_code == 400

@pytest.mark.asyncio
async def test_get_patient_details_for_doctor_success():
    """의사의 환자 상세 대시보드 조회 성공 테스트"""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        token = await get_auth_token(client, "닥터", "ekrxj")
        headers = {"Authorization": f"Bearer {token}"}
        
        patient_id = 2
        response = await client.get(f"/dashboard/doctor/{patient_id}", headers=headers)
        
        assert response.status_code == 200
        response_json = response.json()
        assert "voices" in response_json

@pytest.mark.asyncio
async def test_get_patient_details_for_doctor_no_permission():
    """연결되지 않은 의사의 환자 상세 대시보드 조회 실패 테스트"""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        token = await get_auth_token(client, "qwer123", "qwer123")
        headers = {"Authorization": f"Bearer {token}"}
        
        patient_id = 2
        response = await client.get(f"/dashboard/doctor/{patient_id}", headers=headers)
        
        assert response.status_code == 403
