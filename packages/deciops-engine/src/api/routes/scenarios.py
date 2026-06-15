"""Scenario configuration API routes."""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import DbSession, SchedulerDep, DecisionEngineDep
from src.models.database import ScenarioConfigModel
from src.models.schemas import ScenarioConfig
from src.utils.logging import logger

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("")
async def list_scenarios(
    db: DbSession,
    tenant_id: Annotated[str, Query(description="Tenant identifier")],
) -> list[ScenarioConfig]:
    """Get list of scenarios for a tenant."""
    from sqlalchemy import select

    stmt = select(ScenarioConfigModel).where(
        ScenarioConfigModel.tenant_id == tenant_id,
        ScenarioConfigModel.enabled == True,
    )
    result = await db.execute(stmt)
    scenarios = result.scalars().all()

    return [
        ScenarioConfig(
            scenario_id=s.scenario_id,
            tenant_id=s.tenant_id,
            name=s.name,
            trigger_config=s.trigger_config or {},
            input_bindings=s.input_bindings or {},
            analysis_agents=s.analysis_agents or [],
            synthesis_rules=s.synthesis_rules or {},
            audit_policy=s.audit_policy or {},
            enabled=s.enabled,
        )
        for s in scenarios
    ]


@router.get("/{scenario_id}")
async def get_scenario(
    db: DbSession,
    scenario_id: UUID,
) -> ScenarioConfig:
    """Get scenario details by ID."""
    result = await db.get(ScenarioConfigModel, scenario_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found",
        )

    return ScenarioConfig(
        scenario_id=result.scenario_id,
        tenant_id=result.tenant_id,
        name=result.name,
        trigger_config=result.trigger_config or {},
        input_bindings=result.input_bindings or {},
        analysis_agents=result.analysis_agents or [],
        synthesis_rules=result.synthesis_rules or {},
        audit_policy=result.audit_policy or {},
        enabled=result.enabled,
    )


@router.post("/{scenario_id}/trigger")
async def trigger_scenario(
    db: DbSession,
    engine: DecisionEngineDep,
    scenario_id: UUID,
) -> dict:
    """Manually trigger scenario analysis."""
    result = await db.get(ScenarioConfigModel, scenario_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found",
        )

    if not result.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scenario {scenario_id} is not enabled",
        )

    logger.info(
        f"Manual trigger for scenario {scenario_id}",
        extra={"scenario_id": str(scenario_id), "tenant_id": result.tenant_id},
    )

    # Trigger the scenario synchronously and return the decision
    decision = await engine.generate_decision(scenario_id, result.tenant_id)

    return {
        "scenario_id": str(scenario_id),
        "status": "triggered",
        "message": "Scenario analysis completed",
        "decision_id": str(decision.decision_id),
        "confidence": decision.confidence,
    }