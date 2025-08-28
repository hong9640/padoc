import pytest
from httpx import AsyncClient

# ---------------------------------------
# Test Cases for User Profile Router
# ---------------------------------------

@pytest.mark.asyncio
async def test_get_patient_profile(client: AsyncClient, patient_auth_headers: dict, patient_signup_data: dict):
    """환자 본인 프로필 조회 테스트"""
    # Act
    response = await client.get("/users/profile", headers=patient_auth_headers)
    
    # Assert
    assert response.status_code == 200
    profile_data = response.json()
    assert profile_data["login_id"] == patient_signup_data["login_id"]
    assert profile_data["full_name"] == patient_signup_data["full_name"]
    assert profile_data["role"] == "patient"

@pytest.mark.asyncio
async def test_get_doctor_profile(client: AsyncClient, doctor_auth_headers: dict, doctor_signup_data: dict):
    """의사 본인 프로필 조회 테스트"""
    # Act
    response = await client.get("/users/profile", headers=doctor_auth_headers)
    
    # Assert
    assert response.status_code == 200
    profile_data = response.json()
    assert profile_data["login_id"] == doctor_signup_data["login_id"]
    assert profile_data["full_name"] == doctor_signup_data["full_name"]
    assert profile_data["role"] == "doctor"

@pytest.mark.asyncio
async def test_update_patient_profile(client: AsyncClient, patient_auth_headers: dict):
    """환자 프로필 수정 테스트"""
    # Arrange
    update_data = {
        "full_name": "김환자", # 이름 변경
        "phone_number": "010-1111-2222", # 전화번호 변경
        "address": "경기도 성남시 분당구"
    }

    # Act
    response = await client.put("/users/profile", json=update_data, headers=patient_auth_headers)

    # Assert
    assert response.status_code == 200
    updated_response = response.json()
    assert updated_response["message"] == "프로필이 성공적으로 업데이트되었습니다."
    

    # 수정 후 다시 조회하여 변경사항이 유지되는지 확인
    get_response = await client.get("/users/profile", headers=patient_auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["full_name"] == "김환자"
    assert get_response.json()["phone_number"] == "010-1111-2222"
