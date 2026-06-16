package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/decisionops/deciops-backend-bff/internal/model"
)

// PostgresRepository handles database operations
type PostgresRepository struct {
	db *pgxpool.Pool
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID            string                 `json:"id"`
	TenantID      string                 `json:"tenant_id"`
	DecisionID    string                 `json:"decision_id"`
	AuditorID     string                 `json:"auditor_id"`
	Action        string                 `json:"action"`
	Comment       string                 `json:"comment"`
	Modifications map[string]interface{} `json:"modifications"`
	IPAddress     string                 `json:"ip_address"`
	UserAgent     string                 `json:"user_agent"`
	CreatedAt     time.Time              `json:"created_at"`
}

// BenefitTracking represents a benefit tracking entry
type BenefitTracking struct {
	ID             string     `json:"id"`
	TenantID       string     `json:"tenant_id"`
	DecisionID     string     `json:"decision_id"`
	ScenarioID     string     `json:"scenario_id"`
	ExpectedBenefit float64   `json:"expected_benefit"`
	ActualBenefit  float64    `json:"actual_benefit"`
	BenefitType    string     `json:"benefit_type"`
	Status         string     `json:"status"`
	CalculatedAt   *time.Time `json:"calculated_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// NewPostgresDB creates a new PostgreSQL connection pool
func NewPostgresDB(dbURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	config.MaxConns = 20
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return pool, nil
}

// NewPostgresRepository creates a new repository instance
func NewPostgresRepository(db *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{db: db}
}

// ListDecisions retrieves decisions with filtering and pagination
func (r *PostgresRepository) ListDecisions(ctx context.Context, tenantID string, status string, page, pageSize int) ([]model.DecisionCard, int64, error) {
	offset := (page - 1) * pageSize

	// Build query based on status filter
	whereClause := "WHERE tenant_id = $1"
	args := []interface{}{tenantID}
	argIndex := 2

	if status != "" {
		whereClause += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM decision_card %s", whereClause)
	var total int64
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count decisions: %w", err)
	}

	// Get decisions
	query := fmt.Sprintf(`
		SELECT decision_id, tenant_id, scenario_id, generated_at, status, confidence,
		       judgment::text, suggested_actions::text, conflict_info::text, audit_result::text, created_at, updated_at
		FROM decision_card
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query decisions: %w", err)
	}
	defer rows.Close()

	var decisions []model.DecisionCard
	for rows.Next() {
		var d model.DecisionCard
		if err := rows.Scan(
			&d.DecisionID, &d.TenantID, &d.ScenarioID, &d.GeneratedAt, &d.Status, &d.Confidence,
			&d.Judgment, &d.SuggestedActions, &d.ConflictInfo, &d.AuditResult, &d.CreatedAt, &d.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan decision: %w", err)
		}
		decisions = append(decisions, d)
	}

	return decisions, total, nil
}

// GetDecision retrieves a single decision by ID
func (r *PostgresRepository) GetDecision(ctx context.Context, tenantID, decisionID string) (*model.DecisionCard, error) {
	query := `
		SELECT decision_id, tenant_id, scenario_id, generated_at, status, confidence,
		       judgment::text, suggested_actions::text, conflict_info::text, audit_result::text, created_at, updated_at
		FROM decision_card
		WHERE decision_id = $1 AND tenant_id = $2
	`

	var d model.DecisionCard
	err := r.db.QueryRow(ctx, query, decisionID, tenantID).Scan(
		&d.DecisionID, &d.TenantID, &d.ScenarioID, &d.GeneratedAt, &d.Status, &d.Confidence,
		&d.Judgment, &d.SuggestedActions, &d.ConflictInfo, &d.AuditResult, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get decision: %w", err)
	}

	return &d, nil
}

// AuditDecision updates a decision's audit status
func (r *PostgresRepository) AuditDecision(ctx context.Context, tenantID, decisionID string, approved bool, auditorID, comment string) error {
	query := `
		UPDATE decision_card
		SET status = $1,
		    audit_result = $2,
		    updated_at = NOW()
		WHERE decision_id = $3 AND tenant_id = $4 AND status = 'pending_audit'
	`

	status := "approved"
	if !approved {
		status = "rejected"
	}

	auditResult := map[string]interface{}{
		"auditor_id": auditorID,
		"comment":    comment,
		"approved":   approved,
		"audited_at": time.Now().Format(time.RFC3339),
	}

	result, err := r.db.Exec(ctx, query, status, auditResult, decisionID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to audit decision: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("decision not found or already audited")
	}

	return nil
}

// ListScenarios retrieves all scenarios for a tenant
func (r *PostgresRepository) ListScenarios(ctx context.Context, tenantID string) ([]model.ScenarioConfig, error) {
	query := `
		SELECT scenario_id, tenant_id, name, description, trigger_config, input_bindings,
		       analysis_agents, synthesis_rules, audit_policy, enabled, created_at, updated_at
		FROM scenario_config
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query scenarios: %w", err)
	}
	defer rows.Close()

	var scenarios []model.ScenarioConfig
	for rows.Next() {
		var s model.ScenarioConfig
		if err := rows.Scan(
			&s.ScenarioID, &s.TenantID, &s.Name, &s.Description, &s.TriggerConfig,
			&s.InputBindings, &s.AnalysisAgents, &s.SynthesisRules, &s.AuditPolicy,
			&s.Enabled, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan scenario: %w", err)
		}
		scenarios = append(scenarios, s)
	}

	return scenarios, nil
}

// GetScenario retrieves a single scenario by ID
func (r *PostgresRepository) GetScenario(ctx context.Context, tenantID, scenarioID string) (*model.ScenarioConfig, error) {
	query := `
		SELECT scenario_id, tenant_id, name, description, trigger_config, input_bindings,
		       analysis_agents, synthesis_rules, audit_policy, enabled, created_at, updated_at
		FROM scenario_config
		WHERE scenario_id = $1 AND tenant_id = $2
	`

	var s model.ScenarioConfig
	err := r.db.QueryRow(ctx, query, scenarioID, tenantID).Scan(
		&s.ScenarioID, &s.TenantID, &s.Name, &s.Description, &s.TriggerConfig,
		&s.InputBindings, &s.AnalysisAgents, &s.SynthesisRules, &s.AuditPolicy,
		&s.Enabled, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get scenario: %w", err)
	}

	return &s, nil
}

// ListTasks retrieves tasks for a tenant
func (r *PostgresRepository) ListTasks(ctx context.Context, tenantID string, page, pageSize int) ([]model.Task, int64, error) {
	offset := (page - 1) * pageSize

	countQuery := "SELECT COUNT(*) FROM task WHERE tenant_id = $1"
	var total int64
	if err := r.db.QueryRow(ctx, countQuery, tenantID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count tasks: %w", err)
	}

	query := `
		SELECT task_id, tenant_id, decision_id, type, status, progress,
		       parameters, result, error_message, created_at, updated_at
		FROM task
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(
			&t.TaskID, &t.TenantID, &t.DecisionID, &t.Type, &t.Status, &t.Progress,
			&t.Parameters, &t.Result, &t.ErrorMessage, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan task: %w", err)
		}
		tasks = append(tasks, t)
	}

	return tasks, total, nil
}

// GetTask retrieves a single task by ID
func (r *PostgresRepository) GetTask(ctx context.Context, tenantID, taskID string) (*model.Task, error) {
	query := `
		SELECT task_id, tenant_id, decision_id, type, status, progress,
		       parameters, result, error_message, created_at, updated_at
		FROM task
		WHERE task_id = $1 AND tenant_id = $2
	`

	var t model.Task
	err := r.db.QueryRow(ctx, query, taskID, tenantID).Scan(
		&t.TaskID, &t.TenantID, &t.DecisionID, &t.Type, &t.Status, &t.Progress,
		&t.Parameters, &t.Result, &t.ErrorMessage, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	return &t, nil
}

// CreateTask creates a new task
func (r *PostgresRepository) CreateTask(ctx context.Context, tenantID, decisionID, taskType string, parameters map[string]interface{}) (*model.Task, error) {
	taskID := uuid.New().String()

	query := `
		INSERT INTO task (task_id, tenant_id, decision_id, type, status, progress, parameters)
		VALUES ($1, $2, $3, $4, 'pending', 0, $5)
		RETURNING task_id, tenant_id, decision_id, type, status, progress, parameters, created_at, updated_at
	`

	var t model.Task
	err := r.db.QueryRow(ctx, query, taskID, tenantID, decisionID, taskType, parameters).Scan(
		&t.TaskID, &t.TenantID, &t.DecisionID, &t.Type, &t.Status, &t.Progress,
		&t.Parameters, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	return &t, nil
}

// GetDashboardMetrics retrieves dashboard metrics for a tenant
func (r *PostgresRepository) GetDashboardMetrics(ctx context.Context, tenantID string) (*model.DashboardMetrics, error) {
	metrics := &model.DashboardMetrics{
		PriorityBreakdown: make(map[string]int64),
		StatusBreakdown:   make(map[string]int64),
	}

	// Total decisions
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM decision_card WHERE tenant_id = $1", tenantID).Scan(&metrics.TotalDecisions); err != nil {
		return nil, fmt.Errorf("failed to count total decisions: %w", err)
	}

	// Pending audit count
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM decision_card WHERE tenant_id = $1 AND status = 'pending_audit'", tenantID).Scan(&metrics.PendingAuditCount); err != nil {
		return nil, fmt.Errorf("failed to count pending audit: %w", err)
	}

	// Approved count
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM decision_card WHERE tenant_id = $1 AND status = 'approved'", tenantID).Scan(&metrics.ApprovedCount); err != nil {
		return nil, fmt.Errorf("failed to count approved: %w", err)
	}

	// Rejected count
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM decision_card WHERE tenant_id = $1 AND status = 'rejected'", tenantID).Scan(&metrics.RejectedCount); err != nil {
		return nil, fmt.Errorf("failed to count rejected: %w", err)
	}

	// Today's decisions
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM decision_card WHERE tenant_id = $1 AND generated_at >= CURRENT_DATE", tenantID).Scan(&metrics.TodayDecisions); err != nil {
		return nil, fmt.Errorf("failed to count today's decisions: %w", err)
	}

	// Active scenarios
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM scenario_config WHERE tenant_id = $1 AND enabled = true", tenantID).Scan(&metrics.ActiveScenarios); err != nil {
		return nil, fmt.Errorf("failed to count active scenarios: %w", err)
	}

	return metrics, nil
}

// CreateAuditLog creates a new audit log entry
func (r *PostgresRepository) CreateAuditLog(ctx context.Context, tenantID, decisionID, auditorID, action, comment string, modifications map[string]interface{}, ipAddress, userAgent string) error {
	query := `
		INSERT INTO audit_log (tenant_id, decision_id, auditor_id, action, comment, modifications, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.Exec(ctx, query, tenantID, decisionID, auditorID, action, comment, modifications, ipAddress, userAgent)
	if err != nil {
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

// UpdateBenefitTracking updates a benefit tracking entry
func (r *PostgresRepository) UpdateBenefitTracking(ctx context.Context, tenantID, decisionID string, expectedBenefit, actualBenefit float64, benefitType, status string) error {
	query := `
		UPDATE benefit_tracking
		SET expected_benefit = $1,
		    actual_benefit = $2,
		    benefit_type = $3,
		    status = $4,
		    calculated_at = NOW(),
		    updated_at = NOW()
		WHERE tenant_id = $5 AND decision_id = $6
	`

	result, err := r.db.Exec(ctx, query, expectedBenefit, actualBenefit, benefitType, status, tenantID, decisionID)
	if err != nil {
		return fmt.Errorf("failed to update benefit tracking: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("benefit tracking not found")
	}

	return nil
}

// GetBenefitSummary retrieves benefit summary for a tenant
func (r *PostgresRepository) GetBenefitSummary(ctx context.Context, tenantID string) (map[string]interface{}, error) {
	summary := make(map[string]interface{})

	// Total expected benefit
	var totalExpected float64
	if err := r.db.QueryRow(ctx, "SELECT COALESCE(SUM(expected_benefit), 0) FROM benefit_tracking WHERE tenant_id = $1", tenantID).Scan(&totalExpected); err != nil {
		return nil, fmt.Errorf("failed to calculate total expected benefit: %w", err)
	}
	summary["total_expected_benefit"] = totalExpected

	// Total actual benefit
	var totalActual float64
	if err := r.db.QueryRow(ctx, "SELECT COALESCE(SUM(actual_benefit), 0) FROM benefit_tracking WHERE tenant_id = $1", tenantID).Scan(&totalActual); err != nil {
		return nil, fmt.Errorf("failed to calculate total actual benefit: %w", err)
	}
	summary["total_actual_benefit"] = totalActual

	// Benefit by status
	query := `
		SELECT status, COUNT(*), COALESCE(SUM(expected_benefit), 0), COALESCE(SUM(actual_benefit), 0)
		FROM benefit_tracking
		WHERE tenant_id = $1
		GROUP BY status
	`
	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query benefit by status: %w", err)
	}
	defer rows.Close()

	statusBreakdown := make(map[string]map[string]interface{})
	for rows.Next() {
		var status string
		var count int64
		var expected, actual float64
		if err := rows.Scan(&status, &count, &expected, &actual); err != nil {
			return nil, fmt.Errorf("failed to scan benefit status: %w", err)
		}
		statusBreakdown[status] = map[string]interface{}{
			"count":            count,
			"expected_benefit": expected,
			"actual_benefit":   actual,
		}
	}
	summary["by_status"] = statusBreakdown

	return summary, nil
}