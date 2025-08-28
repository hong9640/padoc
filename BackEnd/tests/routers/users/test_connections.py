import pytest
from httpx import AsyncClient

# ---------------------------------------
# Test Cases for Connection Management
# ---------------------------------------

@pytest.mark.asyncio
async def test_connection_flow(client: AsyncClient, doctor_auth_headers: dict, patient_auth_headers: dict, patient_signup_data: dict):
    """의사-환자 연결 요청, 승인, 확인, 해제 전체 시나리오 테스트"""
    
    # 1. (사전준비) 환자의 account_id 조회
    # 의사가 연결을 요청하려면 대상 환자의 고유 ID를 알아야 합니다.
    profile_res = await client.get("/users/profile", headers=patient_auth_headers)
    assert profile_res.status_code == 200
    patient_account_id = profile_res.json()["account_id"]

    # 2. (의사) 환자에게 연결 요청 보내기
    request_payload = {"patient_id": patient_account_id}
    req_conn_res = await client.post("/users/connections/requests", json=request_payload, headers=doctor_auth_headers)
    assert req_conn_res.status_code == 200
    assert req_conn_res.json()["message"] == "연결 요청을 성공적으로 보냈습니다."

    # 3. (환자) 자신에게 온 연결 요청 확인
    # 요청 목록을 조회하여 'pending' 상태의 요청이 있는지 확인합니다.
    pending_list_res = await client.get("/users/connections", headers=patient_auth_headers)
    assert pending_list_res.status_code == 200
    pending_connections = pending_list_res.json()
    assert len(pending_connections) == 1
    connection_request = pending_connections["connections"][0]
    assert connection_request["connection_status"] == "pending"
    connection_id = connection_request["id"] # 승인/거절에 사용할 요청 ID

    # 4. (환자) 연결 요청 승인하기
    approve_payload = {"connection_id": connection_id}
    approve_res = await client.put("/users/connections/approve", json=approve_payload, headers=patient_auth_headers)
    assert approve_res.status_code == 200

    # 5. (의사) 연결이 'approved' 상태인지 확인
    doctor_conn_list_res = await client.get("/users/connections", headers=doctor_auth_headers)
    assert doctor_conn_list_res.status_code == 200
    doctor_connections = doctor_conn_list_res.json()["connections"]
    assert len(doctor_connections) == 1
    assert doctor_connections[0]["connection_status"] == "approved"
    assert doctor_connections[0]["patient_name"] == patient_signup_data["full_name"]
    connection_id_to_delete = doctor_connections[0]["id"]

    # 6. (의사) 연결 해제하기
    delete_res = await client.delete(f"/users/connections/{connection_id_to_delete}", headers=doctor_auth_headers)
    assert delete_res.status_code == 204

    # 7. (환자) 연결이 해제되어 목록에 없는지 최종 확인
    final_list_res = await client.get("/users/connections", headers=patient_auth_headers)
    assert final_list_res.status_code == 200
    assert len(final_list_res.json()["connections"]) == 0
