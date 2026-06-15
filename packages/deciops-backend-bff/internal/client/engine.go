package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// EngineClient calls the decision engine service
type EngineClient struct {
	baseURL string
	client  *http.Client
}

// NewEngineClient creates a new engine client
func NewEngineClient(baseURL string) *EngineClient {
	return &EngineClient{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 30 * 1e9, // 30 seconds in nanoseconds
		},
	}
}

// TriggerDecisionRequest represents a request to trigger a decision
type TriggerDecisionRequest struct {
	ScenarioID  string                 `json:"scenario_id"`
	TenantID    string                 `json:"tenant_id"`
	InputData   map[string]interface{} `json:"input_data"`
	TriggeredBy string                 `json:"triggered_by"`
}

// TriggerDecisionResponse represents the response from triggering a decision
type TriggerDecisionResponse struct {
	DecisionID string `json:"decision_id"`
	Status     string `json:"status"`
	Message    string `json:"message"`
}

// TriggerDecision triggers a decision generation
func (c *EngineClient) TriggerDecision(ctx context.Context, req TriggerDecisionRequest) (*TriggerDecisionResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/v1/decisions/trigger", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call engine: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return nil, fmt.Errorf("engine returned status %d", resp.StatusCode)
	}

	var result TriggerDecisionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// GetDecisionStatus gets the status of a decision
func (c *EngineClient) GetDecisionStatus(ctx context.Context, decisionID string) (*TriggerDecisionResponse, error) {
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/api/v1/decisions/"+decisionID+"/status", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to call engine: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("engine returned status %d", resp.StatusCode)
	}

	var result TriggerDecisionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}