-- audit_log table: Audit trail for all decisions
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    decision_id UUID NOT NULL,
    auditor_id VARCHAR(64),
    action VARCHAR(20) NOT NULL, -- approve, reject, modify
    comment TEXT,
    modifications JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- benefit_tracking table: Track decision benefits
CREATE TABLE IF NOT EXISTS benefit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    decision_id UUID NOT NULL,
    scenario_id VARCHAR(64) NOT NULL,
    expected_benefit DECIMAL(15,2),
    actual_benefit DECIMAL(15,2),
    benefit_type VARCHAR(50), -- cost_saving, revenue_increase, efficiency
    status VARCHAR(20) DEFAULT 'pending', -- pending, achieved, missed
    calculated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_decision_id ON audit_log(decision_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_benefit_tracking_decision_id ON benefit_tracking(decision_id);
CREATE INDEX IF NOT EXISTS idx_benefit_tracking_tenant_id ON benefit_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_benefit_tracking_status ON benefit_tracking(status);

-- Enable Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_audit_log ON audit_log
    USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_benefit_tracking ON benefit_tracking
    USING (tenant_id = current_setting('app.tenant_id', true));

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_audit_log_updated_at ON audit_log;
CREATE TRIGGER update_audit_log_updated_at
    BEFORE UPDATE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_benefit_tracking_updated_at ON benefit_tracking;
CREATE TRIGGER update_benefit_tracking_updated_at
    BEFORE UPDATE ON benefit_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();