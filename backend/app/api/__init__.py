from fastapi import APIRouter

from .routes import auth, goals, transactions, users, fund_categories, fund_snapshots

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(transactions.router, prefix="/goals/{goal_id}/transactions", tags=["transactions"])
api_router.include_router(fund_categories.router, prefix="/fund-categories", tags=["fund-categories"])
api_router.include_router(fund_snapshots.router, prefix="/fund-snapshots", tags=["fund-snapshots"])
