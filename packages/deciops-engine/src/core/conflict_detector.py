from typing import Optional
"""Conflict detector for detecting decision conflicts."""
from src.models.schemas import ConflictInfo, DecisionCard
from src.utils.logging import logger


class ConflictDetector:
    """Detects conflicts between new and existing decisions."""

    # Business rules for dependency detection
    DEPENDENCY_RULES = {
        # Format: (workflow_ref, conflicting_workflow_refs)
        "inventory_adjust": ["inventory_release", "inventory_freeze"],
        "price_update": ["promotion_apply", "discount_execute"],
    }

    def detect(
        self, new_decision: DecisionCard, existing: list[DecisionCard]
    ) -> Optional[ConflictInfo]:
        """Detect conflicts between new decision and existing ones.

        Args:
            new_decision: The newly generated decision
            existing: List of existing decisions

        Returns:
            ConflictInfo if conflict detected, None otherwise
        """
        if not existing:
            return None

        # Step 1: Mutual exclusion detection
        mutex_conflict = self._detect_mutex(new_decision, existing)
        if mutex_conflict:
            return mutex_conflict

        # Step 2: Dependency detection
        dependency_conflict = self._detect_dependency(new_decision, existing)
        if dependency_conflict:
            return dependency_conflict

        # Step 3: Similarity detection
        similarity_conflict = self._detect_similarity(new_decision, existing)
        if similarity_conflict:
            return similarity_conflict

        return None

    def _detect_mutex(
        self, new_decision: DecisionCard, existing: list[DecisionCard]
    ) -> Optional[ConflictInfo]:
        """Detect mutual exclusion conflicts.

        Conflicts occur when:
        - Same workflow_ref
        - Operating on overlapping objects
        """
        new_actions = new_decision.suggested_actions
        if not new_actions:
            return None

        new_workflow = new_decision.judgment.metadata.get("workflow_ref")
        new_objects = self._extract_operated_objects(new_actions)

        for existing_card in existing:
            existing_actions = existing_card.suggested_actions
            if not existing_actions:
                continue

            existing_workflow = existing_card.judgment.metadata.get("workflow_ref")

            # Same workflow check
            if new_workflow and new_workflow == existing_workflow:
                existing_objects = self._extract_operated_objects(existing_actions)
                overlapping = new_objects & existing_objects

                if overlapping:
                    return ConflictInfo(
                        conflict_type="mutex",
                        conflicting_decisions=[
                            str(new_decision.decision_id),
                            str(existing_card.decision_id),
                        ],
                        description=f"Mutual exclusion: both decisions operate on overlapping objects {overlapping}",
                        severity="error",
                        resolution_suggestion="Review and resolve conflicting operations before proceeding",
                    )

        return None

    def _detect_dependency(
        self, new_decision: DecisionCard, existing: list[DecisionCard]
    ) -> Optional[ConflictInfo]:
        """Detect dependency-based conflicts using business rules."""
        new_workflow = new_decision.judgment.metadata.get("workflow_ref")
        if not new_workflow:
            return None

        conflicting_workflows = self.DEPENDENCY_RULES.get(new_workflow, [])

        for existing_card in existing:
            existing_workflow = existing_card.judgment.metadata.get("workflow_ref")

            if existing_workflow in conflicting_workflows:
                return ConflictInfo(
                    conflict_type="dependency",
                    conflicting_decisions=[
                        str(new_decision.decision_id),
                        str(existing_card.decision_id),
                    ],
                    description=f"Dependency conflict: {new_workflow} cannot execute while {existing_workflow} is active",
                    severity="warning",
                    resolution_suggestion=f"Complete or cancel {existing_workflow} before executing {new_workflow}",
                )

        return None

    def _detect_similarity(
        self, new_decision: DecisionCard, existing: list[DecisionCard]
    ) -> Optional[ConflictInfo]:
        """Detect similarity-based conflicts.

        Conflicts when suggested actions have vector similarity > 0.85.
        """
        SIMILARITY_THRESHOLD = 0.85

        new_actions = new_decision.suggested_actions
        if not new_actions:
            return None

        new_action_text = self._actions_to_text(new_actions)

        for existing_card in existing:
            existing_actions = existing_card.suggested_actions
            if not existing_actions:
                continue

            existing_action_text = self._actions_to_text(existing_actions)
            similarity = self._compute_similarity(new_action_text, existing_action_text)

            if similarity > SIMILARITY_THRESHOLD:
                return ConflictInfo(
                    conflict_type="similarity",
                    conflicting_decisions=[
                        str(new_decision.decision_id),
                        str(existing_card.decision_id),
                    ],
                    description=f"Similar actions detected with similarity score {similarity:.2f}",
                    severity="warning",
                    resolution_suggestion="Consider consolidating similar decisions",
                )

        return None

    def _extract_operated_objects(self, actions: list[dict]) -> set:
        """Extract operated objects from action list."""
        objects = set()
        for action in actions:
            if isinstance(action, dict):
                obj = action.get("object") or action.get("target") or action.get("resource")
                if obj:
                    objects.add(obj)
            elif isinstance(action, str):
                objects.add(action)
        return objects

    def _actions_to_text(self, actions: list[dict]) -> str:
        """Convert actions to text for similarity comparison."""
        texts = []
        for action in actions:
            if isinstance(action, dict):
                texts.append(action.get("description", "") or action.get("action", ""))
            elif isinstance(action, str):
                texts.append(action)
        return " ".join(texts).lower()

    def _compute_similarity(self, text1: str, text2: str) -> float:
        """Compute text similarity using Jaccard index on words."""
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 or not words2:
            return 0.0

        intersection = words1 & words2
        union = words1 | words2

        return len(intersection) / len(union) if union else 0.0