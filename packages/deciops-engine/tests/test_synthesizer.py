"""Tests for the decision synthesizer."""
import pytest

from src.core.synthesizer import DecisionSynthesizer
from src.models.schemas import AgentResult, ScenarioConfig
from uuid import uuid4


@pytest.fixture
def synthesizer():
    """Create a synthesizer instance."""
    return DecisionSynthesizer()


@pytest.fixture
def sample_scenario():
    """Create a sample scenario."""
    return ScenarioConfig(
        scenario_id=uuid4(),
        tenant_id="test-tenant",
        name="Test Scenario",
        trigger_config={},
        input_bindings={},
        analysis_agents=["agent-1"],
        synthesis_rules={},
        audit_policy={},
        enabled=True,
    )


def test_synthesizer_computes_confidence(synthesizer, sample_scenario):
    """Test confidence computation."""
    agent_results = [
        AgentResult(
            agent_id="agent-1",
            agent_name="Agent 1",
            inputs={},
            outputs={"confidence": 0.8},
            execution_time_ms=100,
            status="completed",
        ),
        AgentResult(
            agent_id="agent-2",
            agent_name="Agent 2",
            inputs={},
            outputs={"confidence": 0.9},
            execution_time_ms=100,
            status="completed",
        ),
    ]

    confidence = synthesizer.compute_confidence(agent_results, str(sample_scenario.scenario_id))

    # Should be weighted average * 0.6 + consistency * 0.2 + historical * 0.2
    assert 0 < confidence < 1


def test_synthesizer_handles_failed_agents(synthesizer, sample_scenario):
    """Test that failed agents don't affect confidence negatively."""
    agent_results = [
        AgentResult(
            agent_id="agent-1",
            agent_name="Agent 1",
            inputs={},
            outputs={},
            execution_time_ms=100,
            status="failed",
        ),
    ]

    judgment = synthesizer.synthesize(agent_results, sample_scenario)

    assert judgment.confidence >= 0
    assert judgment.conclusion is not None


def test_merge_conclusions(synthesizer):
    """Test conclusion merging logic."""
    conclusions = [
        "Increase inventory by 10%",
        "Increase inventory by 15%",
        "Increase inventory by 12%",
    ]

    merged = synthesizer._merge_conclusions(conclusions)

    assert "Increase inventory" in merged


def test_conclusions_similar(synthesizer):
    """Test similarity detection."""
    c1 = "Increase inventory by 10%"
    c2 = "Increase inventory by 15%"

    assert synthesizer._conclusions_similar(c1, c2) is True

    c3 = "Decrease prices by 5%"
    assert synthesizer._conclusions_similar(c1, c3) is False