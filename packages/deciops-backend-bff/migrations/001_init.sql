-- Initial migration for DecisionOps Backend BFF

-- Create scenario_config table
CREATE TABLE IF NOT EXISTS scenario_config (
    scenario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    trigger_config JSONB NOT NULL,
    input_bindings JSONB NOT NULL,
    analysis_agents JSONB NOT NULL,
    synthesis_rules JSONB NOT NULL,
    audit_policy JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create decision_card table
CREATE TABLE IF NOT EXISTS decision_card (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    scenario_id UUID NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    status VARCHAR(32) NOT NULL,
    confidence NUMERIC(5,4),
    judgment JSONB NOT NULL,
    suggested_actions JSONB NOT NULL,
    conflict_info JSONB,
    audit_result JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create task table
CREATE TABLE IF NOT EXISTS task (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    decision_id UUID,
    type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    parameters JSONB,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for decision_card
CREATE INDEX IF NOT EXISTS idx_decision_tenant_status ON decision_card(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_decision_generated ON decision_card(tenant_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_decision_scenario ON decision_card(tenant_id, scenario_id);

-- Create indexes for scenario_config
CREATE INDEX IF NOT EXISTS idx_scenario_tenant ON scenario_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scenario_enabled ON scenario_config(tenant_id, enabled);

-- Create indexes for task
CREATE INDEX IF NOT EXISTS idx_task_tenant ON task(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_decision ON task(tenant_id, decision_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON task(tenant_id, status);

-- Enable Row Level Security
ALTER TABLE decision_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE task ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_decision ON decision_card
    USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_scenario ON scenario_config
    USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_task ON task
    USING (tenant_id = current_setting('app.tenant_id', true));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_scenario_config_updated_at ON scenario_config;
CREATE TRIGGER update_scenario_config_updated_at
    BEFORE UPDATE ON scenario_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decision_card_updated_at ON decision_card;
CREATE TRIGGER update_decision_card_updated_at
    BEFORE UPDATE ON decision_card
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_updated_at ON task;
CREATE TRIGGER update_task_updated_at
    BEFORE UPDATE ON task
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();