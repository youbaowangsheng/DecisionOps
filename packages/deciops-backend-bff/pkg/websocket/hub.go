package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to clients
type Hub struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	mu         sync.RWMutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte, 256),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID()] = client
			h.mu.Unlock()
			log.Printf("Client registered: %s (tenant: %s)", client.ID(), client.TenantID())

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID()]; ok {
				delete(h.clients, client.ID())
				close(client.Send())
				log.Printf("Client unregistered: %s", client.ID())
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.Send() <- message:
				default:
					close(client.Send())
					delete(h.clients, client.ID())
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register registers a client with the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister unregisters a client from the hub
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// BroadcastToTenant sends a message to all clients of a specific tenant
func (h *Hub) BroadcastToTenant(tenantID string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, client := range h.clients {
		if client.TenantID() == tenantID {
			select {
			case client.Send() <- message:
			default:
				close(client.Send())
				delete(h.clients, client.ID())
			}
		}
	}
}

// Broadcast sends a message to all connected clients
func (h *Hub) Broadcast(message []byte) {
	h.broadcast <- message
}

// ClientCount returns the number of connected clients
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// Message represents a WebSocket message
type Message struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp string      `json:"timestamp"`
}

// NewMessage creates a new message
func NewMessage(eventType string, data interface{}) []byte {
	msg := Message{
		Type:      eventType,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	body, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return nil
	}
	return body
}

// BroadcastNewDecision broadcasts a new decision event
func (h *Hub) BroadcastNewDecision(tenantID, decisionID, title, priority string) {
	data := map[string]interface{}{
		"decision_id": decisionID,
		"title":       title,
		"priority":    priority,
	}
	h.BroadcastToTenant(tenantID, NewMessage("new_decision", data))
}

// BroadcastDecisionAudited broadcasts a decision audited event
func (h *Hub) BroadcastDecisionAudited(tenantID, decisionID string, approved bool, auditorID string) {
	data := map[string]interface{}{
		"decision_id": decisionID,
		"approved":    approved,
		"auditor_id":  auditorID,
	}
	h.BroadcastToTenant(tenantID, NewMessage("decision_audited", data))
}

// BroadcastTaskProgress broadcasts a task progress event
func (h *Hub) BroadcastTaskProgress(tenantID, taskID, status string, progress int) {
	data := map[string]interface{}{
		"task_id":   taskID,
		"status":    status,
		"progress": progress,
	}
	h.BroadcastToTenant(tenantID, NewMessage("task_progress", data))
}