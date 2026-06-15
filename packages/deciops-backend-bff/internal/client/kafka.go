package client

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
)

// KafkaClient handles Kafka messaging
type KafkaClient struct {
	brokers []string
	writer  *kafka.Writer
}

// NewKafkaClient creates a new Kafka client
func NewKafkaClient(brokers []string, topic string) *KafkaClient {
	return &KafkaClient{
		brokers: brokers,
		writer: &kafka.Writer{
			Addr:         kafka.TCP(brokers...),
			Topic:        topic,
			Balancer:     &kafka.LeastBytes{},
			BatchTimeout: 10 * time.Millisecond,
			RequiredAcks: kafka.RequireOne,
		},
	}
}

// Close closes the Kafka client
func (c *KafkaClient) Close() error {
	return c.writer.Close()
}

// KafkaMessage represents a Kafka message
type KafkaMessage struct {
	Type      string      `json:"type"`
	TenantID  string      `json:"tenant_id"`
	Data      interface{} `json:"data"`
	Timestamp string      `json:"timestamp"`
}

// PublishDecisionEvent publishes a decision event to Kafka
func (c *KafkaClient) PublishDecisionEvent(ctx context.Context, tenantID string, eventType string, data interface{}) error {
	msg := KafkaMessage{
		Type:      eventType,
		TenantID:  tenantID,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	err = c.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(tenantID),
		Value: body,
	})
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	return nil
}

// PublishNewDecision publishes a new decision event
func (c *KafkaClient) PublishNewDecision(ctx context.Context, tenantID, decisionID, title, priority string) error {
	data := map[string]interface{}{
		"decision_id": decisionID,
		"title":       title,
		"priority":    priority,
	}
	return c.PublishDecisionEvent(ctx, tenantID, "new_decision", data)
}

// PublishDecisionAudited publishes a decision audited event
func (c *KafkaClient) PublishDecisionAudited(ctx context.Context, tenantID, decisionID string, approved bool, auditorID string) error {
	data := map[string]interface{}{
		"decision_id": decisionID,
		"approved":    approved,
		"auditor_id":  auditorID,
	}
	return c.PublishDecisionEvent(ctx, tenantID, "decision_audited", data)
}

// PublishTaskProgress publishes a task progress event
func (c *KafkaClient) PublishTaskProgress(ctx context.Context, tenantID, taskID string, status string, progress int) error {
	data := map[string]interface{}{
		"task_id":   taskID,
		"status":    status,
		"progress": progress,
	}
	return c.PublishDecisionEvent(ctx, tenantID, "task_progress", data)
}