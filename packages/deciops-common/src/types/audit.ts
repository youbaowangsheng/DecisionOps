export interface AuditRecord {
  audit_id: string;
  decision_id: string;
  auditor: string;
  action: 'approved' | 'rejected' | 'modified';
  modifications: Record<string, any>;
  comment: string;
  audited_at: string;
  tenant_id: string;
}

export interface AuditTrail {
  audit_id: string;
  decision_id: string;
  events: AuditEvent[];
}

export interface AuditEvent {
  event_id: string;
  event_type: string;
  actor: string;
  details: Record<string, any>;
  timestamp: string;
}
