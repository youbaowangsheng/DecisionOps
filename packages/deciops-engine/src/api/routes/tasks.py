"""Task-related API routes."""
from datetime import datetime
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.deps import DbSession
from src.models.database import TaskModel
from src.models.schemas import TaskInfo
from src.utils.logging import logger

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
async def list_tasks(
    db: DbSession,
    status: Annotated[Optional[str], Query(description="Filter by status")] = None,
    tenant_id: Annotated[Optional[str], Query(description="Filter by tenant")] = None,
) -> list[TaskInfo]:
    """Get list of tasks with optional filters."""
    from sqlalchemy import select

    stmt = select(TaskModel)

    if status:
        stmt = stmt.where(TaskModel.status == status)
    if tenant_id:
        stmt = stmt.where(TaskModel.tenant_id == tenant_id)

    stmt = stmt.order_by(TaskModel.created_at.desc())
    result = await db.execute(stmt)
    tasks = result.scalars().all()

    return [
        TaskInfo(
            task_id=t.task_id,
            task_type=t.task_type,
            status=t.status,
            tenant_id=t.tenant_id,
            created_at=t.created_at,
            executed_at=t.executed_at,
            result=t.result,
        )
        for t in tasks
    ]


@router.get("/{task_id}")
async def get_task(
    db: DbSession,
    task_id: str,
) -> TaskInfo:
    """Get task details by ID."""
    result = await db.get(TaskModel, task_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    return TaskInfo(
        task_id=result.task_id,
        task_type=result.task_type,
        status=result.status,
        tenant_id=result.tenant_id,
        created_at=result.created_at,
        executed_at=result.executed_at,
        result=result.result,
    )


@router.post("/{task_id}/execute")
async def execute_task(
    db: DbSession,
    task_id: str,
) -> dict:
    """Manually execute a task."""
    result = await db.get(TaskModel, task_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    if result.status == "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task {task_id} is already running",
        )

    result.status = "running"
    result.executed_at = datetime.utcnow()
    await db.commit()

    logger.info(
        f"Manual task execution: {task_id}",
        extra={"task_id": task_id, "tenant_id": result.tenant_id},
    )

    return {
        "task_id": task_id,
        "status": "running",
        "executed_at": result.executed_at.isoformat(),
    }