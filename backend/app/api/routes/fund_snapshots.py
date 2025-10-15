from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ... import models
from ...database import get_session
from ...dependencies import get_current_user
from ...schemas import FundSnapshotCreate, FundSnapshotRead, FundSnapshotUpdate
from ...utils.xlsx import extract_rows_from_workbook, snapshot_template_bytes

router = APIRouter()

TEMPLATE_FILENAME = "fund_snapshots_template.xlsx"


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


@router.get("/template")
async def download_snapshot_template() -> StreamingResponse:
    buffer = BytesIO(snapshot_template_bytes())
    buffer.seek(0)
    headers = {
        "Content-Disposition": f'attachment; filename="{TEMPLATE_FILENAME}"',
        "Cache-Control": "no-store",
    }
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.post("/import", response_model=list[FundSnapshotRead], status_code=status.HTTP_201_CREATED)
async def import_fund_snapshots(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> list[FundSnapshotRead]:
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    try:
        parsed_rows = extract_rows_from_workbook(contents)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Excel file.") from exc
    if len(parsed_rows) <= 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data rows found in the file.")

    categories = await _get_categories_for_user(current_user.id, session)
    category_map = {category.name.strip().lower(): category for category in categories if category.name}

    snapshots_to_create: list[models.FundSnapshot] = []
    data_rows = parsed_rows[1:]
    for row_index, row in enumerate(data_rows, start=2):
        normalized = _normalize_row(row or [])
        reference_value, category_value, amount_value = (normalized + ["", "", ""])[:3]

        if not any([reference_value, category_value, amount_value]):
            continue

        reference_date = _parse_reference_date(reference_value, row_index)
        amount = _parse_amount(amount_value, row_index)

        category_id = None
        if category_value is not None and str(category_value).strip():
            category_key = str(category_value).strip().lower()
            match = category_map.get(category_key)
            if not match:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Row {row_index}: Unknown category '{category_value}'.",
                )
            category_id = match.id

        snapshots_to_create.append(
            models.FundSnapshot(
                user_id=current_user.id,
                category_id=category_id,
                reference_date=reference_date,
                amount=amount,
            )
        )

    if not snapshots_to_create:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid data rows were found.")

    session.add_all(snapshots_to_create)
    await session.commit()

    ids = [snapshot.id for snapshot in snapshots_to_create]
    query = (
        select(models.FundSnapshot)
        .where(models.FundSnapshot.id.in_(ids))
        .options(selectinload(models.FundSnapshot.category))
        .order_by(models.FundSnapshot.reference_date.desc(), models.FundSnapshot.id.desc())
    )
    created_snapshots = (await session.execute(query)).scalars().all()
    return [FundSnapshotRead.model_validate(snapshot, from_attributes=True) for snapshot in created_snapshots]


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


async def _get_categories_for_user(user_id: int, session: AsyncSession) -> list[models.FundCategory]:
    query = select(models.FundCategory).where(models.FundCategory.user_id == user_id)
    return (await session.execute(query)).scalars().all()


def _parse_reference_date(value: object, row_index: int) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {row_index}: Reference date is required.",
            )
        try:
            return datetime.strptime(stripped, "%Y-%m-%d").date()
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {row_index}: Invalid date format '{value}'. Use YYYY-MM-DD.",
            ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Row {row_index}: Invalid reference date value.",
    )


def _parse_amount(value: object, row_index: int) -> Decimal:
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Row {row_index}: Amount is required.",
        )

    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, str):
        stripped = value.strip().replace(",", "")
        if not stripped:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {row_index}: Amount is required.",
            )
        try:
            return Decimal(stripped)
        except (InvalidOperation, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {row_index}: Invalid amount '{value}'.",
            ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Row {row_index}: Invalid amount value.",
    )


def _normalize_row(row: list[str] | tuple[str, ...]) -> list[str]:
    normalized: list[str] = []
    for value in row:
        if value is None:
            normalized.append("")
        else:
            normalized.append(str(value).strip())
    return normalized
