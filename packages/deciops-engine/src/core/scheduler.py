"""Scheduler for automated decision triggering."""
import asyncio
from datetime import datetime
from typing import Any, Optional

import httpx

from src.config import get_settings
from src.core.engine import DecisionEngine
from src.models.database import ScenarioConfigModel, async_session_maker
from src.utils.logging import logger


class Scheduler:
    """Scheduler for time-based and event-based decision triggers."""

    def __init__(self):
        self.settings = get_settings()
        self.engine = DecisionEngine()
        self._running = False
        self._tasks: list[asyncio.Task] = []

    async def start_scheduled_trigger(self):
        """Start the scheduled trigger loop (XXL-JOB style)."""
        self._running = True
        logger.info("Starting scheduled trigger loop")

        while self._running:
            try:
                await self._process_scheduled_jobs()
            except Exception as e:
                logger.error(f"Error in scheduled trigger loop: {e}")

            # Sleep for 60 seconds before next check
            await asyncio.sleep(60)

    async def stop_scheduled_trigger(self):
        """Stop the scheduled trigger loop."""
        self._running = False
        for task in self._tasks:
            task.cancel()
        logger.info("Stopped scheduled trigger loop")

    async def _process_scheduled_jobs(self):
        """Process scheduled jobs from XXL-JOB."""
        async with async_session_maker() as session:
            from sqlalchemy import select

            stmt = select(ScenarioConfigModel).where(ScenarioConfigModel.enabled == True)
            result = await session.execute(stmt)
            scenarios = result.scalars().all()

            for scenario in scenarios:
                trigger_config = scenario.trigger_config or {}
                trigger_type = trigger_config.get("type")

                if trigger_type == "cron":
                    # Check if cron expression matches current time
                    cron_expr = trigger_config.get("expression")
                    if self._should_trigger_cron(cron_expr):
                        asyncio.create_task(
                            self._trigger_scenario(scenario.scenario_id, scenario.tenant_id)
                        )

                elif trigger_type == "interval":
                    # Check interval-based triggers
                    interval_seconds = trigger_config.get("interval_seconds", 300)
                    last_trigger = trigger_config.get("last_trigger")

                    if last_trigger:
                        last_time = datetime.fromisoformat(last_trigger)
                        elapsed = (datetime.utcnow() - last_time).total_seconds()
                        if elapsed >= interval_seconds:
                            asyncio.create_task(
                                self._trigger_scenario(scenario.scenario_id, scenario.tenant_id)
                            )

    async def _trigger_scenario(self, scenario_id: str, tenant_id: str):
        """Trigger a scenario decision generation."""
        try:
            await self.engine.generate_decision(
                scenario_id=scenario_id, tenant_id=tenant_id
            )
            logger.info(f"Scheduled trigger completed for scenario {scenario_id}")
        except Exception as e:
            logger.error(f"Failed to trigger scenario {scenario_id}: {e}")

    async def handle_event_trigger(self, event: dict[str, Any]):
        """Handle event-triggered decision generation.

        Args:
            event: Event dictionary with event_type, scenario_id, tenant_id, etc.
        """
        event_type = event.get("event_type")
        scenario_id = event.get("scenario_id")
        tenant_id = event.get("tenant_id")

        logger.info(f"Handling event trigger: {event_type}", extra={"scenario_id": scenario_id})

        if not scenario_id or not tenant_id:
            logger.warning("Event missing scenario_id or tenant_id")
            return

        try:
            await self.engine.generate_decision(
                scenario_id=scenario_id, tenant_id=tenant_id
            )
            logger.info(f"Event-triggered decision completed for scenario {scenario_id}")
        except Exception as e:
            logger.error(f"Failed to handle event trigger for scenario {scenario_id}: {e}")

    async def check_data_freshness(self):
        """Check data freshness and trigger re-analysis if needed."""
        async with async_session_maker() as session:
            from sqlalchemy import select

            stmt = select(ScenarioConfigModel).where(ScenarioConfigModel.enabled == True)
            result = await session.execute(stmt)
            scenarios = result.scalars().all()

            for scenario in scenarios:
                trigger_config = scenario.trigger_config or {}
                freshness_config = trigger_config.get("data_freshness")

                if not freshness_config:
                    continue

                max_age_minutes = freshness_config.get("max_age_minutes", 30)
                # In production, check actual data freshness with data platform
                # For now, assume this would query the data platform

                logger.info(
                    f"Checking data freshness for scenario {scenario.scenario_id}: max age = {max_age_minutes} minutes"
                )

    def _should_trigger_cron(self, cron_expr: Optional[str]) -> bool:
        """Check if cron expression matches current time.

        Simplified implementation. Production would use proper cron parsing.
        """
        if not cron_expr:
            return False

        # Simple cron check: "*/5 * * * *" = every 5 minutes
        now = datetime.utcnow()
        parts = cron_expr.split()

        if len(parts) != 5:
            return False

        minute = int(parts[0].replace("*", "0"))
        if parts[0] == "*":
            return True
        if parts[0].startswith("*/"):
            interval = int(parts[0][2:])
            return now.minute % interval == 0

        return now.minute == minute