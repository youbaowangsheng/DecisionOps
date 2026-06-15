"""API dependency injection."""
from typing import Annotated, AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.engine import DecisionEngine
from src.core.scheduler import Scheduler
from src.models.database import get_db_session
from src.services.agent_platform import AgentPlatformService
from src.services.data_platform import DataPlatformService


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async for session in get_db_session():
        yield session


def get_decision_engine() -> DecisionEngine:
    """Get decision engine dependency."""
    return DecisionEngine()


def get_scheduler() -> Scheduler:
    """Get scheduler dependency."""
    return Scheduler()


def get_data_platform_service() -> DataPlatformService:
    """Get data platform service dependency."""
    return DataPlatformService()


def get_agent_platform_service() -> AgentPlatformService:
    """Get agent platform service dependency."""
    return AgentPlatformService()


# Type aliases for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]
DecisionEngineDep = Annotated[DecisionEngine, Depends(get_decision_engine)]
SchedulerDep = Annotated[Scheduler, Depends(get_scheduler)]
DataPlatformDep = Annotated[DataPlatformService, Depends(get_data_platform_service)]
AgentPlatformDep = Annotated[AgentPlatformService, Depends(get_agent_platform_service)]