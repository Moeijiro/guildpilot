"""Demo data: ``python -m app.seed [--reset]``.

Loads the Developer Nexus server, its five-step flow and members at every stage — the same data as the dashboard's "Load demo" button — without the
API running. Seeding is idempotent; ``--reset`` drops every table first.
"""

from __future__ import annotations

import argparse
import asyncio

import app.models  # noqa: F401  (registers every table)
from app.api.routes.demo import seed_demo_data
from app.db.session import AsyncSessionLocal, Base, engine


async def main(reset: bool) -> None:
    async with engine.begin() as conn:
        if reset:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        result = await seed_demo_data(db=db)
    print(result["message"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reset", action="store_true", help="drop all tables before seeding")
    asyncio.run(main(parser.parse_args().reset))
