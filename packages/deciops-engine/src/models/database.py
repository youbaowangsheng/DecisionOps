from typing import Optional
"""SQLAlchemy database models."""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.config import get_settings


class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all models."""

    pass


class ScenarioConfigModel(Base):
    """Scenario configuration table."""

    __tablename__ = "scenario_config"

    scenario_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    tenant_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    trigger_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    input_bindings: Mapped[dict] = mapped_column(JSONB, default=dict)
    analysis_agents: Mapped[list] = mapped_column(JSONB, default=list)
    synthesis_rules: Mapped[dict] = mapped_column(JSONB, default=dict)
    audit_policy: Mapped[dict] = mapped_column(JSONB, default=dict)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class DecisionCardModel(Base):
    """Decision card table."""

    __tablename__ = "decision_card"

    decision_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    tenant_id: Mapped[str] = mapped_column(String(64), nullable=False)
    scenario_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("scenario_config.scenario_id"), nullable=False
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), default="pending")
    confidence: Mapped[float] = mapped_column(nullable=True)
    judgment: Mapped[dict] = mapped_column(JSONB, default=dict)
    suggested_actions: Mapped[list] = mapped_column(JSONB, default=list)
    conflict_info: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


class TaskModel(Base):
    """Task table."""

    __tablename__ = "task"

    task_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(64), nullable=False)
    task_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)


# Database engine and session factory
settings = get_settings()
engine = create_async_engine(settings.db_url, echo=False)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db_session():
    """Get async database session."""
    async with async_session_maker() as session:
        yield session