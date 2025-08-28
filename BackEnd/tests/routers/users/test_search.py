import pytest
from httpx import AsyncClient
from typing import Dict, Any
from padoc_common.schemas.search import UserSearchResponse


async def create_user(client: AsyncClient, user_data: Dict[str, Any]) -> None:
    """Helper function to sign up a new user."""
    await client.post("/auth/patients", json=user_data)


async def get_auth_header(client: AsyncClient, login_data: Dict[str, str]) -> Dict[str, str]:
    """Helper function to log in and get the authentication header."""
    login_response = await client.post("/auth/sessions", json=login_data)
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


@pytest.mark.asyncio
async def test_search_users_by_name(client: AsyncClient, doctor_auth_headers: dict, patient_auth_headers: dict):
    """이름으로 사용자 검색 테스트"""

    # 1. 테스트에 사용할 사용자 생성
    user_data_1 = {
        "login_id": "test_user_1",
        "password": "test_password_1!",
        "full_name": "김테스트",
        "role": "patient",
    }
    user_data_2 = {
        "login_id": "test_user_2",
        "password": "test_password_2!",
        "full_name": "이테스트",
        "role": "patient",
    }
    user_data_3 = {
        "login_id": "test_user_3",
        "password": "test_password_3!",
        "full_name": "박지원",
        "role": "patient",
    }

    await create_user(client, user_data_1)
    await create_user(client, user_data_2)
    await create_user(client, user_data_3)

    # 2. 의사 권한으로 "테스트"로 사용자 검색
    response = await client.get("/users/search?q=테스트", headers=doctor_auth_headers)

    # 3. 응답 확인
    assert response.status_code == 200
    search_results = UserSearchResponse.model_validate(response.json())

    # 4. 결과 검증: "테스트"가 이름에 들어간 사용자가 2명이어야 함
    assert len(search_results.users) == 2
    assert user_data_1["full_name"] in [user.full_name for user in search_results.users]
    assert user_data_2["full_name"] in [user.full_name for user in search_results.users]
    assert user_data_3["full_name"] not in [user.full_name for user in search_results.users]

    # 5. 환자 권한으로 사용자 검색 시 403 에러 발생하는지 확인
    response = await client.get("/users/search?q=테스트", headers=patient_auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_search_users_no_keyword(client: AsyncClient, doctor_auth_headers: dict):
    """검색 키워드 없이 사용자 검색 시 400 에러 발생하는지 확인"""

    # 1. 검색 키워드 없이 사용자 검색
    response = await client.get("/users/search", headers=doctor_auth_headers)

    # 2. 응답 확인: 400 에러가 발생하는지 확인
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_users_empty_keyword(client: AsyncClient, doctor_auth_headers: dict):
    """검색 키워드 없이 사용자 검색 시 400 에러 발생하는지 확인"""

    # 1. 검색 키워드 없이 사용자 검색
    response = await client.get("/users/search?q=", headers=doctor_auth_headers)

    # 2. 응답 확인: 400 에러가 발생하는지 확인
    assert response.status_code == 400