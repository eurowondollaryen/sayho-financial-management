from datetime import datetime, date
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Date,
    DateTime,
    Enum as SqlEnum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Boolean,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class PartnerLinkStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    DECLINED = "declined"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"


class AssetCategoryType(str, Enum):
    REAL_ESTATE = "real_estate"
    STOCK = "stock"
    DEPOSIT = "deposit"
    LIABILITY = "liability"
    SAVINGS = "savings"


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    theme_preference: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    goals_owned: Mapped[list["Goal"]] = relationship(back_populates="owner")
    memberships: Mapped[list["GoalMember"]] = relationship(back_populates="user")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")
    fund_categories: Mapped[list["FundCategory"]] = relationship(back_populates="user")
    fund_snapshots: Mapped[list["FundSnapshot"]] = relationship(back_populates="user")


class PartnerLink(Base):
    __tablename__ = "partner_link"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inviter_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    invitee_email: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[PartnerLinkStatus] = mapped_column(
        SqlEnum(PartnerLinkStatus), default=PartnerLinkStatus.PENDING
    )
    invite_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    inviter: Mapped[User] = relationship("User", foreign_keys=[inviter_id])


class Goal(Base):
    __tablename__ = "goal"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[GoalStatus] = mapped_column(
        SqlEnum(GoalStatus), default=GoalStatus.ACTIVE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    owner: Mapped[User] = relationship("User", back_populates="goals_owned")
    members: Mapped[list["GoalMember"]] = relationship(back_populates="goal")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="goal")


class GoalMember(Base):
    __tablename__ = "goal_member"
    __table_args__ = (UniqueConstraint("goal_id", "user_id", name="uq_goal_member"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goal.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="partner")
    contribution_ratio: Mapped[Float | None] = mapped_column(Float, nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    goal: Mapped[Goal] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="memberships")
    contributions: Mapped[list["GoalContribution"]] = relationship(back_populates="member")


class Transaction(Base):
    __tablename__ = "transaction"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goal.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    type: Mapped[TransactionType] = mapped_column(SqlEnum(TransactionType), nullable=False)
    amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)
    category: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    occurred_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    goal: Mapped[Goal] = relationship(back_populates="transactions")
    user: Mapped[User] = relationship(back_populates="transactions")
    contributions: Mapped[list["GoalContribution"]] = relationship(back_populates="transaction")


class GoalContribution(Base):
    __tablename__ = "goal_contribution"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    transaction_id: Mapped[int] = mapped_column(ForeignKey("transaction.id"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("goal_member.id"), nullable=False)
    share_amount: Mapped[Numeric] = mapped_column(Numeric(12, 2), nullable=False)

    transaction: Mapped[Transaction] = relationship(back_populates="contributions")
    member: Mapped[GoalMember] = relationship(back_populates="contributions")


class MonthlySummary(Base):
    __tablename__ = "monthly_summary"
    __table_args__ = (UniqueConstraint("goal_id", "month_start", name="uq_summary_goal_month"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goal.id"), nullable=False)
    month_start: Mapped[date] = mapped_column(Date, nullable=False)
    total_deposit: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    total_withdrawal: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)
    net_saved: Mapped[Numeric] = mapped_column(Numeric(12, 2), default=0)

    goal: Mapped[Goal] = relationship("Goal")


class FundCategory(Base):
    __tablename__ = "fund_category"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    asset_type: Mapped[AssetCategoryType] = mapped_column(SqlEnum(AssetCategoryType), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped[User] = relationship(back_populates="fund_categories")
    snapshots: Mapped[list["FundSnapshot"]] = relationship(back_populates="category")


class FundSnapshot(Base):
    __tablename__ = "fund_snapshot"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("fund_category.id"), nullable=True)
    reference_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    amount: Mapped[Numeric] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="fund_snapshots")
    category: Mapped[Optional["FundCategory"]] = relationship(back_populates="snapshots")
