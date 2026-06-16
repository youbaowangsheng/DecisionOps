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

// ScenarioHandler handles scenario-related requests
type ScenarioHandler struct {
	repo        *repository.PostgresRepository
	redisCache  *cache.RedisClient
	cacheExpiry time.Duration
}

// NewScenarioHandler creates a new scenario handler
func NewScenarioHandler(repo *repository.PostgresRepository, redisCache *cache.RedisClient) *ScenarioHandler {
	return &ScenarioHandler{
		repo:        repo,
		redisCache:  redisCache,
		cacheExpiry: 5 * time.Minute,
	}
}

// ListScenarios godoc
// @Summary List scenarios
// @Description Get all scenarios for the current tenant
// @Tags scenarios
// @Accept json
// @Produce json
// @Success 200 {object} model.APIResponse
// @Failure 401 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/scenarios [get]
func (h *ScenarioHandler) ListScenarios(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	cacheKey := "scenarios:list"

	if h.redisCache != nil {
		cached, err := h.redisCache.Get(c.Request.Context(), tenantID, cacheKey)
		if err == nil && cached != "" {
			var scenarios []model.ScenarioConfig
			if json.Unmarshal([]byte(cached), &scenarios) == nil {
				c.JSON(http.StatusOK, model.SuccessResponse(scenarios))
				return
			}
		}
	}

	scenarios, err := h.repo.ListScenarios(c.Request.Context(), tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to list scenarios: "+err.Error()))
		return
	}

	if h.redisCache != nil {
		if data, err := json.Marshal(scenarios); err == nil {
			h.redisCache.Set(c.Request.Context(), tenantID, cacheKey, string(data), h.cacheExpiry)
		}
	}

	c.JSON(http.StatusOK, model.SuccessResponse(scenarios))
}

// TriggerScenario godoc
// @Summary Trigger a scenario
// @Description Trigger a scenario to start decision generation
// @Tags scenarios
// @Accept json
// @Produce json
// @Param id path string true "Scenario ID"
// @Param request body model.TriggerScenarioRequest true "Trigger request"
// @Success 200 {object} model.APIResponse
// @Failure 401 {object} model.APIResponse
// @Failure 404 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/scenarios/{id}/trigger [post]
func (h *ScenarioHandler) TriggerScenario(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	scenarioID := c.Param("id")
	if scenarioID == "" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse("scenario_id is required"))
		return
	}

	// Verify scenario exists
	scenario, err := h.repo.GetScenario(c.Request.Context(), tenantID, scenarioID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to get scenario: "+err.Error()))
		return
	}

	if scenario == nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse("scenario not found"))
		return
	}

	if !scenario.Enabled {
		c.JSON(http.StatusBadRequest, model.ErrorResponse("scenario is disabled"))
		return
	}

	var req model.TriggerScenarioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body
		req = model.TriggerScenarioRequest{
			InputData: make(map[string]interface{}),
		}
	}

	// In a real implementation, this would call the decision engine
	// For now, we just return a success response indicating the trigger was accepted
	c.JSON(http.StatusOK, model.SuccessWithMessageResponse("scenario triggered successfully", gin.H{
		"scenario_id": scenarioID,
		"status":      "triggered",
		"input_data":  req.InputData,
	}))
}