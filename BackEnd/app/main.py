# app/main.py
# app 폴더의 메인 실행 파일

# 프로젝트 루트 디렉토리를 Python 경로에 추가하여 모듈 임포트 문제 해결
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


import uvicorn
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 로드
load_dotenv()

# 이제 다른 모듈들을 상대 경로로 안전하게 임포트합니다.
from app.db import create_db_and_tables
from app.routers import auth, dashboard, users, training, screening
from padoc_common.exceptions import (
    InvalidCredentialsError, 
    LicenseVerificationError, 
    DuplicateIdError,
    PermissionDeniedError,
    BadRequestError,
    InsufficientPermissionsError,
    AlreadyConnectedError,
    ConnectionCreationError,
    NotFoundError  # 새로 추가
)
from padoc_common.schemas.base import ErrorResponse

# Lifespan 컨텍스트 매니저 정의
@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작과 종료 시 처리할 로직"""
    print("--- FastAPI app startup: creating DB tables... ---")
    await create_db_and_tables()
    yield
    print("--- FastAPI app shutdown. ---")

# FastAPI 앱 인스턴스 생성
app = FastAPI(lifespan=lifespan)

# --- 전역 예외 핸들러 --- 

@app.exception_handler(NotFoundError)  # 새로 추가된 핸들러
async def not_found_exception_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_404_NOT_FOUND,
            error="Not Found",
            message=exc.message
        ).model_dump(mode='json')
    )

@app.exception_handler(InvalidCredentialsError)
async def invalid_credentials_exception_handler(request: Request, exc: InvalidCredentialsError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.message},
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.exception_handler(LicenseVerificationError)
async def license_verification_exception_handler(request: Request, exc: LicenseVerificationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_400_BAD_REQUEST,
            error="Bad Request",
            message=exc.message
        ).model_dump(mode='json')
    )

@app.exception_handler(DuplicateIdError)
async def duplicate_id_exception_handler(request: Request, exc: DuplicateIdError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_409_CONFLICT,
            error="Conflict",
            message=exc.message
        ).model_dump(mode='json')
    )

@app.exception_handler(PermissionDeniedError)
async def permission_denied_exception_handler(request: Request, exc: PermissionDeniedError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_403_FORBIDDEN,
            error="Forbidden",
            message=exc.message
        ).model_dump(mode='json')
    )

@app.exception_handler(BadRequestError)
async def bad_request_exception_handler(request: Request, exc: BadRequestError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_400_BAD_REQUEST,
            error="Bad Request",
            message=exc.message
        ).model_dump(mode='json')
    )

@app.exception_handler(InsufficientPermissionsError)
async def insufficient_permissions_exception_handler(request: Request, exc: InsufficientPermissionsError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_403_FORBIDDEN,
            error="Forbidden",
            message=exc.message
        ).model_dump(mode='json')
    )

@app.exception_handler(AlreadyConnectedError)
async def already_connected_exception_handler(request: Request, exc: AlreadyConnectedError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_409_CONFLICT,
            error="Conflict",
            message=exc.message
        ).model_dump(mode='json')
    )

@app.exception_handler(ConnectionCreationError)
async def connection_creation_exception_handler(request: Request, exc: ConnectionCreationError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            timestamp=datetime.now().isoformat(),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error="Internal Server Error",
            message=exc.message
        ).model_dump(mode='json')
    )


# --- 미들웨어 설정 --- 

# CORS 미들웨어 설정
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://i13a106.p.ssafy.io:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 origins 변수 사용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 라우터 등록 --- 

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(training.router)
app.include_router(screening.router)


# 기본 루트 엔드포인트
@app.get("/")
def read_root():
    return {"message": "Server is running successfully!"}

# 이 파일을 직접 실행할 때를 위한 코드
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("MAIN_SERV_PORT")), reload=True)
