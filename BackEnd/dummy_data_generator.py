import asyncio
import json
import os
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from sqlmodel import SQLModel

# --- 프로젝트 경로 설정 ---
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

# --- 모델 임포트 ---
from padoc_common.models.accounts import Account
from padoc_common.models.voice_records import VoiceRecord
from padoc_common.models.ah_features import AhFeatures
from padoc_common.models.sentence_features import SentenceFeatures
from padoc_common.models.enums import RecordingTypeEnum, UserRoleEnum

# --- 현실적인 Praat 지표 값 생성을 위한 범위 ---
JITTER_RANGE = (0.001, 0.009)
SHIMMER_RANGE = (0.01, 0.05)
HNR_RANGE = (15.0, 35.0)
NHR_RANGE = (0.01, 0.2)
F0_RANGE = (100.0, 250.0)
CPP_RANGE = (5.0, 25.0)
CSID_RANGE = (20.0, 50.0)


def get_db_url_and_ssl_config() -> tuple[str, dict | None]:
    """db_access.json 파일을 읽어 DB연결 URL과 SSL 설정을 반환합니다."""
    db_access_path = project_root / "BackEnd" / "db_access.json"
    if not db_access_path.exists():
        raise FileNotFoundError(f"DB 설정 파일({db_access_path})을 찾을 수 없습니다.")

    with open(db_access_path, "r") as f:
        config = json.load(f)
    
    db_settings = config.get("database", {})
    db_ssl_config = db_settings.get("ssl")

    url = (
        f"mysql+asyncmy://{db_settings['username']}:{db_settings['password']}"
        f"@{db_settings['host']}:{db_settings['port']}/{db_settings['db_name']}"
    )
    return url, db_ssl_config


def create_dummy_a_feature() -> AhFeatures:
    """'아' 소리 특징(AhFeatures)에 대한 더미 데이터를 생성합니다."""
    min_f0 = random.uniform(F0_RANGE[0], F0_RANGE[1] - 20)
    return AhFeatures(
        jitter_local=random.uniform(*JITTER_RANGE),
        jitter_rap=random.uniform(*JITTER_RANGE),
        jitter_ppq5=random.uniform(*JITTER_RANGE),
        jitter_ddp=random.uniform(*JITTER_RANGE),
        shimmer_local=random.uniform(*SHIMMER_RANGE),
        shimmer_apq3=random.uniform(*SHIMMER_RANGE),
        shimmer_apq5=random.uniform(*SHIMMER_RANGE),
        shimmer_apq11=random.uniform(*SHIMMER_RANGE),
        shimmer_dda=random.uniform(*SHIMMER_RANGE),
        hnr=random.uniform(*HNR_RANGE),
        nhr=random.uniform(*NHR_RANGE),
        f0=random.uniform(min_f0, F0_RANGE[1]),
        max_f0=random.uniform(F0_RANGE[1], F0_RANGE[1] + 50),
        min_f0=min_f0,
    )


def create_dummy_sentence_feature() -> SentenceFeatures:
    """문장 소리 특징(SentenceFeatures)에 대한 더미 데이터를 생성합니다."""
    sampling_data = {
        "data_points":[{"energy": random.uniform(0, 200),"frequency": random.uniform(0, 6000)}for _ in range(200)],
        "sampling_rate": random.uniform(0, 6000),
    }
    return SentenceFeatures(
        cpp=random.uniform(*CPP_RANGE),
        csid=random.uniform(*CSID_RANGE),
        sampling_data=sampling_data
    )


async def create_dummy_data(db: AsyncSession):
    """지정된 환자 ID 목록 중 하나를 임의로 선택하여 더미 음성 녹음 데이터를 생성합니다."""
    patient_login_ids = ["user123"]

    result = await db.execute(
        select(Account).where(
            Account.login_id.in_(patient_login_ids),
            Account.role == UserRoleEnum.PATIENT
        )
    )
    patient_accounts = result.scalars().all()
    
    if not patient_accounts:
        print("오류: 지정된 환자 ID를 DB에서 찾을 수 없습니다.")
        print(f"다음 ID를 확인하세요: {patient_login_ids}")
        return

    selected_account = random.choice(patient_accounts)
    print(f"선택된 환자: {selected_account.login_id} (Account ID: {selected_account.id})")

    for i in range(3):
        file_path = f"s3://parkinsons-voice-data/dummy/{selected_account.login_id}_ah_{int(datetime.now().timestamp())}_{i}.wav"
        voice_record = VoiceRecord(
            patient_id=selected_account.id,
            file_path=file_path,
            type=RecordingTypeEnum.voice_ah,
            created_at=datetime.now(timezone.utc)
        )
        a_feature = create_dummy_a_feature()
        voice_record.ah_features = a_feature
        db.add(voice_record)
        print(f"  - '아' 소리 녹음 생성: {file_path}")

    for i in range(3):
        file_path = f"s3://parkinsons-voice-data/dummy/{selected_account.login_id}_sentence_{int(datetime.now().timestamp())}_{i}.wav"
        voice_record = VoiceRecord(
            patient_id=selected_account.id,
            file_path=file_path,
            type=RecordingTypeEnum.voice_sentence,
            created_at=datetime.now(timezone.utc)
        )
        sentence_feature = create_dummy_sentence_feature()
        voice_record.sentence_features = sentence_feature
        db.add(voice_record)
        print(f"  - '문장' 소리 녹음 생성: {file_path}")

    await db.commit()
    print("\n더미 데이터 생성이 완료되어 DB에 커밋되었습니다.")


async def main():
    """스크립트의 메인 실행 함수"""
    print("더미 데이터 생성 스크립트를 시작합니다.")
    try:
        db_url, db_ssl_config = get_db_url_and_ssl_config()

        engine = create_async_engine(
            db_url,
            connect_args={"ssl": db_ssl_config} if db_ssl_config is not None else {}
        )
        
        AsyncSessionMaker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with AsyncSessionMaker() as db:
            await create_dummy_data(db)
            
    except FileNotFoundError as e:
        print(f"오류: {e}")
    except Exception as e:
        print(f"데이터 생성 중 예기치 않은 오류가 발생했습니다: {e}")
        raise


if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())