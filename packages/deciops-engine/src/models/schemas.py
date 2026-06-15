"""Pydantic schemas for API request/response."""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AgentResult(BaseModel):
    """Agent execution result."""

    agent_id: str
    agent_name: str
    inputs: dict[str, Any]
    outputs: dict[str, Any]
    execution_time_ms: int
    status: str


class MetricResult(BaseModel):
    """Metric query result."""

    metric_name: str
    value: float
    timestamp: datetime
    labels: dict[str, str] = Field(default_factory=dict)


class DataSample(BaseModel):
    """Data sample from dataset."""

    dataset: str
    rows: list[dict[str, Any]]
    total_count: int


class SemanticContext(BaseModel):
    """Semantic context for entities."""

    entities: list[dict[str, Any]]
    relationships: list[dict[str, Any]] = Field(default_factory=list)
    context_data: dict[str, Any] = Field(default_factory=dict)


class WorkflowRun(BaseModel):
    """Workflow execution record."""

    run_id: str
    workflow_id: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    outputs: dict[str, Any] = Field(default_factory=dict)


class RunStatus(BaseModel):
    """Status of a workflow run."""

    run_id: str
    status: str
    progress: float = 0.0
    message: Optional[str] = None


class Judgment(BaseModel):
    """Synthesized judgment result."""

    conclusion: str
    reasoning: str
    confidence: float
    risk_level: str = "medium"
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConflictInfo(BaseModel):
    """Conflict detection result."""

    conflict_type: str
    conflicting_decisions: list[str]
    description: str
    severity: str = "warning"
    resolution_suggestion: Optional[str] = None


class DecisionCard(BaseModel):
    """Decision card model."""

    decision_id: UUID
    tenant_id: str
    scenario_id: UUID
    generated_at: datetime
    status: str
    confidence: float
    judgment: Judgment
    suggested_actions: list[dict[str, Any]] = Field(default_factory=list)
    conflict_info: Optional[ConflictInfo] = None


class ScenarioConfig(BaseModel):
    """Scenario configuration."""

    scenario_id: UUID
    tenant_id: str
    name: str
    trigger_config: dict[str, Any]
    input_bindings: dict[str, Any]
    analysis_agents: list[str]
    synthesis_rules: dict[str, Any]
    audit_policy: dict[str, Any]
    enabled: bool = True


class AuditResult(BaseModel):
    """Audit result for decision approval/rejection."""

    approved: bool
    comment: Optional[str] = None
    auditor: Optional[str] = None


class TaskInfo(BaseModel):
    """Task information."""

    task_id: str
    task_type: str
    status: str
    tenant_id: str
    created_at: datetime
    executed_at: Optional[datetime] = None
    result: Optional[dict[str, Any]] = None