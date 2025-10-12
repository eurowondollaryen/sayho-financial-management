from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ... import models
from ...database import get_session
from ...dependencies import get_current_user
from ...schemas import PasswordUpdate, UserRead, UserUpdate
from ...security import get_password_hash, verify_password

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def read_me(current_user: models.User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> UserRead:
    if payload.name is not None:
        current_user.name = payload.name
    if payload.theme_preference is not None:
        current_user.theme_preference = payload.theme_preference

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: PasswordUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> None:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is wrong")

    current_user.password_hash = get_password_hash(payload.new_password)
    session.add(current_user)
    await session.commit()


@router.get("/", response_model=list[UserRead])
async def list_users(
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> list[UserRead]:
    query = select(models.User)
    users = (await session.execute(query)).scalars().all()
    return [UserRead.model_validate(user) for user in users]
