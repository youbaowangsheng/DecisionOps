export interface Evidence {
  source: string;
  type: string;
  value: string;
  timestamp: string;
}

export interface Judgment {
  title: string;
  logic_summary: string;
  evidence: Evidence[];
}

export interface SuggestedAction {
  action_id: string;
  type: string;
  description: string;
  expected_impact: Record<string, any>;
  risk: string;
  workflow_ref: Record<string, any>;
  parameters: Record<string, any>;
}

export interface ConflictInfo {
  type: 'mutual_exclusion' | 'dependency' | 'similarity';
  related_decisions: string[];
  description: string;
}

export interface AuditResult {
  auditor: string;
  audited_at: string;
  action: 'approved' | 'rejected' | 'modified';
  modifications: Record<string, any>;
  comment: string;
}

export interface DecisionCard {
  decision_id: string;
  tenant_id: string;
  scenario_id: string;
  generated_at: string;
  status: 'pending_audit' | 'approved' | 'rejected' | 'modified' | 'expired';
  confidence: number;
  judgment: Judgment;
  suggested_actions: SuggestedAction[];
  conflict_info: ConflictInfo | null;
  audit_result: AuditResult | null;
  created_at: string;
  updated_at: string;
}

export interface AgentResult {
  agent_id: string;
  confidence: number;
  result: any;
  timestamp: string;
}
