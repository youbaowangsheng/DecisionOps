"""Mock data platform service for testing without external dependencies."""
import random
from datetime import datetime
from typing import Any

from src.models.schemas import DataSample, MetricResult, SemanticContext


class MockDataPlatformService:
    """Mock implementation of DataPlatformService for testing.

    Simulates data platform responses without making HTTP calls.
    """

    def __init__(self):
        self._metrics_cache: dict[str, float] = {}
        self._datasets_cache: dict[str, list[dict]] = {}

    async def query_metrics(
        self, metrics: list[str], time_range: dict[str, Any]
    ) -> list[MetricResult]:
        """Simulate metric queries with realistic random data.

        Args:
            metrics: List of metric names to query
            time_range: Time range specification

        Returns:
            List of metric results with realistic values
        """
        results = []
        for metric_name in metrics:
            # Generate realistic metric values based on metric type
            if "revenue" in metric_name.lower():
                value = random.uniform(10000, 100000)
            elif "order" in metric_name.lower() or "count" in metric_name.lower():
                value = random.uniform(100, 1000)
            elif "rate" in metric_name.lower() or "percent" in metric_name.lower():
                value = random.uniform(0.1, 0.99)
            elif "latency" in metric_name.lower() or "time" in metric_name.lower():
                value = random.uniform(10, 500)
            else:
                value = random.uniform(0, 100)

            results.append(
                MetricResult(
                    metric_name=metric_name,
                    value=value,
                    timestamp=datetime.utcnow(),
                    labels={"environment": "production", "region": "us-west"},
                )
            )
        return results

    async def probe_dataset(self, dataset: str, limit: int = 20) -> DataSample:
        """Simulate dataset probing with realistic sample data.

        Args:
            dataset: Dataset identifier
            limit: Maximum number of rows

        Returns:
            Data sample with realistic rows
        """
        # Generate realistic sample data based on dataset name
        rows = []
        if "sales" in dataset.lower():
            for i in range(min(limit, 10)):
                rows.append({
                    "id": f"sale-{i}",
                    "amount": round(random.uniform(10, 1000), 2),
                    "quantity": random.randint(1, 100),
                    "product_id": f"prod-{random.randint(100, 999)}",
                    "timestamp": datetime.utcnow().isoformat(),
                })
        elif "user" in dataset.lower() or "customer" in dataset.lower():
            for i in range(min(limit, 10)):
                rows.append({
                    "id": f"user-{i}",
                    "name": f"User {i}",
                    "email": f"user{i}@example.com",
                    "created_at": datetime.utcnow().isoformat(),
                })
        else:
            for i in range(min(limit, 10)):
                rows.append({
                    "id": f"row-{i}",
                    "value": round(random.uniform(0, 100), 2),
                    "category": random.choice(["A", "B", "C"]),
                    "timestamp": datetime.utcnow().isoformat(),
                })

        return DataSample(
            dataset=dataset,
            rows=rows,
            total_count=random.randint(100, 10000),
        )

    async def get_semantic_context(self, entities: list[dict]) -> SemanticContext:
        """Simulate semantic context retrieval.

        Args:
            entities: List of entity dictionaries

        Returns:
            Semantic context with relationships
        """
        sem_entities = []
        relationships = []

        for entity in entities:
            entity_type = entity.get("type", "unknown")
            entity_id = entity.get("id", "unknown")

            sem_entities.append({
                "type": entity_type,
                "id": entity_id,
                "name": f"{entity_type}-{entity_id}",
                "properties": {
                    "created": datetime.utcnow().isoformat(),
                    "status": random.choice(["active", "pending", "completed"]),
                },
            })

            # Add some relationships
            relationships.append({
                "from": entity_id,
                "to": f"related-{entity_id}",
                "type": "related_to",
                "strength": round(random.uniform(0.5, 1.0), 2),
            })

        return SemanticContext(
            entities=sem_entities,
            relationships=relationships,
            context_data={
                "total_entities": len(sem_entities),
                "total_relationships": len(relationships),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


# Global mock instance
mock_data_platform = MockDataPlatformService()
