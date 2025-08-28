import pytest
from httpx import AsyncClient

# ---------------------------------------
# Test Cases for Schedule Management
# ---------------------------------------

@pytest.mark.asyncio
async def test_schedule_management_flow(client: AsyncClient, patient_auth_headers: dict):
    """환자 스케줄 추가, 조회, 삭제 전체 시나리오 테스트"""

    # 1. (초기 상태 확인) 스케줄 목록이 비어있는지 확인
    initial_res = await client.get("/users/schedules", headers=patient_auth_headers)
    assert initial_res.status_code == 200
    assert initial_res.json()["appointment_dates"] == []

    # 2. 새로운 스케줄 추가
    # padoc_api.json 명세상 request body가 ScheduleDate 스키마를 참조하지만,
    # 생성 시점에는 'date' 외의 정보(id 등)를 알 수 없으므로 'date'만 포함하여 요청합니다.
    # 실제 구현 시 서버가 토큰에서 사용자 정보를 얻고 id를 자동 생성하는 것을 기대합니다.
    schedule_to_add = {"date": "2025-10-24"}
    add_res = await client.post("/users/schedules", json=schedule_to_add, headers=patient_auth_headers)
    assert add_res.status_code == 200
    assert "schedule_id" in add_res.json() # 응답에 스케줄 아이디가 들어있는 지 확인

    # 3. 스케줄 목록 조회하여 추가되었는지 확인
    get_res = await client.get("/users/schedules", headers=patient_auth_headers)
    assert get_res.status_code == 200
    schedules = get_res.json()["appointment_dates"]
    assert len(schedules) == 1
    
    added_schedule = schedules[0]
    assert added_schedule["date"] == "2025-10-24"
    assert "schedule_id" in added_schedule # DB에서 ID가 부여되었는지 확인

    # 4. 추가된 스케줄 삭제
    # API 명세에 따라 삭제 시에도 ScheduleDate 객체를 본문으로 전달합니다.
    # 위에서 조회한 스케줄 객체를 그대로 사용합니다.
    delete_res = await client.delete(f"/users/schedules/{added_schedule['schedule_id']}", headers=patient_auth_headers)
    assert delete_res.status_code == 204

    # 5. (최종 상태 확인) 스케줄이 삭제되어 목록이 다시 비었는지 확인
    final_res = await client.get("/users/schedules", headers=patient_auth_headers)
    assert final_res.status_code == 200
    assert final_res.json()["appointment_dates"] == []
