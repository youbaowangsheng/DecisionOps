-- DeciOps 示例数据
-- 运行方法: psql -h localhost -U deciops -d deciops -f 002_seed_data.sql

-- 1. 场景配置数据
INSERT INTO scenario_config (scenario_id, tenant_id, name, description, trigger_config, input_bindings, analysis_agents, synthesis_rules, audit_policy, enabled)
VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'tenant_001',
    '华东仓库库存周转率异常检测',
    '监控华东区域仓库的库存周转率，连续4周低于阈值时触发告警',
    '{"type": "schedule", "config": {"cron": "0 0 9 * * MON-FRI"}}',
    '{"metrics": ["inventory_turnover_rate"], "time_range": {"period": "4w"}, "datasets": ["sku_inventory"], "entities": [{"type": "indicator", "name": "inventory_turnover"}]}',
    '["agent_001", "agent_002"]',
    '{"weights": [0.6, 0.4], "threshold": 0.75}',
    '{"auto_approve_threshold": 0.9, "force_human_review": false, "escalation_timeout_minutes": 60}',
    true
),
(
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'tenant_001',
    '成本优化建议',
    '分析历史成本数据，识别可优化项并生成降本建议',
    '{"type": "data_freshness", "config": {"threshold_hours": 24}}',
    '{"metrics": ["cost_per_unit", "production_cost"], "time_range": {"period": "3m"}}',
    '["agent_003"]',
    '{"weights": [1.0], "threshold": 0.7}',
    '{"auto_approve_threshold": 0.85, "force_human_review": true, "escalation_timeout_minutes": 120}',
    true
),
(
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'tenant_001',
    '用户流失预警',
    '基于用户行为数据，预测可能流失的用户并触发挽留策略',
    '{"type": "event", "config": {"event_name": "user_inactive_30d"}}',
    '{"metrics": ["user_activity_score", "last_login_diff"], "datasets": ["user_behavior"]}',
    '["agent_004", "agent_005"]',
    '{"weights": [0.5, 0.5], "threshold": 0.8}',
    '{"auto_approve_threshold": 0.95, "force_human_review": false, "escalation_timeout_minutes": 30}',
    true
),
(
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'tenant_001',
    '促销效果预测',
    '预测促销活动对销售额的影响，辅助定价决策',
    '{"type": "schedule", "config": {"cron": "0 0 12 * * *"}}',
    '{"metrics": ["promotion_roi", "sales_lift"], "time_range": {"period": "2w"}}',
    '["agent_006"]',
    '{"weights": [1.0], "threshold": 0.75}',
    '{"auto_approve_threshold": 0.8, "force_human_review": true, "escalation_timeout_minutes": 240}',
    true
),
(
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    'tenant_001',
    '补货建议',
    '根据销售预测和库存情况，生成智能补货建议',
    '{"type": "schedule", "config": {"cron": "0 0 8 * * *"}}',
    '{"metrics": ["stock_level", "sales_velocity"], "datasets": ["inventory"]}',
    '["agent_007"]',
    '{"weights": [1.0], "threshold": 0.7}',
    '{"auto_approve_threshold": 0.85, "force_human_review": false, "escalation_timeout_minutes": 60}',
    true
);

-- 2. 决策卡片数据
INSERT INTO decision_card (decision_id, tenant_id, scenario_id, generated_at, status, confidence, judgment, suggested_actions, conflict_info, audit_result)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'tenant_001',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NOW() - INTERVAL '2 hours',
    'pending_audit',
    0.82,
    '{"title": "华东仓库A库存周转率连续4周低于阈值", "logic_summary": "对比历史同期下降32%，低于行业目标2.5次/月，判定为滞销品积压", "evidence": [{"type": "indicator", "name": "周转率", "value": 1.8, "baseline": 2.6, "period": "last_4w"}, {"type": "table_sample", "dataset": "sku_inventory", "rows": 20, "url": "/api/data/preview/123"}]}',
    '[{"action_id": "act_001", "type": "create_campaign", "description": "针对SKU列表创建清理促销活动", "expected_impact": {"release_space": "15%", "cash_back": "80万"}, "risk": "可能影响品牌定位", "workflow_ref": {"platform": "smart_agent_platform", "workflow_id": "wf_promo_cleanup"}, "parameters": {"discount_range": [30, 50], "duration_days": 7}}]',
    NULL,
    NULL
),
(
    '22222222-2222-2222-2222-222222222222',
    'tenant_001',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    NOW() - INTERVAL '5 hours',
    'pending_audit',
    0.75,
    '{"title": "检测到3项成本异常项可优化", "logic_summary": "原材料损耗高于行业均值15%，包装成本可优化空间约12万/月", "evidence": [{"type": "indicator", "name": "原材料损耗率", "value": 8.5, "baseline": 7.4, "period": "last_3m"}, {"type": "indicator", "name": "包装成本占比", "value": 12.3, "baseline": 11.2, "period": "last_3m"}]}',
    '[{"action_id": "act_002", "type": "process_optimization", "description": "优化生产流程减少原材料损耗", "expected_impact": {"cost_reduction": "12万/月"}, "risk": "需停产改造", "workflow_ref": {"platform": "smart_agent_platform", "workflow_id": "wf_process_opt"}, "parameters": {"target_reduction": 15}}]',
    NULL,
    NULL
),
(
    '33333333-3333-3333-3333-333333333333',
    'tenant_001',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    NOW() - INTERVAL '1 day',
    'approved',
    0.88,
    '{"title": "识别出1,247名高流失风险用户", "logic_summary": "基于最近30天无活跃行为且历史活跃度下降60%筛选", "evidence": [{"type": "indicator", "name": "流失风险用户数", "value": 1247, "baseline": 800, "period": "last_30d"}]}',
    '[{"action_id": "act_003", "type": "user_retention", "description": "发送定向优惠券挽留用户", "expected_impact": {"retention_rate": "25%"}, "risk": "优惠成本", "workflow_ref": {"platform": "smart_agent_platform", "workflow_id": "wf_retention"}, "parameters": {"coupon_type": "discount", "discount_rate": 15}}]',
    NULL,
    '{"auditor": "operator_zhang", "audited_at": "2026-06-14T10:30:00Z", "action": "approved", "modifications": {}, "comment": "同意执行"}'
),
(
    '44444444-4444-4444-4444-444444444444',
    'tenant_001',
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    NOW() - INTERVAL '3 days',
    'rejected',
    0.65,
    '{"title": "建议下周一促销活动定价策略", "logic_summary": "预测活动可带来15%销售增长，建议折扣力度35%", "evidence": [{"type": "indicator", "name": "历史活动ROI", "value": 2.8, "baseline": 2.5, "period": "last_10"}]}',
    '[{"action_id": "act_004", "type": "pricing", "description": "执行35%折扣促销活动", "expected_impact": {"sales_increase": "15%"}, "risk": "利润率下降", "workflow_ref": {"platform": "smart_agent_platform", "workflow_id": "wf_pricing"}, "parameters": {"discount": 35}}]',
    NULL,
    '{"auditor": "manager_li", "audited_at": "2026-06-12T14:20:00Z", "action": "rejected", "modifications": {}, "comment": "折扣力度过大，建议调整为25%"}'
),
(
    '55555555-5555-5555-5555-555555555555',
    'tenant_001',
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    NOW() - INTERVAL '6 hours',
    'pending_audit',
    0.79,
    '{"title": "建议补充SKU-12345商品库存", "logic_summary": "销售速度加快，当前库存可支撑天数低于安全库存阈值", "evidence": [{"type": "indicator", "name": "当前库存", "value": 500, "baseline": 1200, "period": "current"}, {"type": "indicator", "name": "日均销量", "value": 150, "baseline": 100, "period": "last_7d"}]}',
    '[{"action_id": "act_005", "type": "replenishment", "description": "提交采购订单补充库存", "expected_impact": {"stock_days": "满足30天销售"}, "risk": "滞销风险", "workflow_ref": {"platform": "smart_agent_platform", "workflow_id": "wf_replenish"}, "parameters": {"order_quantity": 4000}}]',
    NULL,
    NULL
);

-- 3. 任务数据
INSERT INTO execution_task (task_id, tenant_id, decision_id, action_id, task_type, target_ref, parameters, status, expected_impact, actual_impact, created_at, started_at, completed_at)
VALUES
(
    'task_001',
    'tenant_001',
    '33333333-3333-3333-3333-333333333333',
    'act_003',
    'workflow',
    '{"platform": "smart_agent_platform", "workflow_id": "wf_retention"}',
    '{"coupon_type": "discount", "discount_rate": 15}',
    'completed',
    '{"retention_rate": "25%", "users_targeted": 1247}',
    '{"retention_rate": 23.5, "users_targeted": 1247, "coupon_sent": 1247, "coupon_used": 312}',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '20 hours'
),
(
    'task_002',
    'tenant_001',
    '22222222-2222-2222-2222-222222222222',
    'act_002',
    'workflow',
    '{"platform": "smart_agent_platform", "workflow_id": "wf_process_opt"}',
    '{"target_reduction": 15}',
    'running',
    '{"cost_reduction": "12万/月"}',
    NULL,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours',
    NULL
),
(
    'task_003',
    'tenant_001',
    '55555555-5555-5555-5555-555555555555',
    'act_005',
    'workflow',
    '{"platform": "smart_agent_platform", "workflow_id": "wf_replenish"}',
    '{"order_quantity": 4000}',
    'pending',
    '{"stock_days": "满足30天销售"}',
    NULL,
    NOW() - INTERVAL '1 hour',
    NULL,
    NULL
),
(
    'task_004',
    'tenant_001',
    '11111111-1111-1111-1111-111111111111',
    'act_001',
    'workflow',
    '{"platform": "smart_agent_platform", "workflow_id": "wf_promo_cleanup"}',
    '{"discount_range": [30, 50], "duration_days": 7}',
    'pending',
    '{"release_space": "15%", "cash_back": "80万"}',
    NULL,
    NOW() - INTERVAL '30 minutes',
    NULL,
    NULL
);

-- 4. 审核记录数据
INSERT INTO audit_log (audit_id, tenant_id, decision_id, auditor, audited_at, action, modifications, comment, generated_tasks)
VALUES
(
    'audit_001',
    'tenant_001',
    '33333333-3333-3333-3333-333333333333',
    'operator_zhang',
    '2026-06-14T10:30:00Z',
    'approved',
    '{}',
    '同意执行',
    ARRAY['task_001']::UUID[]
),
(
    'audit_002',
    'tenant_001',
    '44444444-4444-4444-4444-444444444444',
    'manager_li',
    '2026-06-12T14:20:00Z',
    'rejected',
    '{}',
    '折扣力度过大，建议调整为25%',
    NULL
);

-- 更新序列
SELECT setval('scenario_config_scenario_id_seq', 10, true);
SELECT setval('decision_card_decision_id_seq', 100, true);