"""Run the GuildPilot Discord bot: ``python -m app.bot`` (needs DISCORD_BOT_TOKEN).

The bot shares the API's database, so run it next to the API (``make api``).
"""

import asyncio
import sys

import app.models  # noqa: F401  (registers every table)
from app.bot.client import bot
from app.core.config import settings
from app.db.session import Base, engine


async def _prepare_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def main() -> None:
    if not settings.DISCORD_BOT_TOKEN:
        sys.exit("Set DISCORD_BOT_TOKEN in .env first (Discord developer portal → your app → Bot → Token).")
    asyncio.run(_prepare_database())
    bot.run(settings.DISCORD_BOT_TOKEN)


if __name__ == "__main__":
    main()
