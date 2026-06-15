export interface DecisionCard {
  id: string;
  title: string;
  scenarioName: string;
  confidence: number;
  status: 'pending_audit' | 'approved' | 'rejected' | 'executing' | 'completed';
  createdAt: string;
  updatedAt: string;
  summary: string;
  evidence: Evidence[];
  suggestedActions: SuggestedAction[];
  metrics?: Record<string, number>;
  tags?: string[];
}

export interface Evidence {
  id: string;
  metricName: string;
  value: number;
  baseline: number;
  dataSample?: string;
  description?: string;
}

export interface SuggestedAction {
  id: string;
  actionType: 'increase' | 'decrease' | 'maintain' | 'alert';
  target: string;
  expectedBenefit: number;
  risk: 'low' | 'medium' | 'high';
  description: string;
}

export interface DecisionFilters {
  status?: string;
  scenarioName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface Task {
  id: string;
  taskType: string;
  target: string;
  status: 'pending' | 'executing' | 'completed' | 'cancelled' | 'failed';
  createdAt: string;
  updatedAt: string;
  progress?: number;
  result?: TaskResult;
}

export interface TaskResult {
  expectedBenefit?: number;
  actualBenefit?: number;
  differenceRate?: number;
  details?: Record<string, unknown>;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  triggerType: 'schedule' | 'event' | 'data_freshness';
  enabled: boolean;
  cronExpression?: string;
  lastTriggeredAt?: string;
}

export interface AuditRule {
  id: string;
  name: string;
  type: 'auto_approve' | 'force_human' | 'timeout_escalation';
  threshold?: number;
  scenarioIds?: string[];
  timeoutMinutes?: number;
  enabled: boolean;
}

export interface DashboardMetrics {
  pendingAuditCount: number;
  avgAuditDuration: number;
  totalBenefit: number;
  todayNewDecisions: number;
  metricsAlerts: MetricsAlert[];
}

export interface MetricsAlert {
  id: string;
  metricName: string;
  currentValue: number;
  baselineValue: number;
  changeRate: number;
  timestamp: string;
}

export interface WSMessage {
  event: string;
  data: unknown;
  timestamp: string;
}