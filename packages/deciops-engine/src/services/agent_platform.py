"""Agent platform service for invoking agents and workflows."""
from datetime import datetime
from typing import Any

import httpx

from src.config import get_settings
from src.models.schemas import AgentResult, RunStatus, WorkflowRun
from src.utils.logging import logger


class AgentPlatformService:
    """Service for interacting with the agent platform."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.agent_platform_url

    async def invoke_agent(
        self, agent_id: str, inputs: dict[str, Any], params: dict[str, Any]
    ) -> AgentResult:
        """Invoke an analysis agent.

        Args:
            agent_id: Agent identifier
            inputs: Input parameters for the agent
            params: Additional execution parameters

        Returns:
            Agent execution result
        """
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/agents/{agent_id}/invoke",
                    json={"inputs": inputs, "params": params},
                )
                response.raise_for_status()
                data = response.json()
                return AgentResult(
                    agent_id=agent_id,
                    agent_name=data.get("agent_name", agent_id),
                    inputs=inputs,
                    outputs=data.get("outputs", {}),
                    execution_time_ms=data.get("execution_time_ms", 0),
                    status=data.get("status", "completed"),
                )
            except httpx.HTTPError as e:
                logger.error(f"Failed to invoke agent {agent_id}: {e}")
                return AgentResult(
                    agent_id=agent_id,
                    agent_name=agent_id,
                    inputs=inputs,
                    outputs={},
                    execution_time_ms=0,
                    status="failed",
                )

    async def execute_workflow(
        self, workflow_id: str, parameters: dict[str, Any]
    ) -> WorkflowRun:
        """Execute a workflow.

        Args:
            workflow_id: Workflow identifier
            parameters: Workflow parameters

        Returns:
            Workflow run record
        """
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/workflows/{workflow_id}/execute",
                    json={"parameters": parameters},
                )
                response.raise_for_status()
                data = response.json()
                return WorkflowRun(
                    run_id=data.get("run_id", ""),
                    workflow_id=workflow_id,
                    status=data.get("status", "running"),
                    start_time=datetime.fromisoformat(data.get("start_time", datetime.utcnow().isoformat())),
                    end_time=(
                        datetime.fromisoformat(data["end_time"])
                        if data.get("end_time")
                        else None
                    ),
                    outputs=data.get("outputs", {}),
                )
            except httpx.HTTPError as e:
                logger.error(f"Failed to execute workflow {workflow_id}: {e}")
                return WorkflowRun(
                    run_id="",
                    workflow_id=workflow_id,
                    status="failed",
                    start_time=datetime.utcnow(),
                )

    async def get_run_status(self, run_id: str) -> RunStatus:
        """Get the status of a workflow run.

        Args:
            run_id: Run identifier

        Returns:
            Run status information
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(f"{self.base_url}/runs/{run_id}/status")
                response.raise_for_status()
                data = response.json()
                return RunStatus(
                    run_id=run_id,
                    status=data.get("status", "unknown"),
                    progress=data.get("progress", 0.0),
                    message=data.get("message"),
                )
            except httpx.HTTPError as e:
                logger.error(f"Failed to get run status for {run_id}: {e}")
                return RunStatus(run_id=run_id, status="unknown", message=str(e))