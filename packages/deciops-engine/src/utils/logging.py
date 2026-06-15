"""Structured logging with JSON format."""
import json
import logging
import sys
from datetime import datetime
from typing import Any
from uuid import UUID


class JSONFormatter(logging.Formatter):
    """JSON log formatter."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields
        if hasattr(record, "trace_id"):
            log_data["trace_id"] = record.trace_id
        if hasattr(record, "tenant_id"):
            log_data["tenant_id"] = record.tenant_id
        if hasattr(record, "decision_id"):
            log_data["decision_id"] = str(record.decision_id) if isinstance(record.decision_id, UUID) else record.decision_id
        if hasattr(record, "scenario_id"):
            log_data["scenario_id"] = str(record.scenario_id) if isinstance(record.scenario_id, UUID) else record.scenario_id

        # Add exception info
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logging(service_name: str = "deciops-engine") -> logging.Logger:
    """Setup structured logging."""
    logger = logging.getLogger(service_name)
    logger.setLevel(logging.INFO)

    # Remove existing handlers
    logger.handlers.clear()

    # Add JSON handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    return logger


# Global logger instance
logger = setup_logging()