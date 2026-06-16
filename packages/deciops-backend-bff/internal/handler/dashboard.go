package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/decisionops/deciops-backend-bff/internal/cache"
	"github.com/decisionops/deciops-backend-bff/internal/middleware"
	"github.com/decisionops/deciops-backend-bff/internal/model"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
)

// DashboardHandler handles dashboard-related requests
type DashboardHandler struct {
	repo        *repository.PostgresRepository
	redisCache  *cache.RedisClient
	cacheExpiry time.Duration
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(repo *repository.PostgresRepository, redisCache *cache.RedisClient) *DashboardHandler {
	return &DashboardHandler{
		repo:        repo,
		redisCache:  redisCache,
		cacheExpiry: 1 * time.Minute,
	}
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

	cacheKey := "dashboard:metrics"

	if h.redisCache != nil {
		cached, err := h.redisCache.Get(c.Request.Context(), tenantID, cacheKey)
		if err == nil && cached != "" {
			var metrics model.DashboardMetrics
			if json.Unmarshal([]byte(cached), &metrics) == nil {
				c.JSON(http.StatusOK, model.SuccessResponse(metrics))
				return
			}
		}
	}

	metrics, err := h.repo.GetDashboardMetrics(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to get dashboard metrics: "+err.Error()))
		return
	}

	if h.redisCache != nil {
		if data, err := json.Marshal(metrics); err == nil {
			h.redisCache.Set(c.Request.Context(), tenantID, cacheKey, string(data), h.cacheExpiry)
		}
	}

	c.JSON(http.StatusOK, model.SuccessResponse(metrics))
}