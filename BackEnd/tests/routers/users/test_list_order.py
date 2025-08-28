import pytest
from httpx import AsyncClient

async def create_and_connect_patient(client: AsyncClient, doctor_headers: dict, patient_signup_data: dict) -> int:
    """
    Helper function to sign up a new patient, get their ID, 
    and approve a connection request from the doctor.
    Returns the patient's account ID.
    """
    # 1. 환자 회원가입
    await client.post("/auth/patients", json=patient_signup_data)

    # 2. 환자로 로그인하여 ID와 인증 헤더 획득
    login_creds = {"login_id": patient_signup_data["login_id"], "password": patient_signup_data["password"]}
    login_res = await client.post("/auth/sessions", json=login_creds)
    patient_token = login_res.json()["access_token"]
    patient_headers = {"Authorization": f"Bearer {patient_token}"}
    
    profile_res = await client.get("/users/profile", headers=patient_headers)
    patient_id = profile_res.json()["account_id"]

    # 3. 의사가 환자에게 연결 요청
    await client.post("/users/connections/requests", json={"patient_id": patient_id}, headers=doctor_headers)

    # 4. 환자가 요청을 찾아 승인
    pending_list_res = await client.get("/users/connections", headers=patient_headers)
    connection_id = pending_list_res.json()["connections"][0]["id"]
    await client.put("/users/connections/approve", json={"connection_id": connection_id}, headers=patient_headers)
    
    return patient_id


@pytest.mark.asyncio
async def test_patient_list_order_flow(client: AsyncClient, doctor_auth_headers: dict):
    """의사의 환자 목록 순서 조회 및 변경 전체 시나리오 테스트"""
    # --- Arrange ---
    # 1. 테스트에 사용할 두 명의 환자를 생성하고 의사와 연결합니다.
    patient_a_data = {
        "login_id": "patient_A_789", "password": "password_A!", "full_name": "환자A", "role": "patient"
    }
    patient_b_data = {
        "login_id": "patient_B_101", "password": "password_B!", "full_name": "환자B", "role": "patient"
    }

    patient_a_id = await create_and_connect_patient(client, doctor_auth_headers, patient_a_data)
    patient_b_id = await create_and_connect_patient(client, doctor_auth_headers, patient_b_data)

    # --- Act & Assert ---
    # 2. 현재 환자 목록 순서를 조회합니다.
    get_order_res = await client.get("/users/list-order", headers=doctor_auth_headers)
    assert get_order_res.status_code == 200
    initial_order = get_order_res.json().get("patient_order", [])
    # 초기 순서는 보장되지 않으므로, 두 환자가 모두 포함되었는지만 확인합니다.
    assert set(initial_order) == {patient_a_id, patient_b_id}

    # 3. 환자 목록 순서를 변경하여 전송합니다. (B -> A 순으로)
    new_order = [patient_b_id, patient_a_id]
    update_payload = {"patient_order": new_order}
    update_res = await client.post("/users/list-order", json=update_payload, headers=doctor_auth_headers)
    assert update_res.status_code == 200
    assert update_res.json()["message"] == "환자 목록 순서가 성공적으로 업데이트되었습니다."

    # 4. 변경된 순서가 올바르게 저장되었는지 다시 조회하여 확인합니다.
    final_get_res = await client.get("/users/list-order", headers=doctor_auth_headers)
    assert final_get_res.status_code == 200
    final_order = final_get_res.json().get("patient_order", [])
    assert final_order == new_order
