from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ... import models
from ...database import get_session
from ...dependencies import get_current_user
from ...schemas import FundCategoryCreate, FundCategoryRead, FundCategoryUpdate

router = APIRouter()


@router.get("/", response_model=list[FundCategoryRead])
async def list_fund_categories(
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> list[FundCategoryRead]:
    query = (
        select(models.FundCategory)
        .where(models.FundCategory.user_id == current_user.id)
        .order_by(models.FundCategory.is_active.desc(), models.FundCategory.name.asc())
    )
    categories = (await session.execute(query)).scalars().all()
    return [FundCategoryRead.model_validate(category) for category in categories]


@router.post("/", response_model=FundCategoryRead, status_code=status.HTTP_201_CREATED)
async def create_fund_category(
    payload: FundCategoryCreate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> FundCategoryRead:
    category = models.FundCategory(
        user_id=current_user.id,
        asset_type=models.AssetCategoryType(payload.asset_type.value),
        name=payload.name,
        is_active=payload.is_active,
        is_liquid=payload.is_liquid,
        note=payload.note,
    )
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return FundCategoryRead.model_validate(category)


@router.patch("/{category_id}", response_model=FundCategoryRead)
async def update_fund_category(
    category_id: int,
    payload: FundCategoryUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> FundCategoryRead:
    category = await _get_category_for_user(category_id, current_user.id, session)

    update_data = payload.model_dump(exclude_unset=True)
    if "asset_type" in update_data and update_data["asset_type"] is not None:
        update_data["asset_type"] = models.AssetCategoryType(update_data["asset_type"].value)

    if update_data:
        await session.execute(
            update(models.FundCategory).where(models.FundCategory.id == category.id).values(**update_data)
        )
        await session.commit()

    refreshed = await _get_category_for_user(category_id, current_user.id, session)
    return FundCategoryRead.model_validate(refreshed)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fund_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> None:
    await _get_category_for_user(category_id, current_user.id, session)
    await session.execute(
        delete(models.FundCategory).where(
            models.FundCategory.id == category_id, models.FundCategory.user_id == current_user.id
        )
    )
    await session.commit()


async def _get_category_for_user(
    category_id: int,
    user_id: int,
    session: AsyncSession,
) -> models.FundCategory:
    query = select(models.FundCategory).where(
        models.FundCategory.id == category_id,
        models.FundCategory.user_id == user_id,
    )
    category = (await session.execute(query)).scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category
