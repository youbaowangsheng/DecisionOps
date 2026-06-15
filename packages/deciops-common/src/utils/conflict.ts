import { DecisionCard, ConflictInfo } from '../types/decision';

/**
 * Detect conflicts between a new decision and existing decisions.
 * Checks for three types of conflicts: mutual exclusion, dependency, and similarity.
 *
 * @param newDecision - The newly generated decision to check
 * @param existingDecisions - Array of existing decisions to compare against
 * @returns ConflictInfo if a conflict is found, null otherwise
 */
export function detectConflicts(
  newDecision: DecisionCard,
  existingDecisions: DecisionCard[]
): ConflictInfo | null {
  if (!existingDecisions || existingDecisions.length === 0) {
    return null;
  }

  // Check for mutual exclusion conflicts
  const mutualExclusion = checkMutualExclusion(newDecision, existingDecisions);
  if (mutualExclusion) {
    return mutualExclusion;
  }

  // Check for dependency conflicts
  const dependency = checkDependency(newDecision, existingDecisions);
  if (dependency) {
    return dependency;
  }

  // Check for similarity conflicts
  const similarity = checkSimilarity(newDecision, existingDecisions);
  if (similarity) {
    return similarity;
  }

  return null;
}

function checkMutualExclusion(
  newDecision: DecisionCard,
  existingDecisions: DecisionCard[]
): ConflictInfo | null {
  const conflicting = existingDecisions.filter((existing) => {
    // Same tenant and scenario, but different decision
    return (
      existing.decision_id !== newDecision.decision_id &&
      existing.tenant_id === newDecision.tenant_id &&
      existing.scenario_id === newDecision.scenario_id &&
      existing.status !== 'rejected' &&
      existing.status !== 'expired'
    );
  });

  if (conflicting.length > 0) {
    return {
      type: 'mutual_exclusion',
      related_decisions: conflicting.map((d) => d.decision_id),
      description: `Decision ${newDecision.decision_id} conflicts with ${conflicting.length} existing decision(s) in the same scenario`,
    };
  }

  return null;
}

function checkDependency(
  newDecision: DecisionCard,
  existingDecisions: DecisionCard[]
): ConflictInfo | null {
  const depending = existingDecisions.filter((existing) => {
    // Check if existing decision's suggested actions reference this new decision
    return existing.suggested_actions.some(
      (action) =>
        action.workflow_ref &&
        action.workflow_ref.decision_id === newDecision.decision_id
    );
  });

  if (depending.length > 0) {
    return {
      type: 'dependency',
      related_decisions: depending.map((d) => d.decision_id),
      description: `Decision ${newDecision.decision_id} is referenced by ${depending.length} existing decision(s)`,
    };
  }

  return null;
}

function checkSimilarity(
  newDecision: DecisionCard,
  existingDecisions: DecisionCard[]
): ConflictInfo | null {
  const similar = existingDecisions.filter((existing) => {
    if (existing.decision_id === newDecision.decision_id) {
      return false;
    }

    // Check title similarity
    const titleSimilarity = calculateSimilarity(
      newDecision.judgment.title,
      existing.judgment.title
    );

    // Check if same tenant and scenario with high title similarity
    return (
      titleSimilarity > 0.8 &&
      existing.tenant_id === newDecision.tenant_id &&
      existing.scenario_id === newDecision.scenario_id
    );
  });

  if (similar.length > 0) {
    return {
      type: 'similarity',
      related_decisions: similar.map((d) => d.decision_id),
      description: `Decision ${newDecision.decision_id} is similar to ${similar.length} existing decision(s)`,
    };
  }

  return null;
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) {
    return 0;
  }

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) {
    return 1;
  }

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) {
    return 1;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
