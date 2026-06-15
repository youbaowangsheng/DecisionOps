from typing import Optional
"""Decision engine core - orchestrates the decision generation workflow."""
from datetime import datetime
from uuid import UUID, uuid4

from src.core.conflict_detector import ConflictDetector
from src.core.synthesizer import DecisionSynthesizer
from src.models.database import DecisionCardModel, ScenarioConfigModel, async_session_maker
from src.models.schemas import (
    AgentResult,
    ConflictInfo,
    DecisionCard,
    Judgment,
    ScenarioConfig,
)
from src.config import get_settings
from src.services.kafka_producer import kafka_producer
from src.utils.logging import logger
from src.utils.tracing import TraceContext


class DecisionEngine:
    """Core decision engine for generating and managing decisions."""

    def __init__(self, use_mock: bool = False):
        self.settings = get_settings()
        self.use_mock = use_mock or self.settings.mock_mode
        self.synthesizer = DecisionSynthesizer()
        self.conflict_detector = ConflictDetector()

        # Initialize services based on mock mode
        if self.use_mock:
            from src.services.mock_data_platform import MockDataPlatformService
            from src.services.mock_agent_platform import MockAgentPlatformService
            self.data_service = MockDataPlatformService()
            self.agent_service = MockAgentPlatformService()
            logger.info("DecisionEngine initialized in MOCK mode")
        else:
            from src.services.agent_platform import AgentPlatformService
            from src.services.data_platform import DataPlatformService
            self.data_service = DataPlatformService()
            self.agent_service = AgentPlatformService()
            logger.info("DecisionEngine initialized with real services")

    async def generate_decision(
        self, scenario_id: UUID, tenant_id: str
    ) -> DecisionCard:
        """Generate a decision for the given scenario.

        Args:
            scenario_id: Scenario identifier
            tenant_id: Tenant identifier

        Returns:
            Generated decision card
        """
        with TraceContext("generate_decision", {"scenario_id": str(scenario_id), "tenant_id": tenant_id}):
            logger.info(f"Generating decision for scenario {scenario_id}", extra={"tenant_id": tenant_id})

            # Step 1: Load scenario configuration
            scenario = await self._load_scenario(scenario_id)
            if not scenario:
                raise ValueError(f"Scenario {scenario_id} not found")

            # Step 2: Trigger feature extraction via data platform
            features = await self._extract_features(scenario, tenant_id)

            # Step 3: Call agents via agent platform
            agent_results = await self._call_agents(scenario, features, tenant_id)

            # Step 4: Synthesize decision with confidence evaluation
            judgment = self.synthesizer.synthesize(agent_results, scenario)

            # Step 5: Detect conflicts with existing decisions
            existing_decisions = await self._get_existing_decisions(scenario_id, tenant_id)
            new_card = DecisionCard(
                decision_id=uuid4(),
                tenant_id=tenant_id,
                scenario_id=scenario_id,
                generated_at=datetime.utcnow(),
                status="pending",
                confidence=judgment.confidence,
                judgment=judgment,
                suggested_actions=self._generate_actions(agent_results),
            )
            conflict_info = self.conflict_detector.detect(new_card, existing_decisions)

            # Step 6: Store and return decision card
            decision_card = await self._store_decision(new_card, conflict_info)

            # Send Kafka event
            await kafka_producer.send_decision_event(
                "decision_generated",
                {
                    "decision_id": str(decision_card.decision_id),
                    "tenant_id": tenant_id,
                    "scenario_id": str(scenario_id),
                    "timestamp": datetime.utcnow().isoformat(),
                },
            )

            logger.info(
                f"Decision {decision_card.decision_id} generated with confidence {judgment.confidence}",
                extra={"decision_id": str(decision_card.decision_id), "tenant_id": tenant_id},
            )

            return decision_card

    async def trigger_analysis(self, scenario_id: UUID):
        """Manually trigger analysis for a scenario.

        Args:
            scenario_id: Scenario identifier
        """
        with TraceContext("trigger_analysis", {"scenario_id": str(scenario_id)}):
            logger.info(f"Manually triggered analysis for scenario {scenario_id}")
            # Implementation for manual trigger
            # Would typically load tenant from context or configuration
            pass

    async def _load_scenario(self, scenario_id: UUID) -> Optional[ScenarioConfig]:
        """Load scenario configuration from database.

        In mock mode, returns a default scenario if none is found in DB.
        """
        async with async_session_maker() as session:
            result = await session.get(ScenarioConfigModel, scenario_id)
            if result:
                return ScenarioConfig(
                    scenario_id=result.scenario_id,
                    tenant_id=result.tenant_id,
                    name=result.name,
                    trigger_config=result.trigger_config,
                    input_bindings=result.input_bindings,
                    analysis_agents=result.analysis_agents,
                    synthesis_rules=result.synthesis_rules,
                    audit_policy=result.audit_policy,
                    enabled=result.enabled,
                )

        # In mock mode, return a default scenario if not found
        if self.use_mock:
            logger.info(f"No scenario found in DB, returning default mock scenario for {scenario_id}")
            return ScenarioConfig(
                scenario_id=scenario_id,
                tenant_id="mock-tenant",
                name="Mock Scenario",
                trigger_config={"type": "manual", "mock": True},
                input_bindings={
                    "metrics": ["revenue", "orders", "conversion_rate"],
                    "datasets": ["sales_data", "customer_data"],
                    "entities": [{"type": "product", "id": "default"}],
                    "time_range": {"start": "2024-01-01", "end": "2024-12-31"},
                },
                analysis_agents=["risk-agent", "demand-agent", "optimization-agent"],
                synthesis_rules={"agent_params": {"timeout": 60}},
                audit_policy={"auto_approve_threshold": 0.9},
                enabled=True,
            )

        return None

    async def _extract_features(self, scenario: ScenarioConfig, tenant_id: str) -> dict:
        """Extract features by calling data platform."""
        input_bindings = scenario.input_bindings
        metrics = input_bindings.get("metrics", [])
        datasets = input_bindings.get("datasets", [])

        features = {}
        if metrics:
            time_range = input_bindings.get("time_range", {})
            metric_results = await self.data_service.query_metrics(metrics, time_range)
            features["metrics"] = {r.metric_name: r.value for r in metric_results}

        if datasets:
            for dataset in datasets:
                sample = await self.data_service.probe_dataset(dataset)
                features[f"dataset_{dataset}"] = sample.rows

        # Get semantic context for entities
        entities = input_bindings.get("entities", [])
        if entities:
            semantic_context = await self.data_service.get_semantic_context(entities)
            features["semantic_context"] = semantic_context.model_dump()

        return features

    async def _call_agents(
        self, scenario: ScenarioConfig, features: dict, tenant_id: str
    ) -> list[AgentResult]:
        """Call analysis agents via agent platform."""
        agent_results = []
        for agent_id in scenario.analysis_agents:
            result = await self.agent_service.invoke_agent(
                agent_id=agent_id,
                inputs={"features": features, "tenant_id": tenant_id},
                params=scenario.synthesis_rules.get("agent_params", {}),
            )
            agent_results.append(result)
        return agent_results

    async def _get_existing_decisions(
        self, scenario_id: UUID, tenant_id: str
    ) -> list[DecisionCard]:
        """Get existing decisions for conflict detection."""
        async with async_session_maker() as session:
            from sqlalchemy import select

            stmt = select(DecisionCardModel).where(
                DecisionCardModel.scenario_id == scenario_id,
                DecisionCardModel.tenant_id == tenant_id,
                DecisionCardModel.status.in_(["pending", "approved"]),
            )
            result = await session.execute(stmt)
            decisions = result.scalars().all()

            return [
                DecisionCard(
                    decision_id=d.decision_id,
                    tenant_id=d.tenant_id,
                    scenario_id=d.scenario_id,
                    generated_at=d.generated_at,
                    status=d.status,
                    confidence=d.confidence or 0.0,
                    judgment=Judgment(**d.judgment) if d.judgment else Judgment(conclusion="", reasoning="", confidence=0.0),
                    suggested_actions=d.suggested_actions or [],
                    conflict_info=ConflictInfo(**d.conflict_info) if d.conflict_info else None,
                )
                for d in decisions
            ]

    async def _store_decision(
        self, decision: DecisionCard, conflict_info: Optional[ConflictInfo]
    ) -> DecisionCard:
        """Store decision in database."""
        async with async_session_maker() as session:
            model = DecisionCardModel(
                decision_id=decision.decision_id,
                tenant_id=decision.tenant_id,
                scenario_id=decision.scenario_id,
                generated_at=decision.generated_at,
                status=decision.status,
                confidence=decision.confidence,
                judgment=decision.judgment.model_dump(),
                suggested_actions=decision.suggested_actions,
                conflict_info=conflict_info.model_dump() if conflict_info else None,
            )
            session.add(model)
            await session.commit()
            await session.refresh(model)

            decision.conflict_info = conflict_info
            return decision

    def _generate_actions(self, agent_results: list[AgentResult]) -> list[dict]:
        """Generate suggested actions from agent results."""
        actions = []
        for result in agent_results:
            if result.status == "completed" and result.outputs:
                suggested = result.outputs.get("suggested_actions", [])
                actions.extend(suggested if isinstance(suggested, list) else [suggested])
        return actions