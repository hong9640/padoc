import pytest
from httpx import AsyncClient, Response

# ---------------------------------------
# Auth API Action Functions
# ---------------------------------------

async def signup_patient(client: AsyncClient, patient_data: dict) -> Response:
    """환자 회원가입 API를 호출합니다."""
    return await client.post("/auth/patients", json=patient_data)

async def signup_doctor(client: AsyncClient, doctor_data: dict) -> Response:
    """의사 회원가입 API를 호출합니다."""
    return await client.post("/auth/doctors", json=doctor_data)

async def login(client: AsyncClient, login_data: dict) -> Response:
    """로그인 API를 호출합니다."""
    return await client.post("/auth/sessions", json=login_data)

async def logout(client: AsyncClient, headers: dict) -> Response:
    """로그아웃 API를 호출합니다."""
    return await client.delete("/auth/sessions", headers=headers)

async def check_duplicate_id(client: AsyncClient, user_id: str) -> Response:
    """아이디 중복 확인 API를 호출합니다."""
    return await client.post("/auth/check-duplicate-id", json={"login_id": user_id})

async def verify_password(client: AsyncClient, password: str, headers: dict) -> Response:
    """비밀번호 재확인 API를 호출합니다."""
    return await client.post("/auth/verify-password", json={"password": password}, headers=headers)

async def verify_doctor_license(client: AsyncClient, license_id: str, headers: dict) -> Response:
    """의사 면허 인증 API를 호출합니다."""
    return await client.post("/auth/verify-doctor-license", json={"valid_license_id": license_id}, headers=headers)


# ---------------------------------------
# Helper Functions for Tests
# ---------------------------------------

async def get_auth_headers(client: AsyncClient, user_type: str, signup_data: dict) -> dict:
    """회원가입 후 로그인하여 인증 헤더를 반환합니다."""
    if user_type == "patient":
        await signup_patient(client, signup_data)
    else:
        await signup_doctor(client, signup_data)
    
    login_credentials = {"login_id": signup_data["login_id"], "password": signup_data["password"]}
    response = await login(client, login_credentials)
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


# ---------------------------------------
# Test Cases for Auth Router
# ---------------------------------------

@pytest.mark.asyncio
async def test_patient_signup_success(client: AsyncClient, patient_signup_data: dict):
    """환자 회원가입 성공 테스트"""
    response = await signup_patient(client, patient_signup_data)
    assert response.status_code == 201
    assert response.json()["message"] == "회원가입이 성공적으로 완료되었습니다."

@pytest.mark.asyncio
async def test_patient_signup_duplicate_id(client: AsyncClient, patient_signup_data: dict):
    """환자 회원가입 아이디 중복 실패 테스트"""
    await signup_patient(client, patient_signup_data)
    second_response = await signup_patient(client, patient_signup_data)
    assert second_response.status_code == 409

@pytest.mark.asyncio
async def test_doctor_signup_success(client: AsyncClient, doctor_signup_data: dict):
    """의사 회원가입 성공 테스트"""
    response = await signup_doctor(client, doctor_signup_data)
    assert response.status_code == 201
    assert response.json()["message"] == "회원가입이 성공적으로 완료되었습니다."

@pytest.mark.asyncio
async def test_doctor_signup_duplicate_id(client: AsyncClient, doctor_signup_data: dict):
    """의사 회원가입 아이디 중복 실패 테스트"""
    await signup_doctor(client, doctor_signup_data)
    second_response = await signup_doctor(client, doctor_signup_data)
    assert second_response.status_code == 409


@pytest.mark.asyncio
async def test_doctor_signup_duplicate_license(client: AsyncClient, doctor_signup_data: dict):
    """의사 회원가입 면허 중복 실패 테스트"""
    # 첫 번째 의사 회원가입
    response1 = await signup_doctor(client, doctor_signup_data)
    assert response1.status_code == 201

    # 두 번째 의사 회원가입 (다른 아이디, 같은 면허)
    doctor_signup_data_2 = doctor_signup_data.copy()
    doctor_signup_data_2["login_id"] = "doctor_2"
    response2 = await signup_doctor(client, doctor_signup_data_2)
    assert response2.status_code == 400


@pytest.mark.asyncio
@pytest.mark.parametrize("user_type", ["patient", "doctor"])
async def test_login_success(client: AsyncClient, user_type: str, patient_signup_data: dict, doctor_signup_data: dict):
    """환자 및 의사 로그인 성공 테스트"""
    signup_data = patient_signup_data if user_type == "patient" else doctor_signup_data
    headers = await get_auth_headers(client, user_type, signup_data)
    assert headers["Authorization"].startswith("Bearer ")

@pytest.mark.asyncio
async def test_login_failure_wrong_password(client: AsyncClient, patient_signup_data: dict):
    """잘못된 비밀번호로 로그인 실패 테스트"""
    await signup_patient(client, patient_signup_data)
    login_credentials = {"login_id": patient_signup_data["login_id"], "password": "wrongpassword"}
    response = await login(client, login_credentials)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_check_id_availability(client: AsyncClient, patient_signup_data: dict):
    """아이디 중복 확인 테스트"""
    # 사용 전 아이디 확인
    response = await check_duplicate_id(client, patient_signup_data["login_id"])
    assert response.status_code == 200
    assert response.json()["result"] is True

    # 회원가입 후 아이디 확인
    await signup_patient(client, patient_signup_data)
    response = await check_duplicate_id(client, patient_signup_data["login_id"])
    assert response.status_code == 200
    assert response.json()["result"] is False

@pytest.mark.asyncio
async def test_verify_password_success(client: AsyncClient, patient_signup_data: dict):
    """비밀번호 재확인 성공 테스트"""
    headers = await get_auth_headers(client, "patient", patient_signup_data)
    response = await verify_password(client, patient_signup_data["password"], headers)
    assert response.status_code == 200
    assert response.json()["result"] is True

@pytest.mark.asyncio
async def test_verify_password_failure(client: AsyncClient, patient_signup_data: dict):
    """비밀번호 재확인 실패 테스트"""
    headers = await get_auth_headers(client, "patient", patient_signup_data)
    response = await verify_password(client, "wrongpassword", headers)
    assert response.status_code == 200 # API 명세상 성공(200)으로 오지만 결과는 false
    assert response.json()["result"] is False

@pytest.mark.asyncio
async def test_logout_success(client: AsyncClient, patient_signup_data: dict):
    """로그아웃 성공 테스트"""
    headers = await get_auth_headers(client, "patient", patient_signup_data)
    response = await logout(client, headers)
    assert response.status_code == 200
    assert response.json()["message"] == "요청이 성공적으로 처리되었습니다."

@pytest.mark.asyncio
@pytest.mark.parametrize("optional_field", ["email", "phone_number", "address", "gender", "age"])
@pytest.mark.parametrize("value_mode", ["empty", "missing"])
async def test_patient_signup_optional_fields(client: AsyncClient, patient_signup_data: dict, optional_field: str, value_mode: str):
    """환자 회원가입 시 선택적 필드를 비우거나 생략하고 성공하는지 테스트합니다."""
    payload = patient_signup_data.copy()
    
    # 매번 다른 아이디로 테스트하여 중복을 피합니다.
    import uuid
    payload['login_id'] = f"patient-optional-{uuid.uuid4().hex[:8]}"

    if value_mode == "missing":
        if optional_field in payload:
            del payload[optional_field]
    elif value_mode == "empty":
        # age는 integer 타입이므로 빈 문자열 테스트에서 제외합니다.
        if optional_field == 'age':
            pytest.skip("age 필드는 integer 타입이므로 빈 문자열('') 테스트를 건너뜁니다.")
        payload[optional_field] = ""

    response = await signup_patient(client, payload)
    
    assert response.status_code == 201, f"Failed for field '{optional_field}' with mode '{value_mode}'. Response: {response.text}"
    assert response.json()["message"] == "회원가입이 성공적으로 완료되었습니다."


@pytest.mark.asyncio
@pytest.mark.parametrize("optional_field", ["email", "phone_number", "address", "gender", "age"])
@pytest.mark.parametrize("value_mode", ["empty", "missing"])
async def test_doctor_signup_optional_fields(client: AsyncClient, doctor_signup_data: dict, optional_field: str, value_mode: str):
    """의사 회원가입 시 선택적 필드를 비우거나 생략하고 성공하는지 테스트합니다."""
    payload = doctor_signup_data.copy()
    
    # 매번 다른 아이디로 테스트하여 중복을 피합니다.
    import uuid
    payload['login_id'] = f"doctor-optional-{uuid.uuid4().hex[:8]}"

    if value_mode == "missing":
        if optional_field in payload:
            del payload[optional_field]
    elif value_mode == "empty":
        # age는 integer 타입이므로 빈 문자열 테스트에서 제외합니다.
        if optional_field == 'age':
            pytest.skip("age 필드는 integer 타입이므로 빈 문자열('') 테스트를 건너뜁니다.")
        payload[optional_field] = ""

    response = await signup_doctor(client, payload)
    
    assert response.status_code == 201, f"Failed for field '{optional_field}' with mode '{value_mode}'. Response: {response.text}"
    assert response.json()["message"] == "회원가입이 성공적으로 완료되었습니다."
