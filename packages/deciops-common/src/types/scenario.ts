export interface TriggerConfig {
  type: 'scheduled' | 'event' | 'data_freshness';
  config: Record<string, any>;
}

export interface InputBinding {
  field_name: string;
  source_type: string;
  source_ref: string;
  transform?: string;
}

export interface SynthesisRule {
  rule_id: string;
  name: string;
  priority: number;
  condition: string;
  output_field: string;
}

export interface AuditPolicy {
  auto_approve_threshold: number;
  force_human_review: boolean;
  escalation_timeout_minutes: number;
}

export interface ScenarioConfig {
  scenario_id: string;
  tenant_id: string;
  name: string;
  description: string;
  trigger_config: TriggerConfig;
  input_bindings: InputBinding[];
  analysis_agents: string[];
  synthesis_rules: SynthesisRule[];
  audit_policy: AuditPolicy;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
