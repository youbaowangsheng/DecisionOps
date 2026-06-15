"""Decision synthesizer for combining agent results into judgments."""
from typing import Any

from src.models.schemas import AgentResult, Judgment, ScenarioConfig
from src.utils.logging import logger


class DecisionSynthesizer:
    """Synthesizes agent results into coherent decisions."""

    def synthesize(
        self, agent_results: list[AgentResult], scenario: ScenarioConfig
    ) -> Judgment:
        """Synthesize agent results into a judgment.

        Args:
            agent_results: List of agent execution results
            scenario: Scenario configuration

        Returns:
            Synthesized judgment
        """
        if not agent_results:
            return Judgment(
                conclusion="No agent results available",
                reasoning="No agents were executed for this scenario",
                confidence=0.0,
                risk_level="high",
            )

        # Aggregate conclusions from agents
        conclusions = []
        reasoning_parts = []
        all_outputs = {}

        for result in agent_results:
            if result.status == "completed":
                outputs = result.outputs or {}
                all_outputs[result.agent_id] = outputs

                conclusion = outputs.get("conclusion", "")
                if conclusion:
                    conclusions.append(conclusion)

                reasoning = outputs.get("reasoning", "")
                if reasoning:
                    reasoning_parts.append(f"[{result.agent_name}]: {reasoning}")

        # Compute confidence
        confidence = self.compute_confidence(
            agent_results, str(scenario.scenario_id)
        )

        # Determine risk level based on confidence
        if confidence >= 0.8:
            risk_level = "low"
        elif confidence >= 0.5:
            risk_level = "medium"
        else:
            risk_level = "high"

        # Build final conclusion
        if conclusions:
            final_conclusion = self._merge_conclusions(conclusions)
        else:
            final_conclusion = "Unable to determine conclusion from agent results"

        final_reasoning = " ".join(reasoning_parts) if reasoning_parts else "No reasoning provided"

        return Judgment(
            conclusion=final_conclusion,
            reasoning=final_reasoning,
            confidence=confidence,
            risk_level=risk_level,
            metadata={"agent_count": len(agent_results), "agents": all_outputs},
        )

    def compute_confidence(
        self, agent_results: list[AgentResult], scenario_id: str
    ) -> float:
        """Compute confidence score for agent results.

        Formula: weighted_conf * 0.6 + consistency * 0.2 + historical_accuracy * 0.2

        Args:
            agent_results: List of agent results
            scenario_id: Scenario identifier

        Returns:
            Confidence score between 0 and 1
        """
        if not agent_results:
            return 0.0

        # Calculate weighted confidence (0.6 weight)
        weighted_conf = 0.0
        for result in agent_results:
            conf = result.outputs.get("confidence", 0.5)
            weighted_conf += conf

        weighted_conf = weighted_conf / len(agent_results) if agent_results else 0.0

        # Calculate consistency (0.2 weight)
        # Check if conclusions are consistent across agents
        conclusions = []
        for result in agent_results:
            if result.status == "completed":
                conclusion = result.outputs.get("conclusion", "")
                if conclusion:
                    conclusions.append(conclusion)

        consistency = 1.0
        if len(conclusions) > 1:
            # Simple consistency check - all conclusions should be similar
            first_conclusion = conclusions[0].lower()
            matching = sum(
                1 for c in conclusions[1:]
                if self._conclusions_similar(first_conclusion, c.lower())
            )
            consistency = matching / (len(conclusions) - 1) if len(conclusions) > 1 else 1.0

        # Historical accuracy (0.2 weight) - simplified for now
        # In production, this would query historical decision accuracy
        historical_accuracy = 0.75

        # Final confidence calculation
        confidence = (weighted_conf * 0.6) + (consistency * 0.2) + (historical_accuracy * 0.2)

        return min(max(confidence, 0.0), 1.0)

    def _merge_conclusions(self, conclusions: list[str]) -> str:
        """Merge multiple conclusions into a coherent summary."""
        if len(conclusions) == 1:
            return conclusions[0]

        # Simple merging: take the most common conclusion
        from collections import Counter

        # Count word frequencies to find common themes
        all_words = []
        for c in conclusions:
            words = c.lower().split()
            all_words.extend(words)

        word_counts = Counter(all_words)
        # Return longest conclusion as primary
        return max(conclusions, key=len)

    def _conclusions_similar(self, c1: str, c2: str) -> bool:
        """Check if two conclusions are semantically similar."""
        # Simple similarity: check word overlap
        words1 = set(c1.split())
        words2 = set(c2.split())

        if not words1 or not words2:
            return False

        intersection = words1 & words2
        union = words1 | words2

        jaccard = len(intersection) / len(union)
        return jaccard > 0.5