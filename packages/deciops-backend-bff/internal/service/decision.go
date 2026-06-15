package service

import (
	"context"

	"github.com/decisionops/deciops-backend-bff/internal/model"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
)

// DecisionService handles decision business logic
type DecisionService struct {
	repo *repository.PostgresRepository
}

// NewDecisionService creates a new decision service
func NewDecisionService(repo *repository.PostgresRepository) *DecisionService {
	return &DecisionService{repo: repo}
}

// ListDecisions retrieves decisions with filtering and pagination
func (s *DecisionService) ListDecisions(ctx context.Context, tenantID string, status string, page, pageSize int) ([]model.DecisionCard, int64, error) {
	return s.repo.ListDecisions(ctx, tenantID, status, page, pageSize)
}

// GetDecision retrieves a single decision
func (s *DecisionService) GetDecision(ctx context.Context, tenantID, decisionID string) (*model.DecisionCard, error) {
	return s.repo.GetDecision(ctx, tenantID, decisionID)
}

// AuditDecision audits a decision
func (s *DecisionService) AuditDecision(ctx context.Context, tenantID, decisionID string, approved bool, auditorID, comment string) error {
	return s.repo.AuditDecision(ctx, tenantID, decisionID, approved, auditorID, comment)
}