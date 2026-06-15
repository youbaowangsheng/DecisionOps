import type { DecisionCard, Task, Scenario, DashboardMetrics, AuditRule, MetricsAlert } from './types';

// Mock 数据 - 当前端无法连接后端时使用

export const mockMetricsAlerts: MetricsAlert[] = [
  { id: '1', metricName: '库存周转率', currentValue: 1.8, baselineValue: 2.6, changeRate: -32, timestamp: new Date().toISOString() },
  { id: '2', metricName: '用户活跃度', currentValue: 45, baselineValue: 72, changeRate: -37, timestamp: new Date().toISOString() },
  { id: '3', metricName: '成本损耗率', currentValue: 8.5, baselineValue: 7.4, changeRate: 15, timestamp: new Date().toISOString() },
];

export const mockDecisions: DecisionCard[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: '华东仓库A库存周转率连续4周低于阈值',
    scenarioName: '华东仓库库存周转率异常检测',
    status: 'pending_audit',
    confidence: 0.82,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary: '对比历史同期下降32%，低于行业目标2.5次/月，判定为滞销品积压',
    evidence: [{ id: '1', metricName: '周转率', value: 1.8, baseline: 2.6 }],
    suggestedActions: [],
    metrics: { 周转率: 1.8, 基准: 2.6 },
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: '检测到3项成本异常项可优化',
    scenarioName: '成本优化建议',
    status: 'pending_audit',
    confidence: 0.75,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    summary: '原材料损耗高于行业均值15%，包装成本可优化空间约12万/月',
    evidence: [{ id: '2', metricName: '损耗率', value: 8.5, baseline: 7.4 }],
    suggestedActions: [],
    metrics: { 损耗率: 8.5, 基准: 7.4 },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: '识别出1,247名高流失风险用户',
    scenarioName: '用户流失预警',
    status: 'approved',
    confidence: 0.88,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    summary: '基于最近30天无活跃行为且历史活跃度下降60%筛选',
    evidence: [{ id: '3', metricName: '流失风险用户数', value: 1247, baseline: 800 }],
    suggestedActions: [],
    metrics: { 流失风险用户数: 1247 },
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: '建议下周一促销活动定价策略',
    scenarioName: '促销效果预测',
    status: 'rejected',
    confidence: 0.65,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    summary: '预测活动可带来15%销售增长，建议折扣力度35%',
    evidence: [{ id: '4', metricName: '历史活动ROI', value: 2.8, baseline: 2.5 }],
    suggestedActions: [],
    metrics: { ROI: 2.8 },
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: '建议补充SKU-12345商品库存',
    scenarioName: '补货建议',
    status: 'pending_audit',
    confidence: 0.79,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    summary: '销售速度加快，当前库存可支撑天数低于安全库存阈值',
    evidence: [{ id: '5', metricName: '当前库存', value: 500, baseline: 1200 }],
    suggestedActions: [],
    metrics: { 当前库存: 500, 基准: 1200 },
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task_001',
    taskType: '用户挽留',
    target: '1,247名高流失风险用户',
    status: 'completed',
    progress: 100,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task_002',
    taskType: '成本优化',
    target: '原材料损耗优化流程',
    status: 'executing',
    progress: 65,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task_003',
    taskType: '库存补货',
    target: 'SKU-12345 采购订单',
    status: 'pending',
    progress: 0,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task_004',
    taskType: '促销活动',
    target: '华东仓库清理促销',
    status: 'pending',
    progress: 0,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export const mockScenarios: Scenario[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: '华东仓库库存周转率异常检测',
    description: '监控华东区域仓库的库存周转率，连续4周低于阈值时触发告警',
    triggerType: 'schedule',
    enabled: true,
    cronExpression: '0 0 9 * * MON-FRI',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: '成本优化建议',
    description: '分析历史成本数据，识别可优化项并生成降本建议',
    triggerType: 'data_freshness',
    enabled: true,
    cronExpression: undefined,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: '用户流失预警',
    description: '基于用户行为数据，预测可能流失的用户并触发挽留策略',
    triggerType: 'event',
    enabled: true,
    cronExpression: undefined,
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    name: '促销效果预测',
    description: '预测促销活动对销售额的影响，辅助定价决策',
    triggerType: 'schedule',
    enabled: true,
    cronExpression: '0 0 12 * * *',
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    name: '补货建议',
    description: '根据销售预测和库存情况，生成智能补货建议',
    triggerType: 'schedule',
    enabled: true,
    cronExpression: '0 0 8 * * *',
  },
];

export const mockMetrics: DashboardMetrics = {
  pendingAuditCount: 3,
  avgAuditDuration: 45,
  totalBenefit: 2560000,
  todayNewDecisions: 5,
  metricsAlerts: mockMetricsAlerts,
};

export const mockAuditRules: AuditRule[] = [
  {
    id: 'rule_001',
    name: '高置信度自动批准',
    type: 'auto_approve',
    threshold: 0.9,
    enabled: true,
  },
  {
    id: 'rule_002',
    name: '强制人工审核',
    type: 'force_human',
    threshold: 100000,
    enabled: true,
  },
  {
    id: 'rule_003',
    name: '超时自动升级',
    type: 'timeout_escalation',
    timeoutMinutes: 60,
    enabled: true,
  },
];