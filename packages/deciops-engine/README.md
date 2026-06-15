# DecisionOps Engine

Decision Analysis Engine Microservice

## Features

- **Decision Generation**: Orchestrates the decision-making workflow
- **Conflict Detection**: Detects conflicts between decisions
- **Decision Synthesis**: Combines agent results into coherent judgments
- **Scheduled Triggers**: XXL-JOB style scheduled analysis
- **Event Triggers**: Event-driven decision generation
- **Observability**: Structured logging, OpenTelemetry tracing, Prometheus metrics

## Quick Start

```bash
# Install dependencies
poetry install

# Run the service
poetry run uvicorn src.main:app --reload
```

## API Endpoints

### Decisions
- `GET /decisions` - List decisions
- `GET /decisions/{decision_id}` - Get decision details
- `POST /decisions/{decision_id}/approve` - Approve decision
- `POST /decisions/{decision_id}/reject` - Reject decision

### Scenarios
- `GET /scenarios` - List scenarios
- `GET /scenarios/{scenario_id}` - Get scenario details
- `POST /scenarios/{scenario_id}/trigger` - Trigger analysis

### Tasks
- `GET /tasks` - List tasks
- `GET /tasks/{task_id}` - Get task details
- `POST /tasks/{task_id}/execute` - Execute task

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Docker

```bash
docker build -t deciops-engine .
docker run -p 8000:8000 deciops-engine
```

## Testing

```bash
poetry run pytest
```