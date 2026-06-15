import { create } from 'zustand';
import type { DecisionCard, DecisionFilters } from '../services/types';
import { decisionApi } from '../services/api';

interface DecisionState {
  decisions: DecisionCard[];
  currentDecision: DecisionCard | null;
  filters: DecisionFilters;
  loading: boolean;
  error: string | null;

  fetchDecisions: (filters: DecisionFilters) => Promise<void>;
  setCurrentDecision: (decision: DecisionCard | null) => void;
  setFilters: (filters: DecisionFilters) => void;
  approveDecision: (id: string, modifications?: object) => Promise<void>;
  rejectDecision: (id: string, comment: string) => Promise<void>;
  modifyDecision: (id: string, modifications: object, comment: string) => Promise<void>;
  updateDecisionInList: (id: string, updates: Partial<DecisionCard>) => void;
  addDecision: (decision: DecisionCard) => void;
}

export const useDecisionStore = create<DecisionState>((set, get) => ({
  decisions: [],
  currentDecision: null,
  filters: { status: 'pending_audit', page: 1, pageSize: 20 },
  loading: false,
  error: null,

  fetchDecisions: async (filters: DecisionFilters) => {
    set({ loading: true, error: null });
    try {
      const { data } = await decisionApi.list(filters);
      // Transform API response to frontend types
      const transformed = (data.data || []).map((d: any) => ({
        id: d.decision_id,
        title: d.judgment ? JSON.parse(d.judgment)?.conclusion || '决策建议' : '决策建议',
        scenarioName: d.scenario_id || '未知场景',
        confidence: d.confidence || 0,
        status: d.status || 'pending_audit',
        createdAt: d.created_at || d.generated_at,
        updatedAt: d.updated_at || d.generated_at,
        summary: d.judgment ? JSON.parse(d.judgment)?.conclusion || '' : '',
        evidence: [],
        suggestedActions: d.suggested_actions ? JSON.parse(d.suggested_actions).map((a: any, i: number) => ({
          id: `action_${i}`,
          actionType: 'alert' as const,
          target: a.object || '',
          expectedBenefit: 0,
          risk: 'medium' as const,
          description: a.description || '',
        })) : [],
      }));
      set({ decisions: transformed, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setCurrentDecision: (decision) => set({ currentDecision: decision }),

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  approveDecision: async (id, modifications) => {
    try {
      await decisionApi.audit(id, { action: 'approve', modifications });
      get().updateDecisionInList(id, { status: 'approved' });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  rejectDecision: async (id, comment) => {
    try {
      await decisionApi.audit(id, { action: 'reject', comment });
      get().updateDecisionInList(id, { status: 'rejected' });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  modifyDecision: async (id, modifications, comment) => {
    try {
      await decisionApi.audit(id, { action: 'modify', modifications, comment });
      get().updateDecisionInList(id, { status: 'approved' });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateDecisionInList: (id, updates) => {
    set((state) => ({
      decisions: state.decisions.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
  },

  addDecision: (decision) => {
    set((state) => ({
      decisions: [decision, ...state.decisions],
    }));
  },
}));