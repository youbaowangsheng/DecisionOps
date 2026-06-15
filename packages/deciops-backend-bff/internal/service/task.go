package service

import (
	"context"

	"github.com/decisionops/deciops-backend-bff/internal/model"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
)

// TaskService handles task business logic
type TaskService struct {
	repo *repository.PostgresRepository
}

// NewTaskService creates a new task service
func NewTaskService(repo *repository.PostgresRepository) *TaskService {
	return &TaskService{repo: repo}
}

// ListTasks retrieves tasks with pagination
func (s *TaskService) ListTasks(ctx context.Context, tenantID string, page, pageSize int) ([]model.Task, int64, error) {
	return s.repo.ListTasks(ctx, tenantID, page, pageSize)
}

// GetTask retrieves a single task
func (s *TaskService) GetTask(ctx context.Context, tenantID, taskID string) (*model.Task, error) {
	return s.repo.GetTask(ctx, tenantID, taskID)
}

// CreateTask creates a new task
func (s *TaskService) CreateTask(ctx context.Context, tenantID, decisionID, taskType string, parameters map[string]interface{}) (*model.Task, error) {
	return s.repo.CreateTask(ctx, tenantID, decisionID, taskType, parameters)
}