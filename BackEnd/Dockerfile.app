# 1. Builder Stage: 의존성을 설치하고 빌드하는 단계
FROM python:3.11-slim as builder

# 시스템 패키지 업데이트 (libsndfile1 제거)
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 파이썬 환경변수 설정
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# pip 업그레이드
RUN pip install --upgrade pip

# requirements.txt를 먼저 복사하여 의존성 설치 단계를 캐시합니다.
COPY ./padoc_common/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Final Stage: 실제 애플리케이션을 실행하는 단계
FROM python:3.11-slim

# 보안을 위해 non-root 유저 생성
RUN addgroup --system app && adduser --system --group app

WORKDIR /home/app

# Builder 스테이지에서 설치한 파이썬 패키지들을 복사합니다.
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# 소스 코드를 복사합니다.
COPY ./app ./app
COPY ./padoc_common ./padoc_common

# 파일 소유권을 app 유저에게 부여
RUN chown -R app:app /home/app

# app 유저로 전환
USER app

# 컨테이너 실행 시 FastAPI 애플리케이션을 실행합니다.
# app.main:app -> app/main.py 파일의 app 객체를 의미합니다.
CMD ["python", "./app/main.py"]