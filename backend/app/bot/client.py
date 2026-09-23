import discord
from discord.ext import commands
import json
import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings

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
            btn.callback = self._create_button_callback("accepted")
            self.add_item(btn)

        elif self.step_type == "checklist_item":
            btn = discord.ui.Button(
                label="Mark Item Completed",
                style=discord.ButtonStyle.primary,
                emoji="📌",
                custom_id=f"gp_check_{self.step_id}"
            )
            btn.callback = self._create_button_callback("checked")
            self.add_item(btn)

        elif self.step_type == "welcome_message":
            btn = discord.ui.Button(
                label="Begin Onboarding",
                style=discord.ButtonStyle.success,
                emoji="🚀",
                custom_id=f"gp_welcome_{self.step_id}"
            )
            btn.callback = self._create_button_callback("started")
            self.add_item(btn)

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
    logger.info(f"Member joined: {member.name} in guild {member.guild.name} ({member.guild.id})")
    # Dispatched to database engine in production
