from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router
from .config import SettingsDTO, get_settings
from .database import engine
from .models import Base

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
if origins and "*" in origins:
    origins = ["*"]
elif settings.environment != "production" and "*" not in origins:
    origins.append("*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
async def on_startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/healthz", response_model=SettingsDTO, tags=["system"])
async def healthcheck() -> SettingsDTO:
    return SettingsDTO(
        app_name=settings.app_name,
        environment=settings.environment,
        debug=settings.debug,
    )
