from fastapi import APIRouter
from app.api.v1.endpoints import flows, members, guilds, demo

api_router = APIRouter()

api_router.include_router(flows.router, prefix="/guilds", tags=["flows"])
api_router.include_router(members.router, prefix="/guilds", tags=["members"])
api_router.include_router(guilds.router, prefix="/guilds", tags=["guilds"])
api_router.include_router(demo.router, prefix="/demo", tags=["demo"])
