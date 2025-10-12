from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ... import models
from ...config import get_settings
from ...database import get_session
from ...schemas import Token, UserCreate, UserRead
from ...security import create_access_token, get_password_hash, verify_password

router = APIRouter()


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, session: AsyncSession = Depends(get_session)) -> UserRead:
    query = select(models.User).where(models.User.email == payload.email)
    existing_user = (await session.execute(query)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=payload.email,
        name=payload.name,
        password_hash=get_password_hash(payload.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
) -> Token:
    query = select(models.User).where(models.User.email == form_data.username)
    user = (await session.execute(query)).scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    settings = get_settings()
    access_token = create_access_token(
        {"sub": str(user.id)}, timedelta(minutes=settings.access_token_expire_minutes)
    )
    return Token(access_token=access_token)
