"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from prometheus_client import Counter, Histogram, generate_latest, REGISTRY
from prometheus_client.exposition import CONTENT_TYPE_LATEST
from starlette.responses import Response

from src.api.routes import decisions, scenarios, tasks
from src.config import get_settings
from src.core.scheduler import Scheduler
from src.models.database import init_db
from src.services.kafka_producer import kafka_producer
from src.utils.logging import logger, setup_logging
from src.utils.tracing import setup_tracing


def _create_metrics():
    """Create prometheus metrics with duplicate handling."""
    # Check if metrics already exist to avoid duplicate registration
    # in uvicorn reload mode
    if "decision_generated_total" in REGISTRY._names_to_collectors:
        decision_generated_total = REGISTRY._names_to_collectors["decision_generated_total"]
    else:
        decision_generated_total = Counter(
            "decision_generated_total",
            "Total number of decisions generated",
            ["tenant_id", "scenario_id", "status"],
        )

    if "decision_generation_duration_seconds" in REGISTRY._names_to_collectors:
        decision_generation_duration_seconds = REGISTRY._names_to_collectors["decision_generation_duration_seconds"]
    else:
        decision_generation_duration_seconds = Histogram(
            "decision_generation_duration_seconds",
            "Time spent generating decisions",
            ["tenant_id", "scenario_id"],
        )

    return decision_generated_total, decision_generation_duration_seconds


# Prometheus metrics
decision_generated_total, decision_generation_duration_seconds = _create_metrics()

# Global scheduler instance
scheduler = Scheduler()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    setup_logging()
    setup_tracing()
    logger.info("Starting deciops-engine")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Start Kafka producer
    try:
        await kafka_producer.start()
    except Exception as e:
        logger.warning(f"Failed to start Kafka producer: {e}")

    # Start scheduler in background
    # scheduler_task = asyncio.create_task(scheduler.start_scheduled_trigger())

    yield

    # Shutdown
    logger.info("Shutting down deciops-engine")
    await kafka_producer.stop()
    await scheduler.stop_scheduled_trigger()


settings = get_settings()

app = FastAPI(
    title="DecisionOps Engine",
    description="Decision Analysis Engine Microservice",
    version="1.0.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(decisions.router)
app.include_router(scenarios.router)
app.include_router(tasks.router)


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "service": "deciops-engine"}


@app.get("/metrics")
async def metrics() -> Response:
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=False,
    )