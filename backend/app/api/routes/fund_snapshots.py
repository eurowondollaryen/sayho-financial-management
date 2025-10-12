from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ... import models
from ...database import get_session
from ...dependencies import get_current_user
from ...schemas import FundSnapshotCreate, FundSnapshotRead, FundSnapshotUpdate

router = APIRouter()


@router.get("/", response_model=list[FundSnapshotRead])
async def list_fund_snapshots(
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> list[FundSnapshotRead]:
    query = (
        select(models.FundSnapshot)
        .where(models.FundSnapshot.user_id == current_user.id)
        .options(selectinload(models.FundSnapshot.category))
        .order_by(models.FundSnapshot.reference_date.desc(), models.FundSnapshot.id.desc())
    )
    snapshots = (await session.execute(query)).scalars().all()
    return [FundSnapshotRead.model_validate(snapshot, from_attributes=True) for snapshot in snapshots]


@router.post("/", response_model=FundSnapshotRead, status_code=status.HTTP_201_CREATED)
async def create_fund_snapshot(
    payload: FundSnapshotCreate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> FundSnapshotRead:
    category_id = payload.category_id
    if category_id is not None:
        await _ensure_category_for_user(category_id, current_user.id, session)

    snapshot = models.FundSnapshot(
        user_id=current_user.id,
        category_id=category_id,
        reference_date=payload.reference_date,
        amount=payload.amount,
    )
    session.add(snapshot)
    await session.commit()
    await session.refresh(snapshot)
    await session.refresh(snapshot, attribute_names=["category"])
    return FundSnapshotRead.model_validate(snapshot, from_attributes=True)


@router.patch("/{snapshot_id}", response_model=FundSnapshotRead)
async def update_fund_snapshot(
    snapshot_id: int,
    payload: FundSnapshotUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> FundSnapshotRead:
    snapshot = await _get_snapshot_for_user(snapshot_id, current_user.id, session)

    update_data = payload.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        category_id = update_data["category_id"]
        if category_id is not None:
            await _ensure_category_for_user(category_id, current_user.id, session)

    if update_data:
        await session.execute(
            update(models.FundSnapshot)
            .where(models.FundSnapshot.id == snapshot.id)
            .values(**update_data)
        )
        await session.commit()

    refreshed = await _get_snapshot_for_user(snapshot_id, current_user.id, session, with_category=True)
    return FundSnapshotRead.model_validate(refreshed, from_attributes=True)


@router.delete("/{snapshot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fund_snapshot(
    snapshot_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> None:
    await _get_snapshot_for_user(snapshot_id, current_user.id, session)
    await session.execute(
        delete(models.FundSnapshot).where(
            models.FundSnapshot.id == snapshot_id, models.FundSnapshot.user_id == current_user.id
        )
    )
    await session.commit()


async def _ensure_category_for_user(
    category_id: int,
    user_id: int,
    session: AsyncSession,
) -> None:
    query = select(models.FundCategory).where(
        models.FundCategory.id == category_id,
        models.FundCategory.user_id == user_id,
    )
    category = (await session.execute(query)).scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


async def _get_snapshot_for_user(
    snapshot_id: int,
    user_id: int,
    session: AsyncSession,
    with_category: bool = False,
) -> models.FundSnapshot:
    query = select(models.FundSnapshot).where(
        models.FundSnapshot.id == snapshot_id,
        models.FundSnapshot.user_id == user_id,
    )
    if with_category:
        query = query.options(selectinload(models.FundSnapshot.category))
    snapshot = (await session.execute(query)).scalar_one_or_none()
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")
    return snapshot
