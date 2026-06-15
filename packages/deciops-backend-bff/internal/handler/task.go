package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/decisionops/deciops-backend-bff/internal/middleware"
	"github.com/decisionops/deciops-backend-bff/internal/model"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
)

// TaskHandler handles task-related requests
type TaskHandler struct {
	repo *repository.PostgresRepository
}

// NewTaskHandler creates a new task handler
func NewTaskHandler(repo *repository.PostgresRepository) *TaskHandler {
	return &TaskHandler{repo: repo}
}

// ListTasks godoc
// @Summary List tasks
// @Description Get a paginated list of tasks
// @Tags tasks
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} model.PaginatedResponse
// @Failure 401 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/tasks [get]
func (h *TaskHandler) ListTasks(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	tasks, total, err := h.repo.ListTasks(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to list tasks: "+err.Error()))
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Success:    true,
		Data:       tasks,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// ExecuteTask godoc
// @Summary Execute a task
// @Description Trigger task execution
// @Tags tasks
// @Accept json
// @Produce json
// @Param id path string true "Task ID"
// @Param request body model.ExecuteTaskRequest true "Execute request"
// @Success 200 {object} model.APIResponse
// @Failure 401 {object} model.APIResponse
// @Failure 404 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/tasks/{id}/execute [post]
func (h *TaskHandler) ExecuteTask(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse("task_id is required"))
		return
	}

	// Verify task exists
	task, err := h.repo.GetTask(c.Request.Context(), tenantID, taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to get task: "+err.Error()))
		return
	}

	if task == nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse("task not found"))
		return
	}

	var req model.ExecuteTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body
		req = model.ExecuteTaskRequest{
			Parameters: make(map[string]interface{}),
		}
	}

	// In a real implementation, this would trigger the task execution
	// For now, we just return a success response
	c.JSON(http.StatusOK, model.SuccessWithMessageResponse("task execution started", gin.H{
		"task_id": taskID,
		"status":  "executing",
	}))
}