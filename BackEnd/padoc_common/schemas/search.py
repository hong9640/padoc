from typing import List
from pydantic import BaseModel, ConfigDict


class UserSearchResult(BaseModel):
    """유저 검색 결과 스키마"""

    account_id: int
    full_name: str
    login_id: str

    model_config = ConfigDict(from_attributes=True)


class UserSearchResultList(BaseModel):
    """유저 검색 결과 리스트 스키마"""

    users: List[UserSearchResult]
    model_config = ConfigDict(from_attributes=True)

class UserSearchResponse(UserSearchResultList):
    """유저 검색 응답 스키마"""

    model_config = ConfigDict(from_attributes=True)