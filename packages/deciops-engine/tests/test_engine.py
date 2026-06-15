"""Tests for the decision engine."""
import pytest
from uuid import uuid4

from src.core.engine import DecisionEngine
from src.models.schemas import AgentResult, ScenarioConfig


@pytest.fixture
def engine():
    """Create a decision engine instance."""
    return DecisionEngine()


@pytest.fixture
def sample_scenario():
    """Create a sample scenario configuration."""
    return ScenarioConfig(
        scenario_id=uuid4(),
        tenant_id="test-tenant",
        name="Test Scenario",
        trigger_config={"type": "manual"},
        input_bindings={
            "metrics": ["revenue", "orders"],
            "datasets": ["sales_data"],
            "entities": [{"type": "product", "id": "123"}],
        },
        analysis_agents=["agent-1", "agent-2"],
        synthesis_rules={},
        audit_policy={"auto_approve_threshold": 0.9},
        enabled=True,
    )


@pytest.mark.asyncio
async def test_generate_decision_loads_scenario(engine, sample_scenario):
    """Test that generate_decision properly loads scenario configuration."""
    # This test would require mocking the database
    # For now, just verify the engine has the required components
    assert engine.synthesizer is not None
    assert engine.conflict_detector is not None
    assert engine.data_service is not None
    assert engine.agent_service is not None


def test_synthesizer_creates_judgment(engine, sample_scenario):
    """Test that synthesizer creates a valid judgment."""
    agent_results = [
        AgentResult(
            agent_id="agent-1",
            agent_name="Agent 1",
            inputs={},
            outputs={
                "conclusion": "Increase inventory by 10%",
                "reasoning": "Based on sales trends",
                "confidence": 0.8,
            },
            execution_time_ms=100,
            status="completed",
        ),
    ]

    judgment = engine.synthesizer.synthesize(agent_results, sample_scenario)

    assert judgment.conclusion == "Increase inventory by 10%"
    assert judgment.confidence > 0
    assert judgment.reasoning == "[Agent 1]: Based on sales trends"


def test_synthesizer_handles_empty_results(engine, sample_scenario):
    """Test that synthesizer handles empty agent results."""
    judgment = engine.synthesizer.synthesize([], sample_scenario)

    assert judgment.confidence == 0.0
    assert judgment.risk_level == "high"