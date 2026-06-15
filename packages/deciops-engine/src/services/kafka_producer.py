"""Kafka producer for publishing decision events."""
import json
from typing import Any, Optional

from aiokafka import AIOKafkaProducer

from src.config import get_settings
from src.utils.logging import logger


class KafkaProducer:
    """Async Kafka producer for decision events."""

    def __init__(self):
        self.settings = get_settings()
        self.producer: Optional[AIOKafkaProducer] = None

    async def start(self):
        """Start the Kafka producer."""
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=self.settings.kafka_bootstrap_servers,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            )
            await self.producer.start()
            logger.info("Kafka producer started")
        except Exception as e:
            logger.error(f"Failed to start Kafka producer: {e}")
            self.producer = None

    async def stop(self):
        """Stop the Kafka producer."""
        if self.producer:
            await self.producer.stop()
            logger.info("Kafka producer stopped")

    async def send_decision_event(self, event_type: str, data: dict[str, Any]):
        """Send a decision event to Kafka.

        Args:
            event_type: Type of event (decision_generated, decision_approved, etc.)
            data: Event data including decision_id, tenant_id, etc.
        """
        if not self.producer:
            logger.warning("Kafka producer not started, skipping event")
            return

        try:
            message = {
                "event_type": event_type,
                "data": data,
                "timestamp": data.get("timestamp"),
            }
            await self.producer.send_and_wait(
                self.settings.kafka_topic_decisions,
                value=message,
                key=data.get("decision_id", "").encode("utf-8"),
            )
            logger.info(
                f"Sent Kafka event: {event_type}",
                extra={"decision_id": data.get("decision_id")},
            )
        except Exception as e:
            logger.error(f"Failed to send Kafka event: {e}")


# Global producer instance
kafka_producer = KafkaProducer()