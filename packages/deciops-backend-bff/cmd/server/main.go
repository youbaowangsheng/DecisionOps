package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/decisionops/deciops-backend-bff/internal/config"
	"github.com/decisionops/deciops-backend-bff/internal/handler"
	"github.com/decisionops/deciops-backend-bff/internal/middleware"
	"github.com/decisionops/deciops-backend-bff/internal/repository"
	"github.com/decisionops/deciops-backend-bff/pkg/websocket"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := repository.NewPostgresDB(cfg.DBURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repository
	repo := repository.NewPostgresRepository(db)

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize handlers
	decisionHandler := handler.NewDecisionHandler(repo, hub)
	scenarioHandler := handler.NewScenarioHandler(repo)
	taskHandler := handler.NewTaskHandler(repo)
	dashboardHandler := handler.NewDashboardHandler(repo)
	wsHandler := handler.NewWebSocketHandler(hub, cfg.JWTSecret)

	// Setup Gin router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORS())
	router.Use(middleware.Tracing())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Prometheus metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// WebSocket endpoint
	router.GET("/ws", wsHandler.HandleWebSocket)

	// API v1 routes
	v1 := router.Group("/api/v1")
	v1.Use(middleware.JWTAuth(cfg.JWTSecret))
	v1.Use(middleware.TenantContext())
	{
		decisions := v1.Group("/decisions")
		{
			decisions.GET("", decisionHandler.ListDecisions)
			decisions.GET("/:id", decisionHandler.GetDecision)
			decisions.POST("/:id/audit", decisionHandler.AuditDecision)
		}

		tasks := v1.Group("/tasks")
		{
			tasks.GET("", taskHandler.ListTasks)
			tasks.POST("/:id/execute", taskHandler.ExecuteTask)
		}

		scenarios := v1.Group("/scenarios")
		{
			scenarios.GET("", scenarioHandler.ListScenarios)
			scenarios.POST("/:id/trigger", scenarioHandler.TriggerScenario)
		}

		dashboard := v1.Group("/dashboard")
		{
			dashboard.GET("/metrics", dashboardHandler.GetDashboardMetrics)
		}
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: router,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}