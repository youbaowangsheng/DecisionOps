import { useCallback } from 'react';
import { useDecisionStore } from '../stores/decisionStore';
import type { DecisionFilters } from '../services/types';

export function useDecision() {
  const {
    decisions,
    currentDecision,
    filters,
    loading,
    error,
    fetchDecisions,
    setCurrentDecision,
    setFilters,
    approveDecision,
    rejectDecision,
    modifyDecision,
  } = useDecisionStore();

  const loadDecisions = useCallback(
    async (additionalFilters?: Partial<DecisionFilters>) => {
      await fetchDecisions({ ...filters, ...additionalFilters });
    },
    [fetchDecisions, filters]
  );

  const handleApprove = useCallback(
    async (id: string, modifications?: object) => {
      await approveDecision(id, modifications);
    },
    [approveDecision]
  );

  const handleReject = useCallback(
    async (id: string, comment: string) => {
      await rejectDecision(id, comment);
    },
    [rejectDecision]
  );

  const handleModify = useCallback(
    async (id: string, modifications: object, comment: string) => {
      await modifyDecision(id, modifications, comment);
    },
    [modifyDecision]
  );

  return {
    decisions,
    currentDecision,
    filters,
    loading,
    error,
    loadDecisions,
    setCurrentDecision,
    setFilters,
    approve: handleApprove,
    reject: handleReject,
    modify: handleModify,
  };
}

export default useDecision;