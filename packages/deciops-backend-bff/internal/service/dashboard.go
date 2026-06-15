package service

import (
	"context"

	"github.com/decisionops/deciops-backend-bff/internal/model"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
)

// DashboardService handles dashboard business logic
type DashboardService struct {
	repo *repository.PostgresRepository
}

// NewDashboardService creates a new dashboard service
func NewDashboardService(repo *repository.PostgresRepository) *DashboardService {
	return &DashboardService{repo: repo}
}

// GetDashboardMetrics retrieves dashboard metrics
func (s *DashboardService) GetDashboardMetrics(ctx context.Context, tenantID string) (*model.DashboardMetrics, error) {
	return s.repo.GetDashboardMetrics(ctx, tenantID)
}