# DecisionOps Backend BFF

Backend for Frontend (BFF) service for the DecisionOps platform, built with Go and Gin framework.

## Features

- RESTful API for decisions, scenarios, tasks, and dashboard
- WebSocket support for real-time updates
- JWT-based authentication
- Multi-tenant isolation
- OpenTelemetry tracing
- PostgreSQL database integration
- Kafka event publishing

## Prerequisites

- Go 1.21+
- PostgreSQL 14+
- Redis 7+
- Kafka 3+

## Quick Start

### Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Install dependencies:
   ```bash
   go mod download
   ```
4. Run the server:
   ```bash
   go run ./cmd/server
   ```

### Docker

```bash
docker build -t deciops-backend-bff .
docker run -p 8080:8080 --env-file .env deciops-backend-bff
```

## API Endpoints

### Decisions

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/decisions | List decisions with optional status filter |
| GET | /api/v1/decisions/:id | Get a single decision |
| POST | /api/v1/decisions/:id/audit | Audit a decision |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/tasks | List tasks |
| POST | /api/v1/tasks/:id/execute | Execute a task |

### Scenarios

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/scenarios | List scenarios |
| POST | /api/v1/scenarios/:id/trigger | Trigger a scenario |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/dashboard/metrics | Get dashboard metrics |

### WebSocket

| Path | Description |
|------|-------------|
| /ws | WebSocket endpoint for real-time updates |

## WebSocket Events

- `new_decision`: New decision generated
- `decision_audited`: Decision audit completed
- `task_progress`: Task status changed

## Authentication

All API endpoints (except WebSocket upgrade) require JWT authentication.

Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

The JWT must contain `user_id` and `tenant_id` claims.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| SERVER_PORT | HTTP server port | 8080 |
| ENGINE_URL | Decision engine URL | http://decision-engine:8081 |
| DB_URL | PostgreSQL connection URL | postgresql://deciops:password@postgres:5432/deciops |
| REDIS_URL | Redis connection URL | redis://redis:6379 |
| KAFKA_BROKERS | Kafka broker addresses | localhost:9092 |
| JWT_SECRET | JWT signing secret | your-secret-key |

## Database Migrations

Run migrations against the database:

```bash
psql $DB_URL -f migrations/001_init.sql
```

## Project Structure

```
.
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/                  # Configuration management
│   ├── handler/                 # HTTP handlers
│   ├── middleware/             # Gin middleware
│   ├── service/                # Business logic
│   ├── repository/             # Database access
│   ├── client/                # External service clients
│   └── model/                 # Data models
├── pkg/
│   └── websocket/             # WebSocket hub and client
├── migrations/                 # SQL migrations
├── Dockerfile
├── go.mod
├── go.sum
└── .env.example
```

## License

MIT