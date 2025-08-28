# app/routers/users/__init__.py
from fastapi import APIRouter

from . import profile
from . import schedules
from . import list_order
from . import connections
from . import search

# '/users' 접두사를 가진 메인 라우터를 생성합니다.
# 이 라우터가 users 모듈의 모든 하위 라우터를 통합 관리합니다.
router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# 기능별로 분리된 하위 라우터들을 메인 라우터에 포함시킵니다.
router.include_router(profile.router)
router.include_router(connections.router)
router.include_router(schedules.router)
router.include_router(list_order.router)
router.include_router(connections.router)
router.include_router(search.router)