from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ... import models
from ...database import get_session
from ...dependencies import get_current_user
from ...schemas import GoalCreate, GoalRead, GoalUpdate

router = APIRouter()


@router.post("/", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: GoalCreate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> GoalRead:
    goal = models.Goal(
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        target_amount=payload.target_amount,
        target_date=payload.target_date,
    )
    session.add(goal)
    await session.flush()

    owner_member = models.GoalMember(
        goal_id=goal.id,
        user_id=current_user.id,
        role="owner",
        contribution_ratio=payload.contribution_ratio,
    )
    session.add(owner_member)

    await session.commit()
    await session.refresh(goal)
    return await _goal_to_schema(goal, session)


@router.get("/", response_model=list[GoalRead])
async def list_goals(
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> list[GoalRead]:
    query = (
        select(models.Goal)
        .join(models.GoalMember)
        .where(models.GoalMember.user_id == current_user.id)
        .options(selectinload(models.Goal.members))
    )
    goals = (await session.execute(query)).scalars().all()
    return [await _goal_to_schema(goal, session) for goal in goals]


@router.get("/{goal_id}", response_model=GoalRead)
async def get_goal(
    goal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> GoalRead:
    goal = await _get_goal_for_user(goal_id, current_user.id, session)
    return await _goal_to_schema(goal, session)


@router.patch("/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> GoalRead:
    goal = await _get_goal_for_user(goal_id, current_user.id, session, require_owner=True)

    update_data = payload.model_dump(exclude_unset=True)
    if update_data:
        await session.execute(
            update(models.Goal).where(models.Goal.id == goal.id).values(**update_data)
        )
        await session.commit()

    refreshed_goal = await _get_goal_for_user(goal_id, current_user.id, session)
    return await _goal_to_schema(refreshed_goal, session)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: models.User = Depends(get_current_user),
) -> None:
    await _get_goal_for_user(goal_id, current_user.id, session, require_owner=True)
    await session.execute(delete(models.Goal).where(models.Goal.id == goal_id))
    await session.commit()


async def _get_goal_for_user(
    goal_id: int,
    user_id: int,
    session: AsyncSession,
    require_owner: bool = False,
) -> models.Goal:
    query = (
        select(models.Goal)
        .options(selectinload(models.Goal.members))
        .where(models.Goal.id == goal_id)
    )
    goal = (await session.execute(query)).scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    membership_query = select(models.GoalMember).where(
        models.GoalMember.goal_id == goal_id, models.GoalMember.user_id == user_id
    )
    membership = (await session.execute(membership_query)).scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this goal")

    if require_owner and membership.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner privileges required")
    return goal


async def _goal_to_schema(goal: models.Goal, session: AsyncSession) -> GoalRead:
    await session.refresh(goal, attribute_names=["members"])
    return GoalRead.model_validate(goal)
