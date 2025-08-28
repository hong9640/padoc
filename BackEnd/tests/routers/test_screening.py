import pytest
from httpx import AsyncClient
import io

@pytest.mark.asyncio
async def test_analyze_voice_success_for_a_recording(client: AsyncClient):
    """'ah' 녹음 유형 음성 분석 성공 테스트"""
    with open("tests/test_sound.wav", "rb") as wav_file:
        files = {"voice_file": ("test_sound.wav", wav_file, "audio/wav")}
        data = {"recording_type": "voice_ah"}

        response = await client.post("/screening", files=files, data=data)

    assert response.status_code == 200  # Unprocessable Entity
    response_json = response.json()
    # 'ah' 녹음 결과에 맞는 필드가 있는지 확인합니다.
    assert "hnr" in response_json
    assert "nhr" in response_json
    assert "f0" in response_json
    assert "max_f0" in response_json
    assert "min_f0" in response_json
    assert "jitter" in response_json
    assert "shimmer" in response_json


@pytest.mark.asyncio
async def test_analyze_voice_success_for_sentence_recording(client: AsyncClient):
    """'sentence' 녹음 유형 음성 분석 성공 테스트"""
    with open("tests/test_sound.wav", "rb") as wav_file:
        files = {"voice_file": ("test_sound.wav", wav_file, "audio/wav")}
        data = {"recording_type": "voice_sentence"}

        response = await client.post("/screening", files=files, data=data)

    assert response.status_code == 200
    response_json = response.json()
    # 'sentence' 녹음 결과에 맞는 필드가 있는지 확인합니다.
    assert "ai_score" in response_json


@pytest.mark.asyncio
async def test_analyze_voice_invalid_recording_type(client: AsyncClient):
    """잘못된 녹음 유형으로 인한 실패 테스트"""
    with open("tests/test_sound.wav", "rb") as wav_file:
        files = {"voice_file": ("test_sound.wav", wav_file, "audio/wav")}
        data = {"recording_type": "invalid_type"}

        response = await client.post("/screening", files=files, data=data)

    assert response.status_code == 422  # Unprocessable Entity

@pytest.mark.asyncio
async def test_analyze_voice_no_file(client: AsyncClient):
    """음성 파일 없이 요청하여 실패하는 테스트"""
    data = {"recording_type": "voice_ah"}

    response = await client.post("/screening", data=data)

    assert response.status_code == 422  # Unprocessable Entity
