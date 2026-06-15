package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/decisionops/deciops-backend-bff/internal/middleware"
	"github.com/decisionops/deciops-backend-bff/internal/model"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
)

// DashboardHandler handles dashboard-related requests
type DashboardHandler struct {
	repo *repository.PostgresRepository
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(repo *repository.PostgresRepository) *DashboardHandler {
	return &DashboardHandler{repo: repo}
}

// GetDashboardMetrics godoc
// @Summary Get dashboard metrics
// @Description Get metrics for the dashboard
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} model.APIResponse
// @Failure 401 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/dashboard/metrics [get]
func (h *DashboardHandler) GetDashboardMetrics(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	metrics, err := h.repo.GetDashboardMetrics(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to get dashboard metrics: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse(metrics))
}