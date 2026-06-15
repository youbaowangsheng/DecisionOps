package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/golang-jwt/jwt/v5"
	ws "github.com/decisionops/deciops-backend-bff/pkg/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

// Claims represents JWT claims
type Claims struct {
	UserID   string `json:"user_id"`
	TenantID string `json:"tenant_id"`
	jwt.RegisteredClaims
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub       *ws.Hub
	jwtSecret string
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(hub *ws.Hub, jwtSecret string) *WebSocketHandler {
	return &WebSocketHandler{hub: hub, jwtSecret: jwtSecret}
}

// HandleWebSocket handles WebSocket upgrade and client registration
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	// Validate JWT token from query parameter
	tokenString := c.Query("token")
	if tokenString == "" {
		// Also check Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenString = parts[1]
			}
		}
	}

	if tokenString == "" {
		log.Printf("WebSocket auth failed: missing token")
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "missing token"})
		return
	}

	// Parse and validate JWT token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(h.jwtSecret), nil
	})

	if err != nil {
		log.Printf("WebSocket auth failed: invalid token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "invalid token"})
		return
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		log.Printf("WebSocket auth failed: invalid claims")
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "invalid token claims"})
		return
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket connection: %v", err)
		return
	}

	// Use tenant ID from JWT claims
	tenantID := claims.TenantID
	client := ws.NewClient(h.hub, conn, tenantID)
	h.hub.Register(client)

	log.Printf("WebSocket client connected: %s (tenant: %s)", client.ID(), tenantID)

	// Start client goroutines
	go client.WritePump()
	go client.ReadPump()
}