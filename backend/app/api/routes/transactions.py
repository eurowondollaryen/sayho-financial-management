from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ... import models
from ...database import get_session
from ...dependencies import get_current_user
from ...schemas import TransactionCreate, TransactionRead

router = APIRouter()


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    goal_id: int,
    payload: TransactionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> TransactionRead:
    await _ensure_goal_membership(goal_id, current_user.id, session)

    transaction = models.Transaction(
        goal_id=goal_id,
        user_id=current_user.id,
        type=models.TransactionType(payload.type),
        amount=payload.amount,
        category=payload.category,
        occurred_on=payload.occurred_on,
        memo=payload.memo,
    )
    session.add(transaction)
    await session.commit()
    await session.refresh(transaction)
    return TransactionRead.model_validate(transaction)


@router.get("/", response_model=list[TransactionRead])
async def list_transactions(
    goal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> list[TransactionRead]:
    await _ensure_goal_membership(goal_id, current_user.id, session)
    query = (
        select(models.Transaction)
        .where(models.Transaction.goal_id == goal_id)
        .order_by(models.Transaction.occurred_on.desc())
    )
    transactions = (await session.execute(query)).scalars().all()
    return [TransactionRead.model_validate(tx) for tx in transactions]


@router.patch("/{transaction_id}", response_model=TransactionRead)
async def update_transaction(
    goal_id: int,
    transaction_id: int,
    payload: TransactionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> TransactionRead:
    await _ensure_goal_membership(goal_id, current_user.id, session)
    transaction = await _get_transaction(transaction_id, goal_id, session)

    update_data = payload.model_dump(exclude_unset=True)
    if "type" in update_data:
        update_data["type"] = models.TransactionType(update_data["type"])

    await session.execute(
        update(models.Transaction)
        .where(models.Transaction.id == transaction.id)
        .values(**update_data)
    )
    await session.commit()
    updated = await _get_transaction(transaction_id, goal_id, session)
    return TransactionRead.model_validate(updated)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    goal_id: int,
    transaction_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> None:
    await _ensure_goal_membership(goal_id, current_user.id, session)
    await _get_transaction(transaction_id, goal_id, session)

    await session.execute(
        delete(models.Transaction).where(
            models.Transaction.id == transaction_id, models.Transaction.goal_id == goal_id
        )
    )
    await session.commit()


async def _ensure_goal_membership(goal_id: int, user_id: int, session: AsyncSession) -> None:
    query = select(models.GoalMember).where(
        models.GoalMember.goal_id == goal_id, models.GoalMember.user_id == user_id
    )
    membership = (await session.execute(query)).scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not part of this goal")


async def _get_transaction(
    transaction_id: int, goal_id: int, session: AsyncSession
) -> models.Transaction:
    query = select(models.Transaction).options(selectinload(models.Transaction.goal)).where(
        models.Transaction.id == transaction_id, models.Transaction.goal_id == goal_id
    )
    transaction = (await session.execute(query)).scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction
