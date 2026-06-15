"""OpenTelemetry distributed tracing setup."""
from typing import Any, Optional

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from src.config import get_settings


def setup_tracing(service_name: Optional[str] = None) -> trace.Tracer:
    """Setup OpenTelemetry tracing."""
    settings = get_settings()

    service_name = service_name or settings.service_name

    # Create resource
    resource = Resource(attributes={SERVICE_NAME: service_name})

    # Create tracer provider
    provider = TracerProvider(resource=resource)

    # Setup OTLP exporter
    try:
        exporter = OTLPSpanExporter(endpoint=settings.open_telemetry_endpoint)
        processor = BatchSpanProcessor(exporter)
        provider.add_span_processor(processor)
    except Exception:
        # Silently fail if OTLP endpoint is not available
        pass

    # Set global tracer provider
    trace.set_tracer_provider(provider)

    return trace.get_tracer(service_name)


def get_tracer() -> trace.Tracer:
    """Get the global tracer instance."""
    return trace.get_tracer("deciops-engine")


class TraceContext:
    """Context manager for trace spans."""

    def __init__(self, name: str, attributes: Optional[dict[str, Any]] = None):
        self.name = name
        self.attributes = attributes or {}
        self.tracer = get_tracer()
        self.span = None

    def __enter__(self):
        self.span = self.tracer.start_span(self.name)
        for key, value in self.attributes.items():
            self.span.set_attribute(key, value)
        return self.span

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.span.record_exception(exc_val)
            self.span.set_status(trace.StatusCode.ERROR)
        self.span.end()
        return False