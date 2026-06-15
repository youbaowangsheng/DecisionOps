import { AgentResult } from '../types/decision';

/**
 * Compute confidence score based on agent results, scenario context, and historical accuracy.
 * Formula: weighted_confidence * 0.6 + consistency * 0.2 + historical_accuracy * 0.2
 *
 * @param agentResults - Array of agent results containing confidence scores
 * @param scenarioId - The scenario identifier for historical lookup
 * @returns Confidence score between 0 and 1
 */
export function computeConfidence(
  agentResults: AgentResult[],
  scenarioId: string
): number {
  if (!agentResults || agentResults.length === 0) {
    return 0;
  }

  // Weighted confidence (0.6 weight)
  const totalConfidence = agentResults.reduce((sum, r) => sum + r.confidence, 0);
  const weightedConfidence = totalConfidence / agentResults.length;

  // Consistency calculation (0.2 weight)
  // Measures how close individual confidences are to the mean
  const meanConfidence = weightedConfidence;
  const variance = agentResults.reduce(
    (sum, r) => sum + Math.pow(r.confidence - meanConfidence, 2),
    0
  ) / agentResults.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, 1 - stdDev);

  // Historical accuracy (0.2 weight)
  // In a real implementation, this would fetch from a database
  // For now, we use a placeholder that returns 0.85 as default
  const historicalAccuracy = getHistoricalAccuracy(scenarioId);

  const confidence =
    weightedConfidence * 0.6 + consistency * 0.2 + historicalAccuracy * 0.2;

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Get historical accuracy for a given scenario
 * This is a placeholder implementation
 */
function getHistoricalAccuracy(scenarioId: string): number {
  // In production, this would query a database or cache
  // returning actual historical accuracy data
  return 0.85;
}
