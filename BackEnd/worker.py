# worker.py
# backend안에 위치

import time
from celery import Celery


# 1. Celery 앱을 생성합니다.
# broker와 backend URL에 로컬에서 실행 중인 Redis 주소를 적어줍니다.
# broker, backend는 고정
# 하나의 서버에서 충돌 없이 사용 가능
# backend가 있어야 이 안의 데이터를 뽑아올 수 있음.
celery_app = Celery(
    'tasks',
    broker='redis://localhost:6379/0', # <- 이 부분이 바로 메시지 큐의 주소입니다.
    backend='redis://localhost:6379/0' # <- 이 부분은 완료한 결과 주소
)

# 2. Celery가 수행할 작업을 @celery_app.task 데코레이터를 붙여 정의합니다.
@celery_app.task(name="analyze_voice_task")
def analyze_voice_task(record_id: int):
    """
    백그라운드에서 음성 분석을 수행하는 핵심 작업(Task)
    """
    # with SessionLocal() as db: # 실제 DB 세션 사용 예시
    try:
        print(f"✅ [작업 시작] record_id: {record_id}")

        # 1. DB에서 레코드 상태를 'PROCESSING'으로 변경
        record = db.query(VoiceRecord).filter(VoiceRecord.id == record_id).first()
        record.status = FileStatusEnum.PROCESSING
        db.commit()
        print(f"🔍 [상태 변경] record_id: {record_id} -> PROCESSING")

        # 2. S3에서 파일 다운로드 (의사 코드)
        file_data = storage_service.download(record.file_path)
        print(f"⬇️ [파일 다운로드] record_id: {record_id}")
        
        # 3. 시간이 오래 걸리는 음성 분석 실행 (의사 코드)
        # 실제 분석 코드 작성
        time.sleep(10) # 예시: 분석에 10초가 걸린다고 가정
        analysis_result = analysis_service.run(file_data)
        print(f"🤖 [음성 분석 완료] record_id: {record_id}")

        # 4. 분석 결과와 상태를 'COMPLETED'로 DB에 저장
        record.result = analysis_result
        record.status = FileStatusEnum.COMPLETED
        db.commit()
        print(f"💾 [결과 저장] record_id: {record_id} -> COMPLETED")
        
        return {"status": "Success", "record_id": record_id}

    except Exception as e:
        print(f"❌ [작업 실패] record_id: {record_id}, 에러: {e}")
        # 실패 시 DB 상태를 'FAILED'로 변경
        # db.rollback()
        # record = db.query(VoiceRecord).filter(VoiceRecord.id == record_id).first()
        # record.status = FileStatusEnum.FAILED
        # db.commit()
        # Celery에게 작업 실패를 알리기 위해 에러를 다시 발생시킬 수 있습니다.
        raise e