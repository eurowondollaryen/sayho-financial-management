from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserRead(UserBase):
    id: int
    theme_preference: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    theme_preference: Optional[str] = Field(default=None, pattern="^(light|dark)?$")


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: Decimal
    target_date: Optional[date] = None


class GoalCreate(GoalBase):
    contribution_ratio: Optional[float] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[Decimal] = None
    target_date: Optional[date] = None
    status: Optional[str] = None


class GoalMemberRead(BaseModel):
    id: int
    user_id: int
    role: str
    contribution_ratio: Optional[float] = None

    model_config = {"from_attributes": True}


class GoalRead(GoalBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime
    members: list[GoalMemberRead] = []

    model_config = {"from_attributes": True}


class TransactionBase(BaseModel):
    type: str
    amount: Decimal
    category: Optional[str] = None
    occurred_on: date
    memo: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: int
    goal_id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AssetCategoryKind(str, Enum):
    REAL_ESTATE = "real_estate"
    STOCK = "stock"
    DEPOSIT = "deposit"
    LIABILITY = "liability"
    SAVINGS = "savings"


class FundCategoryBase(BaseModel):
    asset_type: AssetCategoryKind
    name: str
    is_active: bool = True
    is_liquid: bool = False
    note: Optional[str] = None


class FundCategoryCreate(FundCategoryBase):
    pass


class FundCategoryUpdate(BaseModel):
    asset_type: Optional[AssetCategoryKind] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    is_liquid: Optional[bool] = None
    note: Optional[str] = None


class FundCategoryRead(FundCategoryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FundSnapshotBase(BaseModel):
    reference_date: date
    amount: Decimal
    category_id: Optional[int] = None


class FundSnapshotCreate(FundSnapshotBase):
    pass


class FundSnapshotUpdate(BaseModel):
    reference_date: Optional[date] = None
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None


class FundSnapshotRead(FundSnapshotBase):
    id: int
    user_id: int
    created_at: datetime
    category: Optional[FundCategoryRead] = None

    model_config = {"from_attributes": True}
