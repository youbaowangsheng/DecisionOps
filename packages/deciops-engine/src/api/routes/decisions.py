"""Decision-related API routes."""
from datetime import datetime
from typing import Annotated, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import DecisionEngineDep, DbSession
from src.models.database import DecisionCardModel
from src.models.schemas import AuditResult, DecisionCard, Judgment
from src.utils.logging import logger

router = APIRouter(prefix="/decisions", tags=["decisions"])


def _parse_judgment(judgment_data: Optional[dict[str, Any]]) -> Judgment:
    """Parse judgment data, handling legacy formats."""
    if not judgment_data:
        return Judgment(conclusion="", reasoning="", confidence=0.0)

    # Check if it has the expected fields
    if "conclusion" in judgment_data and "reasoning" in judgment_data and "confidence" in judgment_data:
        return Judgment(**judgment_data)

    # Handle legacy format with 'title' field
    if "title" in judgment_data:
        return Judgment(
            conclusion=judgment_data.get("title", ""),
            reasoning=judgment_data.get("description", judgment_data.get("title", "")),
            confidence=judgment_data.get("confidence", 0.0),
            risk_level=judgment_data.get("risk_level", "medium"),
            metadata=judgment_data,
        )

    # Fallback: return empty judgment
    return Judgment(conclusion="", reasoning="", confidence=0.0)


@router.get("")
async def list_decisions(
    db: DbSession,
    status: Annotated[Optional[str], Query(description="Filter by status")] = None,
    tenant_id: Annotated[Optional[str], Query(description="Filter by tenant")] = None,
) -> list[DecisionCard]:
    """Get list of decisions with optional filters."""
    from sqlalchemy import select

    stmt = select(DecisionCardModel)

    if status:
        stmt = stmt.where(DecisionCardModel.status == status)
    if tenant_id:
        stmt = stmt.where(DecisionCardModel.tenant_id == tenant_id)

    stmt = stmt.order_by(DecisionCardModel.generated_at.desc())
    result = await db.execute(stmt)
    decisions = result.scalars().all()

    return [
        DecisionCard(
            decision_id=d.decision_id,
            tenant_id=d.tenant_id,
            scenario_id=d.scenario_id,
            generated_at=d.generated_at,
            status=d.status,
            confidence=d.confidence or 0.0,
            judgment=_parse_judgment(d.judgment),
            suggested_actions=d.suggested_actions or [],
            conflict_info=d.conflict_info,
        )
        for d in decisions
    ]


@router.get("/{decision_id}")
async def get_decision(
    db: DbSession,
    decision_id: UUID,
) -> DecisionCard:
    """Get decision details by ID."""
    result = await db.get(DecisionCardModel, decision_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision {decision_id} not found",
        )

    return DecisionCard(
        decision_id=result.decision_id,
        tenant_id=result.tenant_id,
        scenario_id=result.scenario_id,
        generated_at=result.generated_at,
        status=result.status,
        confidence=result.confidence or 0.0,
        judgment=_parse_judgment(result.judgment),
        suggested_actions=result.suggested_actions or [],
        conflict_info=result.conflict_info,
    )


@router.post("/{decision_id}/approve")
async def approve_decision(
    db: DbSession,
    decision_id: UUID,
    audit_result: AuditResult,
) -> dict:
    """Approve a pending decision."""
    result = await db.get(DecisionCardModel, decision_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision {decision_id} not found",
        )

    if result.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Decision {decision_id} is not in pending status",
        )

    result.status = "approved"
    await db.commit()

    logger.info(
        f"Decision {decision_id} approved",
        extra={"decision_id": str(decision_id), "tenant_id": result.tenant_id},
    )

    return {
        "decision_id": str(decision_id),
        "status": "approved",
        "comment": audit_result.comment,
    }


@router.post("/{decision_id}/reject")
async def reject_decision(
    db: DbSession,
    decision_id: UUID,
    comment: str,
) -> dict:
    """Reject a pending decision."""
    result = await db.get(DecisionCardModel, decision_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Decision {decision_id} not found",
        )

    if result.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Decision {decision_id} is not in pending status",
        )

    result.status = "rejected"
    await db.commit()

    logger.info(
        f"Decision {decision_id} rejected: {comment}",
        extra={"decision_id": str(decision_id), "tenant_id": result.tenant_id},
    )

    return {
        "decision_id": str(decision_id),
        "status": "rejected",
        "comment": comment,
    }