package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/decisionops/deciops-backend-bff/internal/middleware"
	"github.com/decisionops/deciops-backend-bff/internal/model"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
	ws "github.com/decisionops/deciops-backend-bff/pkg/websocket"
)

// DecisionHandler handles decision-related requests
type DecisionHandler struct {
	repo *repository.PostgresRepository
	hub  *ws.Hub
}

// NewDecisionHandler creates a new decision handler
func NewDecisionHandler(repo *repository.PostgresRepository, hub *ws.Hub) *DecisionHandler {
	return &DecisionHandler{repo: repo, hub: hub}
}

// ListDecisions godoc
// @Summary List decisions
// @Description Get a paginated list of decisions with optional status filter
// @Tags decisions
// @Accept json
// @Produce json
// @Param status query string false "Filter by status (e.g., pending_audit)"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} model.PaginatedResponse
// @Failure 401 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/decisions [get]
func (h *DecisionHandler) ListDecisions(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	// Parse query parameters
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	decisions, total, err := h.repo.ListDecisions(c.Request.Context(), tenantID, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to list decisions: "+err.Error()))
		return
	}

	totalPages := int(total) / pageSize
	if int(total)%pageSize > 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, model.PaginatedResponse{
		Success:    true,
		Data:       decisions,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// GetDecision godoc
// @Summary Get a decision
// @Description Get a single decision by ID
// @Tags decisions
// @Accept json
// @Produce json
// @Param id path string true "Decision ID"
// @Success 200 {object} model.APIResponse
// @Failure 401 {object} model.APIResponse
// @Failure 404 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/decisions/{id} [get]
func (h *DecisionHandler) GetDecision(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	decisionID := c.Param("id")
	if decisionID == "" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse("decision_id is required"))
		return
	}

	decision, err := h.repo.GetDecision(c.Request.Context(), tenantID, decisionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to get decision: "+err.Error()))
		return
	}

	if decision == nil {
		c.JSON(http.StatusNotFound, model.ErrorResponse("decision not found"))
		return
	}

	c.JSON(http.StatusOK, model.SuccessResponse(decision))
}

// AuditDecision godoc
// @Summary Audit a decision
// @Description Approve or reject a decision
// @Tags decisions
// @Accept json
// @Produce json
// @Param id path string true "Decision ID"
// @Param request body model.AuditDecisionRequest true "Audit request"
// @Success 200 {object} model.APIResponse
// @Failure 401 {object} model.APIResponse
// @Failure 400 {object} model.APIResponse
// @Failure 500 {object} model.APIResponse
// @Router /api/v1/decisions/{id}/audit [post]
func (h *DecisionHandler) AuditDecision(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	if tenantID == "" {
		c.JSON(http.StatusUnauthorized, model.ErrorResponse("tenant_id is required"))
		return
	}

	decisionID := c.Param("id")
	if decisionID == "" {
		c.JSON(http.StatusBadRequest, model.ErrorResponse("decision_id is required"))
		return
	}

	var req model.AuditDecisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse("invalid request body: "+err.Error()))
		return
	}

	userID := middleware.GetUserID(c)
	if userID == "" {
		userID = req.AuditorID
	}

	if err := h.repo.AuditDecision(c.Request.Context(), tenantID, decisionID, req.Approved, userID, req.Comment); err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse("failed to audit decision: "+err.Error()))
		return
	}

	// Broadcast decision audited event via WebSocket
	if h.hub != nil {
		h.hub.BroadcastDecisionAudited(tenantID, decisionID, req.Approved, userID)
	}

	c.JSON(http.StatusOK, model.SuccessWithMessageResponse("decision audited successfully", gin.H{
		"decision_id": decisionID,
		"approved":    req.Approved,
	}))
}