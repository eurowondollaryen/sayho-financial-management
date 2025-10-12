import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.main import app
from app.database import engine, AsyncSessionLocal
from app.models import Base


@pytest_asyncio.fixture(autouse=True)
async def prepare_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def session():
    async with AsyncSessionLocal() as session:
        yield session
