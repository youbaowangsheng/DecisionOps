"""Mock agent platform service for simulating AI analysis."""
import random
import time
from datetime import datetime
from typing import Any

from src.models.schemas import AgentResult


class MockAgentPlatformService:
    """Mock implementation of AgentPlatformService for testing.

    Simulates AI agent analysis without making HTTP calls.
    Each agent invocation returns a realistic analysis result.
    """

    # Predefined analysis templates by agent type
    AGENT_TEMPLATES = {
        "risk": {
            "conclusion_templates": [
                "Risk level is elevated. Consider increasing reserves by {percent}%.",
                "Current risk profile requires monitoring. Recommend review in {days} days.",
                "Risk assessment shows moderate exposure. Implement mitigation strategy.",
            ],
            "reasoning_template": "Based on analysis of {metric_count} metrics over the past 30 days, the risk indicators suggest {trend}. Key concerns include {concerns}.",
            "confidence_range": (0.7, 0.95),
        },
        "demand": {
            "conclusion_templates": [
                "Demand forecast indicates {percent}% growth in next quarter.",
                "Market demand is shifting toward {category}. Adjust inventory accordingly.",
                "Demand patterns suggest opportunity for expansion in {region}.",
            ],
            "reasoning_template": "Analysis of historical sales data and current market indicators shows {trend}. This aligns with {alignment} patterns observed in similar periods.",
            "confidence_range": (0.65, 0.90),
        },
        "optimization": {
            "conclusion_templates": [
                "Resource optimization opportunity identified. Potential efficiency gain of {percent}%.",
                "Process optimization can reduce costs by {percent}% without impact on quality.",
                "Operational efficiency can be improved through {action}.",
            ],
            "reasoning_template": "Comparing current resource allocation against best practices reveals {gap}. The primary opportunity lies in {opportunity}.",
            "confidence_range": (0.75, 0.95),
        },
        "default": {
            "conclusion_templates": [
                "Analysis complete. Recommended action: {action}.",
                "Based on current data, suggest {action} for optimal outcomes.",
                "Comprehensive review indicates {action} as the preferred path forward.",
            ],
            "reasoning_template": "After thorough analysis of available data points and cross-referencing with historical patterns, the evidence supports {conclusion}.",
            "confidence_range": (0.6, 0.85),
        },
    }

    def __init__(self):
        self._call_count = 0

    def _get_agent_type(self, agent_id: str) -> str:
        """Determine agent type from agent ID."""
        agent_id_lower = agent_id.lower()
        for agent_type in self.AGENT_TEMPLATES:
            if agent_type in agent_id_lower:
                return agent_type
        return "default"

    def _generate_conclusion(self, template: str, agent_type: str) -> str:
        """Generate a conclusion string by filling in template variables."""
        replacements = {
            "percent": lambda: str(random.randint(5, 30)),
            "days": lambda: str(random.randint(7, 30)),
            "category": lambda: random.choice(["premium", "budget", "specialty"]),
            "region": lambda: random.choice(["US West", "US East", "EU Central"]),
            "trend": lambda: random.choice(["an upward trajectory", "stabilization", "a slight decline"]),
            "concerns": lambda: random.choice(["market volatility", "supply chain constraints", "regulatory changes"]),
            "alignment": lambda: random.choice(["seasonal", "cyclical", "event-driven"]),
            "gap": lambda: random.choice(["resource overallocation", "process bottlenecks", "redundancy in workflows"]),
            "opportunity": lambda: random.choice(["workflow automation", "resource rebalancing", "process streamlining"]),
            "action": lambda: random.choice(["proceed with caution", "delay decision", "implement immediately", "seek additional input"]),
        }

        result = template
        for key, value_fn in replacements.items():
            if f"{{{key}}}" in result:
                result = result.replace(f"{{{key}}}", value_fn())

        return result

    async def invoke_agent(
        self, agent_id: str, inputs: dict[str, Any], params: dict[str, Any]
    ) -> AgentResult:
        """Simulate agent invocation with AI-like analysis.

        Args:
            agent_id: Agent identifier
            inputs: Input parameters (features, tenant_id, etc.)
            params: Additional execution parameters

        Returns:
            Agent execution result with simulated AI outputs
        """
        self._call_count += 1
        start_time = time.time()

        # Determine agent type
        agent_type = self._get_agent_type(agent_id)
        template = self.AGENT_TEMPLATES[agent_type]

        # Generate analysis outputs
        conclusion_template = random.choice(template["conclusion_templates"])
        conclusion = self._generate_conclusion(conclusion_template, agent_type)

        reasoning_template = template["reasoning_template"]
        reasoning = self._generate_conclusion(reasoning_template, agent_type)

        confidence = random.uniform(*template["confidence_range"])

        # Extract some features for context
        features = inputs.get("features", {})
        metric_count = len(features.get("metrics", []))
        if metric_count == 0:
            metric_count = random.randint(3, 10)

        # Build outputs
        outputs = {
            "conclusion": conclusion,
            "reasoning": reasoning,
            "confidence": confidence,
            "risk_level": "high" if confidence < 0.6 else "medium" if confidence < 0.8 else "low",
            "suggested_actions": self._generate_actions(agent_type, features),
            "analysis_metadata": {
                "agent_type": agent_type,
                "features_analyzed": list(features.keys()) if features else [],
                "model_version": "mock-v1.0",
                "timestamp": datetime.utcnow().isoformat(),
            },
        }

        execution_time_ms = int((time.time() - start_time) * 1000) + random.randint(50, 200)

        return AgentResult(
            agent_id=agent_id,
            agent_name=f"Mock {agent_type.title()} Agent",
            inputs=inputs,
            outputs=outputs,
            execution_time_ms=execution_time_ms,
            status="completed",
        )

    def _generate_actions(self, agent_type: str, features: dict) -> list[dict]:
        """Generate suggested actions based on agent type and features."""
        action_templates = {
            "risk": [
                {"action": "review", "object": "risk_exposure", "description": "Review current risk exposure levels"},
                {"action": "adjust", "object": "reserves", "description": "Adjust reserve allocation"},
                {"action": "monitor", "object": "key_metrics", "description": "Implement enhanced monitoring"},
            ],
            "demand": [
                {"action": "update", "object": "forecast", "description": "Update demand forecast"},
                {"action": "adjust", "object": "inventory", "description": "Adjust inventory levels"},
                {"action": "plan", "object": "capacity", "description": "Plan for capacity expansion"},
            ],
            "optimization": [
                {"action": "implement", "object": "efficiency_measures", "description": "Implement efficiency measures"},
                {"action": "automate", "object": "workflows", "description": "Automate repetitive workflows"},
                {"action": "reduce", "object": "costs", "description": "Reduce operational costs"},
            ],
            "default": [
                {"action": "analyze", "object": "data", "description": "Further analyze available data"},
                {"action": "review", "object": "assumptions", "description": "Review current assumptions"},
                {"action": "decide", "object": "next_steps", "description": "Decide on next steps"},
            ],
        }

        templates = action_templates.get(agent_type, action_templates["default"])
        num_actions = random.randint(1, 3)
        return random.sample(templates, min(num_actions, len(templates)))

    async def execute_workflow(self, workflow_id: str, parameters: dict[str, Any]):
        """Simulate workflow execution."""
        return AgentResult(
            agent_id=workflow_id,
            agent_name=f"Mock Workflow {workflow_id}",
            inputs=parameters,
            outputs={"status": "completed", "workflow_id": workflow_id},
            execution_time_ms=random.randint(100, 500),
            status="completed",
        )

    async def get_run_status(self, run_id: str):
        """Simulate run status query."""
        from src.models.schemas import RunStatus

        return RunStatus(
            run_id=run_id,
            status="completed",
            progress=1.0,
            message="Mock run completed successfully",
        )


# Global mock instance
mock_agent_platform = MockAgentPlatformService()
