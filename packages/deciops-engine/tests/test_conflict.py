"""Tests for the conflict detector."""
import pytest
from datetime import datetime
from uuid import uuid4

from src.core.conflict_detector import ConflictDetector
from src.models.schemas import ConflictInfo, DecisionCard, Judgment


@pytest.fixture
def detector():
    """Create a conflict detector instance."""
    return ConflictDetector()


@pytest.fixture
def sample_decision():
    """Create a sample decision card."""
    return DecisionCard(
        decision_id=uuid4(),
        tenant_id="test-tenant",
        scenario_id=uuid4(),
        generated_at=datetime.utcnow(),
        status="pending",
        confidence=0.85,
        judgment=Judgment(
            conclusion="Test decision",
            reasoning="Test reasoning",
            confidence=0.85,
            risk_level="low",
            metadata={"workflow_ref": "inventory_adjust"},
        ),
        suggested_actions=[
            {"action": "adjust", "object": "product-123"},
            {"action": "update", "object": "inventory-456"},
        ],
    )


def test_detect_no_conflict_when_no_existing(detector, sample_decision):
    """Test no conflict detected when no existing decisions."""
    result = detector.detect(sample_decision, [])

    assert result is None


def test_detect_mutex_conflict(detector, sample_decision):
    """Test mutual exclusion conflict detection."""
    existing_decision = DecisionCard(
        decision_id=uuid4(),
        tenant_id="test-tenant",
        scenario_id=sample_decision.scenario_id,
        generated_at=datetime.utcnow(),
        status="pending",
        confidence=0.8,
        judgment=Judgment(
            conclusion="Existing decision",
            reasoning="Existing reasoning",
            confidence=0.8,
            risk_level="low",
            metadata={"workflow_ref": "inventory_adjust"},
        ),
        suggested_actions=[
            {"action": "adjust", "object": "product-123"},
        ],
    )

    result = detector.detect(sample_decision, [existing_decision])

    assert result is not None
    assert result.conflict_type == "mutex"
    assert sample_decision.decision_id in result.conflicting_decisions
    assert existing_decision.decision_id in result.conflicting_decisions


def test_detect_dependency_conflict(detector, sample_decision):
    """Test dependency conflict detection."""
    existing_decision = DecisionCard(
        decision_id=uuid4(),
        tenant_id="test-tenant",
        scenario_id=sample_decision.scenario_id,
        generated_at=datetime.utcnow(),
        status="pending",
        confidence=0.8,
        judgment=Judgment(
            conclusion="Existing decision",
            reasoning="Existing reasoning",
            confidence=0.8,
            risk_level="low",
            metadata={"workflow_ref": "inventory_release"},
        ),
        suggested_actions=[
            {"action": "release", "object": "inventory-456"},
        ],
    )

    result = detector.detect(sample_decision, [existing_decision])

    assert result is not None
    assert result.conflict_type == "dependency"


def test_detect_similarity_conflict(detector):
    """Test similarity conflict detection."""
    new_decision = DecisionCard(
        decision_id=uuid4(),
        tenant_id="test-tenant",
        scenario_id=uuid4(),
        generated_at=datetime.utcnow(),
        status="pending",
        confidence=0.8,
        judgment=Judgment(
            conclusion="New decision",
            reasoning="New reasoning",
            confidence=0.8,
            risk_level="low",
            metadata={},
        ),
        suggested_actions=[
            {"description": "Increase inventory by 10% for product-123"},
        ],
    )

    existing_decision = DecisionCard(
        decision_id=uuid4(),
        tenant_id="test-tenant",
        scenario_id=uuid4(),
        generated_at=datetime.utcnow(),
        status="pending",
        confidence=0.8,
        judgment=Judgment(
            conclusion="Existing decision",
            reasoning="Existing reasoning",
            confidence=0.8,
            risk_level="low",
            metadata={},
        ),
        suggested_actions=[
            {"description": "Increase inventory by 12% for product-123"},
        ],
    )

    result = detector.detect(new_decision, [existing_decision])

    assert result is not None
    assert result.conflict_type == "similarity"


def test_no_conflict_for_different_workflows(detector, sample_decision):
    """Test no conflict when workflows are different and non-overlapping."""
    existing_decision = DecisionCard(
        decision_id=uuid4(),
        tenant_id="test-tenant",
        scenario_id=sample_decision.scenario_id,
        generated_at=datetime.utcnow(),
        status="pending",
        confidence=0.8,
        judgment=Judgment(
            conclusion="Different workflow",
            reasoning="Different reasoning",
            confidence=0.8,
            risk_level="low",
            metadata={"workflow_ref": "price_update"},
        ),
        suggested_actions=[
            {"action": "update", "object": "product-789"},
        ],
    )

    result = detector.detect(sample_decision, [existing_decision])

    assert result is None