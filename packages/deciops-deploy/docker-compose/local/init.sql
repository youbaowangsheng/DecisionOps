-- PostgreSQL initialization script for deciops
-- Version: 1.0.0

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create deciops user and database
CREATE USER deciops WITH PASSWORD 'deciops_password';
CREATE DATABASE deciops OWNER deciops;
GRANT ALL PRIVILEGES ON DATABASE deciops TO deciops;

-- Connect to deciops database
\c deciops;

-- Enable row level security
ALTER DATABASE deciops SET session_replication_role = 'replica';

-- Create schema for deciops
CREATE SCHEMA IF NOT EXISTS deciops_schema;
GRANT ALL ON SCHEMA deciops_schema TO deciops;

-- ============================================================
-- RLS (Row Level Security) Multi-tenant Functions
-- ============================================================

-- Function to get current tenant ID from session
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.tenant_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.tenant_id', tenant_uuid::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID from session
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.user_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user context
CREATE OR REPLACE FUNCTION set_user_context(user_uuid uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.user_id', user_uuid::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Audit Logging Functions
-- ============================================================

CREATE OR REPLACE FUNCTION create_audit_log(
    action_type text,
    entity_type text,
    entity_id uuid,
    old_data jsonb DEFAULT NULL,
    new_data jsonb DEFAULT NULL,
    ip_address inet DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    audit_id uuid;
    current_user_uuid uuid;
    current_tenant_uuid uuid;
BEGIN
    current_user_uuid := get_current_user_id();
    current_tenant_uuid := get_current_tenant_id();

    INSERT INTO audit_log (
        id,
        tenant_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        ip_address,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        current_tenant_uuid,
        current_user_uuid,
        action_type,
        entity_type,
        entity_id,
        old_data,
        new_data,
        ip_address,
        now()
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create audit log: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Base Table Structures
-- ============================================================

-- Table: scenario_config
CREATE TABLE scenario_config (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    name VARCHAR(255) NOT NULL,
    description text,
    scenario_type VARCHAR(100) NOT NULL,
    config_data jsonb NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_tenant_scenario UNIQUE (tenant_id, name)
);

-- Enable RLS on scenario_config
ALTER TABLE scenario_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_scenario ON scenario_config
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_modification_scenario ON scenario_config
    FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE INDEX idx_scenario_config_tenant_id ON scenario_config(tenant_id);
CREATE INDEX idx_scenario_config_status ON scenario_config(status);
CREATE INDEX idx_scenario_config_type ON scenario_config(scenario_type);

-- Table: decision_card
CREATE TABLE decision_card (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    scenario_id uuid NOT NULL REFERENCES scenario_config(id),
    name VARCHAR(255) NOT NULL,
    description text,
    decision_type VARCHAR(100) NOT NULL,
    rules jsonb NOT NULL DEFAULT '[]',
    conditions jsonb NOT NULL DEFAULT '[]',
    actions jsonb NOT NULL DEFAULT '[]',
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_tenant_card UNIQUE (tenant_id, name)
);

-- Enable RLS on decision_card
ALTER TABLE decision_card ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_card ON decision_card
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_modification_card ON decision_card
    FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE INDEX idx_decision_card_tenant_id ON decision_card(tenant_id);
CREATE INDEX idx_decision_card_scenario_id ON decision_card(scenario_id);
CREATE INDEX idx_decision_card_active ON decision_card(is_active);
CREATE INDEX idx_decision_card_priority ON decision_card(priority DESC);

-- Table: execution_task
CREATE TABLE execution_task (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    scenario_id uuid NOT NULL REFERENCES scenario_config(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    input_data jsonb NOT NULL DEFAULT '{}',
    output_data jsonb,
    error_message text,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    executed_by uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

-- Enable RLS on execution_task
ALTER TABLE execution_task ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_task ON execution_task
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_modification_task ON execution_task
    FOR ALL
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE INDEX idx_execution_task_tenant_id ON execution_task(tenant_id);
CREATE INDEX idx_execution_task_scenario_id ON execution_task(scenario_id);
CREATE INDEX idx_execution_task_status ON execution_task(status);
CREATE INDEX idx_execution_task_created_at ON execution_task(created_at DESC);

-- Table: audit_log
CREATE TABLE audit_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid,
    user_id uuid,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_audit ON audit_log
    USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

CREATE POLICY tenant_modification_audit ON audit_log
    FOR ALL
    USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
    WITH CHECK (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================
-- Grant permissions to deciops user
-- ============================================================

GRANT USAGE ON SCHEMA deciops_schema TO deciops;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA deciops_schema TO deciops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA deciops_schema TO deciops;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA deciops_schema TO deciops;

GRANT USAGE ON SCHEMA public TO deciops;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deciops;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deciops;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO deciops;

-- ============================================================
-- Statistics and Monitoring
-- ============================================================

-- Create indexes for pg_stat_statements tracking (optional)
CREATE INDEX IF NOT EXISTS idx_pg_stat_statements ON pg_stat_statements(query);

-- Grant necessary permissions for monitoring
GRANT pg_read_all_settings TO deciops;
GRANT pg_stat_scan_tables TO deciops;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE scenario_config IS 'Stores decision scenario configurations';
COMMENT ON TABLE decision_card IS 'Individual decision cards within scenarios';
COMMENT ON TABLE execution_task IS 'Execution history for decision scenarios';
COMMENT ON TABLE audit_log IS 'Audit trail for all tenant actions';

COMMENT ON FUNCTION get_current_tenant_id() IS 'Returns the current tenant ID from session context';
COMMENT ON FUNCTION set_tenant_context(uuid) IS 'Sets the tenant context for the current session';
COMMENT ON FUNCTION create_audit_log(...) IS 'Creates an audit log entry with automatic tenant/user tracking';
