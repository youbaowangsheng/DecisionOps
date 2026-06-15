export interface ExecutionTask {
  task_id: string;
  tenant_id: string;
  decision_id: string;
  action_id: string;
  task_type: 'workflow' | 'etl' | 'notification';
  target_ref: Record<string, any>;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  expected_impact: Record<string, any>;
  actual_impact: Record<string, any>;
  created_at: string;
  started_at: string;
  completed_at: string;
  error_message: string;
}
