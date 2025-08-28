import pytest
from httpx import AsyncClient
import io

from app.main import app  # FastAPI app 객체

from sqlalchemy import select

@pytest.mark.asyncio
async def test_upload_training_file_success(client: AsyncClient, mocker):
    """훈련 음성 파일 업로드 URL 생성 성공 테스트"""
    # Mocking S3 client and its methods
    mock_s3_client = mocker.MagicMock()
    mock_s3_client.generate_presigned_url.return_value = "http://example.com/upload"
    mocker.patch("app.storage.get_s3_client", return_value=mock_s3_client)

    # Create a dummy voice record to be related
    from padoc_common.models.voice_records import VoiceRecord
    from sqlmodel.ext.asyncio.session import AsyncSession
    from app.db import get_session
    
    async def override_get_session():
        async with AsyncSession() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    
    async with AsyncSession() as session:
        related_record = VoiceRecord(patient_id=1, file_path="some/path.wav", type="voice_ah")
        session.add(related_record)
        await session.commit()
        await session.refresh(related_record)
        related_record_id = related_record.id

    data = {
        "file_name": "test.wav",
        "type": "voice_ah",
        "related_voice_record_id": related_record_id
    }
    
    response = await client.post("/training/basic/upload", json=data)
    
    assert response.status_code == 200
    response_json = response.json()
    assert "record_id" in response_json
    assert "upload_url" in response_json

    # Verify the relationship in the database
    async with AsyncSession() as session:
        new_record_id = response_json["record_id"]
        result = await session.exec(
            select(VoiceRecord).where(VoiceRecord.id == new_record_id)
        )
        new_record = result.scalars().first()
        assert new_record is not None
        assert new_record.related_voice_record_id == related_record_id

@pytest.mark.asyncio
async def test_get_upload_status_success(client: AsyncClient, mocker):
    """업로드 상태 확인 성공 테스트"""
    # Mocking the service function
    mock_process_check_status = mocker.patch(
        "app.services.training_service.process_check_status",
        return_value={"status": "completed"}
    )
    
    record_id = 1
    response = await client.get(f"/training/basic/upload-status/{record_id}")
    
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["status"] == "completed"
    mock_process_check_status.assert_called_once()

@pytest.mark.asyncio
async def test_submit_advanced_training_result_success(client: AsyncClient, mocker):
    """심화 훈련 결과 제출 성공 테스트"""
    # Mocking the service function
    mock_process_advanced_training = mocker.patch(
        "app.services.training_service.process_advanced_training",
        return_value={"message": "Advanced training started"}
    )
    
    data = {"record_id": 1}
    response = await client.post("/training/advanced", json=data)
    
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["message"] == "Advanced training started"
    mock_process_advanced_training.assert_called_once()
