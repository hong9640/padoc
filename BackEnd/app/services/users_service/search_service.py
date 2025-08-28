# app/services/users_service/search_service.py
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from padoc_common.models import Account
from padoc_common.schemas.search import UserSearchResult, UserSearchResultList
from padoc_common.models.enums import UserRoleEnum


async def search_users_by_name(db: AsyncSession, q: str) -> UserSearchResultList:
    """이름으로 사용자 검색."""
    # SQL query to search for users by name
    query = (
        select(Account.id, Account.full_name, Account.login_id)
        .where(Account.full_name.like(f"%{q}%"))
        .where(Account.role == UserRoleEnum.PATIENT)
    )

    result = await db.execute(query)
    users = result.all()

    user_list = []
    for user in users:
        user_list.append(
            UserSearchResult(
                **{"account_id": user[0], "full_name": user[1], "login_id": user[2]}
            )
        )
    return UserSearchResultList(users=user_list)
