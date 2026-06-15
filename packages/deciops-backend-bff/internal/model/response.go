package model

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// PaginatedResponse represents a paginated response
type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

// DashboardMetrics represents dashboard metrics
type DashboardMetrics struct {
	TotalDecisions     int64            `json:"total_decisions"`
	PendingAuditCount int64            `json:"pending_audit_count"`
	ApprovedCount     int64            `json:"approved_count"`
	RejectedCount     int64            `json:"rejected_count"`
	TodayDecisions    int64            `json:"today_decisions"`
	ActiveScenarios   int64            `json:"active_scenarios"`
	PriorityBreakdown map[string]int64  `json:"priority_breakdown"`
	StatusBreakdown   map[string]int64  `json:"status_breakdown"`
}

// WebSocketMessage represents a WebSocket message
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp string      `json:"timestamp"`
}

// NewDecisionEvent represents a new decision event
type NewDecisionEvent struct {
	DecisionID string `json:"decision_id"`
	Title      string `json:"title"`
	Priority   string `json:"priority"`
}

// DecisionAuditedEvent represents a decision audited event
type DecisionAuditedEvent struct {
	DecisionID string `json:"decision_id"`
	Approved   bool   `json:"approved"`
	AuditorID  string `json:"auditor_id"`
}

// TaskProgressEvent represents a task progress event
type TaskProgressEvent struct {
	TaskID   string `json:"task_id"`
	Status   string `json:"status"`
	Progress int    `json:"progress"`
}

// ErrorResponse creates an error response
func ErrorResponse(message string) APIResponse {
	return APIResponse{
		Success: false,
		Error:   message,
	}
}

// SuccessResponse creates a success response
func SuccessResponse(data interface{}) APIResponse {
	return APIResponse{
		Success: true,
		Data:    data,
	}
}

// SuccessWithMessageResponse creates a success response with message
func SuccessWithMessageResponse(message string, data interface{}) APIResponse {
	return APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
}