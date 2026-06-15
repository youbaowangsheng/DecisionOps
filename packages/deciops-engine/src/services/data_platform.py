"""Data platform service for querying metrics and data."""
from datetime import datetime
from typing import Any

import httpx

from src.config import get_settings
from src.models.schemas import DataSample, MetricResult, SemanticContext
from src.utils.logging import logger


class DataPlatformService:
    """Service for interacting with the data platform."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.data_platform_url

    async def query_metrics(
        self, metrics: list[str], time_range: dict[str, Any]
    ) -> list[MetricResult]:
        """Query metrics from the data platform.

        Args:
            metrics: List of metric names to query
            time_range: Time range specification with start/end datetimes

        Returns:
            List of metric results
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/metrics/query",
                    json={
                        "metrics": metrics,
                        "start_time": time_range.get("start"),
                        "end_time": time_range.get("end"),
                    },
                )
                response.raise_for_status()
                data = response.json()
                return [
                    MetricResult(
                        metric_name=r["metric_name"],
                        value=r["value"],
                        timestamp=datetime.fromisoformat(r["timestamp"]),
                        labels=r.get("labels", {}),
                    )
                    for r in data.get("results", [])
                ]
            except httpx.HTTPError as e:
                logger.error(f"Failed to query metrics: {e}")
                return []

    async def probe_dataset(self, dataset: str, limit: int = 20) -> DataSample:
        """Probe a dataset to get sample data.

        Args:
            dataset: Dataset identifier
            limit: Maximum number of rows to return

        Returns:
            Data sample with rows and metadata
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/datasets/{dataset}/probe",
                    params={"limit": limit},
                )
                response.raise_for_status()
                data = response.json()
                return DataSample(
                    dataset=dataset,
                    rows=data.get("rows", []),
                    total_count=data.get("total_count", 0),
                )
            except httpx.HTTPError as e:
                logger.error(f"Failed to probe dataset {dataset}: {e}")
                return DataSample(dataset=dataset, rows=[], total_count=0)

    async def get_semantic_context(self, entities: list[dict]) -> SemanticContext:
        """Get semantic context for entities.

        Args:
            entities: List of entity dictionaries with type and id

        Returns:
            Semantic context including relationships and context data
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/semantic/context",
                    json={"entities": entities},
                )
                response.raise_for_status()
                data = response.json()
                return SemanticContext(
                    entities=data.get("entities", []),
                    relationships=data.get("relationships", []),
                    context_data=data.get("context_data", {}),
                )
            except httpx.HTTPError as e:
                logger.error(f"Failed to get semantic context: {e}")
                return SemanticContext(entities=entities, relationships=[], context_data={})