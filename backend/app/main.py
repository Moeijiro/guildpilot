from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import demo, flows, guilds, members
from app.db.session import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flows.router, prefix=f"{settings.API_V1_STR}/guilds", tags=["flows"])
app.include_router(members.router, prefix=f"{settings.API_V1_STR}/guilds", tags=["members"])
app.include_router(guilds.router, prefix=f"{settings.API_V1_STR}/guilds", tags=["guilds"])
app.include_router(demo.router, prefix=f"{settings.API_V1_STR}/demo", tags=["demo"])

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}
