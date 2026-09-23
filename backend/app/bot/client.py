import discord
from discord.ext import commands
import json
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models import OnboardingFlow, OnboardingStep
from app.services.engine import StepRejected, get_or_create_member_onboarding, interpolate_template, process_step_completion

logger = logging.getLogger(__name__)

intents = discord.Intents.default()
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix="!gp ", intents=intents)

class OnboardingStepView(discord.ui.View):
    def __init__(self, step_id: int, step_type: str, options: List[Dict[str, Any]], callback_fn):
        super().__init__(timeout=None)
        self.step_id = step_id
        self.step_type = step_type
        self.options = options
        self.callback_fn = callback_fn
        self._build_components()

    def _build_components(self):
        if self.step_type in ["button_choice", "role_selection"]:
            for opt in self.options[:5]:
                btn = discord.ui.Button(
                    label=opt.get("label", "Option"),
                    style=discord.ButtonStyle.primary if not opt.get("emoji") else discord.ButtonStyle.secondary,
                    custom_id=f"gp_btn_{self.step_id}_{opt.get('key')}"
                )
                btn.callback = self._create_button_callback(opt.get("key"))
                self.add_item(btn)

        elif self.step_type == "select_menu":
            select_options = [
                discord.SelectOption(
                    label=opt.get("label", "Option"),
                    value=opt.get("key", "val"),
                    description=opt.get("description", "")[:100] or None,
                    emoji=opt.get("emoji") or None
                )
                for opt in self.options[:25]
            ]
            sel = discord.ui.Select(
                placeholder="Choose your preferences...",
                min_values=1,
                max_values=min(len(select_options), 5),
                options=select_options,
                custom_id=f"gp_sel_{self.step_id}"
            )
            sel.callback = self._select_callback
            self.add_item(sel)

        elif self.step_type == "rules_confirm":
            btn = discord.ui.Button(
                label="I Agree & Accept Server Rules",
                style=discord.ButtonStyle.success,
                emoji="✅",
                custom_id=f"gp_rules_{self.step_id}"
            )
            btn.callback = self._create_button_callback(self._first_key("accepted"))
            self.add_item(btn)

        elif self.step_type == "checklist_item":
            btn = discord.ui.Button(
                label="Mark Item Completed",
                style=discord.ButtonStyle.primary,
                emoji="📌",
                custom_id=f"gp_check_{self.step_id}"
            )
            btn.callback = self._create_button_callback(self._first_key("checked"))
            self.add_item(btn)

        elif self.step_type == "welcome_message":
            btn = discord.ui.Button(
                label="Begin Onboarding",
                style=discord.ButtonStyle.success,
                emoji="🚀",
                custom_id=f"gp_welcome_{self.step_id}"
            )
            btn.callback = self._create_button_callback(self._first_key("started"))
            self.add_item(btn)

    def _first_key(self, fallback: str) -> str:
        """Single-button steps answer with their own option key; the engine rejects anything else."""
        return self.options[0].get("key", fallback) if self.options else fallback

    def _create_button_callback(self, key: str):
        async def button_callback(interaction: discord.Interaction):
            await interaction.response.defer(ephemeral=True)
            if self.callback_fn:
                await self.callback_fn(interaction, self.step_id, key)
        return button_callback

    async def _select_callback(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        select_item: discord.ui.Select = self.children[0]  # type: ignore
        if self.callback_fn:
            await self.callback_fn(interaction, self.step_id, select_item.values)

@bot.event
async def on_ready():
    logger.info(f"GuildPilot Discord Bot logged in as {bot.user} (ID: {bot.user.id if bot.user else 0})")

@bot.event
async def on_member_join(member: discord.Member):
    """Start the member's journey and DM them the first step of the active flow."""
    guild_id = str(member.guild.id)
    async with AsyncSessionLocal() as db:
        steps = await _active_steps(db, guild_id)
        if not steps:
            logger.info("No onboarding flow for guild %s; skipping %s", guild_id, member)
            return
        onboarding = await get_or_create_member_onboarding(
            guild_id, str(member.id), member.name, member.display_avatar.url if member.display_avatar else None, db
        )
        await _send_step(member, guild_id, steps, onboarding.current_step_index)


async def _active_steps(db, guild_id: str) -> List[OnboardingStep]:
    flow = (await db.execute(select(OnboardingFlow).where(
        OnboardingFlow.guild_id == guild_id, OnboardingFlow.is_active == True  # noqa: E712
    ))).scalar_one_or_none()
    if flow is None:
        return []
    return list((await db.execute(
        select(OnboardingStep).where(OnboardingStep.flow_id == flow.id).order_by(OnboardingStep.step_order)
    )).scalars())


async def _send_step(user: discord.abc.User, guild_id: str, steps: List[OnboardingStep], index: int) -> None:
    if index >= len(steps):
        return
    step = steps[index]
    guild = bot.get_guild(int(guild_id)) if guild_id.isdigit() else None
    server = guild.name if guild else "the server"
    text = lambda t: interpolate_template(t, user.name, server, guild.member_count if guild else 1)  # noqa: E731
    embed = discord.Embed(title=text(step.title), description=text(step.description), color=0x5865F2)
    embed.set_footer(text=f"Step {index + 1} of {len(steps)}")
    options = json.loads(step.options_json) if step.options_json else []

    async def answer(interaction: discord.Interaction, step_id: int, key):
        await _handle_answer(interaction, guild_id, step_id, key)

    try:
        await user.send(embed=embed, view=OnboardingStepView(step.id, step.step_type, options, answer))
    except discord.Forbidden:
        logger.warning("Can't DM %s (DMs closed); onboarding waits until they open DMs", user)


def _resolve_role(guild: discord.Guild, role_ref: str) -> Optional[discord.Role]:
    """Options may name a role by Discord ID or by name ("role-member-verified" matches "Member Verified")."""
    if role_ref.isdigit():
        return guild.get_role(int(role_ref))
    wanted = role_ref.removeprefix("role-").replace("-", " ").lower()
    return discord.utils.find(lambda r: r.name.lower() == wanted, guild.roles)


async def _handle_answer(interaction: discord.Interaction, guild_id: str, step_id: int, key) -> None:
    async with AsyncSessionLocal() as db:
        try:
            member_row, finished, new_roles = await process_step_completion(guild_id, str(interaction.user.id), step_id, key, db)
        except StepRejected as exc:
            await interaction.followup.send(str(exc), ephemeral=True)
            return
        except ValueError:
            await interaction.followup.send("This step is no longer part of the onboarding flow.", ephemeral=True)
            return
        steps = await _active_steps(db, guild_id)

    guild = bot.get_guild(int(guild_id)) if guild_id.isdigit() else None
    member = guild.get_member(interaction.user.id) if guild else None
    if member and new_roles:
        roles = [r for r in (_resolve_role(guild, ref) for ref in new_roles) if r is not None]
        if roles:
            try:
                await member.add_roles(*roles, reason="GuildPilot onboarding")
            except discord.Forbidden:
                logger.warning("Missing permission to assign %s in %s", roles, guild)

    if finished:
        await interaction.followup.send("You're all set — welcome in! 🎉")
    else:
        await _send_step(interaction.user, guild_id, steps, member_row.current_step_index)
