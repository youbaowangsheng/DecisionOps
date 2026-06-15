package model

import "time"

// ListDecisionsRequest represents the query parameters for listing decisions
type ListDecisionsRequest struct {
	Status   string `form:"status"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

// AuditDecisionRequest represents the request body for auditing a decision
type AuditDecisionRequest struct {
	Approved  bool   `json:"approved"`
	Comment   string `json:"comment"`
	AuditorID string `json:"auditor_id"`
}

// TriggerScenarioRequest represents the request body for triggering a scenario
type TriggerScenarioRequest struct {
	InputData map[string]interface{} `json:"input_data"`
}

// ExecuteTaskRequest represents the request body for executing a task
type ExecuteTaskRequest struct {
	Parameters map[string]interface{} `json:"parameters"`
}

// ScenarioConfig represents a scenario configuration
type ScenarioConfig struct {
	ScenarioID      string                 `json:"scenario_id"`
	TenantID        string                 `json:"tenant_id"`
	Name            string                 `json:"name"`
	Description     string                 `json:"description"`
	TriggerConfig   map[string]interface{} `json:"trigger_config"`
	InputBindings   map[string]interface{} `json:"input_bindings"`
	AnalysisAgents  []string               `json:"analysis_agents"`
	SynthesisRules  map[string]interface{} `json:"synthesis_rules"`
	AuditPolicy     map[string]interface{} `json:"audit_policy"`
	Enabled         bool                   `json:"enabled"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
}

// DecisionCard represents a decision card
type DecisionCard struct {
	DecisionID    string     `json:"decision_id"`
	TenantID      string     `json:"tenant_id"`
	ScenarioID    string     `json:"scenario_id"`
	GeneratedAt   time.Time  `json:"generated_at"`
	Status        string     `json:"status"`
	Confidence    float64    `json:"confidence"`
	Judgment      *string   `json:"judgment"`
	SuggestedActions *string `json:"suggested_actions"`
	ConflictInfo  *string   `json:"conflict_info"`
	AuditResult   *string   `json:"audit_result"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Task represents a task
type Task struct {
	TaskID       string                 `json:"task_id"`
	TenantID     string                 `json:"tenant_id"`
	DecisionID   string                 `json:"decision_id"`
	Type         string                 `json:"type"`
	Status       string                 `json:"status"`
	Progress     int                    `json:"progress"`
	Parameters   map[string]interface{} `json:"parameters"`
	Result       map[string]interface{} `json:"result"`
	ErrorMessage string                 `json:"error_message"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}