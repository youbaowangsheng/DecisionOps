"""Configuration management for deciops-engine."""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Database
    db_url: str = "postgresql+asyncpg://deciops:password@localhost:5432/deciops"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Internal services
    data_platform_url: str = "https://data.internal/api"
    agent_platform_url: str = "https://agent.internal/api"

    # Mock mode for testing without external services
    mock_mode: bool = False

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic_decisions: str = "deciops.decisions"

    # XXL-JOB
    xxl_job_url: str = "http://localhost:8081/xxl-job-admin"

    # OpenTelemetry
    open_telemetry_endpoint: str = "http://localhost:4317"
    service_name: str = "deciops-engine"

    # Application
    app_host: str = "0.0.0.0"
    app_port: int = 8001

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()