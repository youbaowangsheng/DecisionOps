import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Typography, Table, Tag, Button, Space, Statistic, Progress, List, message } from 'antd';
import { AuditOutlined, ClockCircleOutlined, CheckCircleOutlined, PlusCircleOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { KPICards } from './KPICards';
import { MetricsAlert } from './MetricsAlert';
import { DecisionGraph } from './DecisionGraph';
import { dashboardApi, decisionApi } from '../../services/api';
import { useDecisionStore } from '../../stores/decisionStore';
import { useWSStore } from '../../stores/wsStore';
import type { DashboardMetrics, MetricsAlert as MetricsAlertType, DecisionCard } from '../../services/types';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/formatters';

const { Title, Text } = Typography;

const defaultMetrics: DashboardMetrics = {
  pendingAuditCount: 0,
  avgAuditDuration: 0,
  totalBenefit: 0,
  todayNewDecisions: 0,
  metricsAlerts: [],
};

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [recentDecisions, setRecentDecisions] = useState<DecisionCard[]>([]);
  const { decisions, fetchDecisions, filters } = useDecisionStore();
  const { connected, onMessage } = useWSStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // WebSocket real-time updates
  useEffect(() => {
    const handleNewDecision = (msg: { event: string; data: unknown }) => {
      message.info('New decision received via real-time update');
      loadDashboardData();
    };

    const handleDecisionAudited = (msg: { event: string; data: unknown }) => {
      message.info('Decision status changed via real-time update');
      loadDashboardData();
    };

    // Subscribe to WebSocket events
    onMessage(handleNewDecision);
    onMessage(handleDecisionAudited);
  }, [onMessage]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load metrics
      const { data: metricsData } = await dashboardApi.getMetrics();
      // Transform API response to frontend types
      const apiMetrics = metricsData.data || metricsData;
      const transformedMetrics: DashboardMetrics = {
        pendingAuditCount: (apiMetrics as any).pending_audit_count || (apiMetrics as any).pendingAuditCount || 0,
        avgAuditDuration: (apiMetrics as any).avg_audit_duration || (apiMetrics as any).avgAuditDuration || 0,
        totalBenefit: (apiMetrics as any).total_benefit || (apiMetrics as any).totalBenefit || 0,
        todayNewDecisions: (apiMetrics as any).today_decisions || (apiMetrics as any).todayNewDecisions || 0,
        metricsAlerts: (apiMetrics as any).metrics_alerts || (apiMetrics as any).metricsAlerts || [],
      };
      setMetrics(transformedMetrics);

      // Load recent decisions
      await fetchDecisions({ status: '', page: 1, pageSize: 5 });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClick = (alert: MetricsAlertType) => {
    console.log('Alert clicked:', alert);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending_audit: { color: 'gold', text: '待审核' },
      approved: { color: 'green', text: '已批准' },
      rejected: { color: 'red', text: '已驳回' },
      executing: { color: 'blue', text: '执行中' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const recentColumns: ColumnsType<DecisionCard> = [
    {
      title: '决策标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.scenarioName}</Text>
        </div>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 80,
      render: (val: number) => (
        <Progress percent={val * 100} size="small" strokeColor={val >= 0.8 ? '#52c41a' : val >= 0.6 ? '#faad14' : '#ff4d4f'} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => <Text type="secondary">{formatDate(date)}</Text>,
    },
  ];

  if (loading) {
    return <Loading tip="加载仪表盘数据..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>决策运营看板</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadDashboardData}>刷新数据</Button>
          <Button type="primary" icon={<PlusCircleOutlined />}>新建场景</Button>
        </Space>
      </div>

      {/* KPI 卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <KPICards data={metrics} />
        </Col>
      </Row>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="决策状态分布" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="待审核" value={metrics.pendingAuditCount} valueStyle={{ color: '#faad14' }} />
              </Col>
              <Col span={12}>
                <Statistic title="今日新增" value={metrics.todayNewDecisions} valueStyle={{ color: '#722ed1' }} />
              </Col>
              <Col span={12}>
                <Statistic title="已批准" value={metrics.pendingAuditCount || 1} suffix={`/ ${metrics.todayNewDecisions || 0}`} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={12}>
                <Statistic title="已驳回" value={0} valueStyle={{ color: '#ff4d4f' }} />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="审核效率" size="small">
            <Statistic
              title="平均审核时长"
              value={metrics.avgAuditDuration}
              suffix="分钟"
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">较上周</Text>
              <br />
              <Text style={{ color: '#52c41a' }}>-15% ↓</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="累计效益" size="small">
            <Statistic
              title="已采纳建议创造效益"
              value={metrics.totalBenefit}
              precision={0}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">本月效益</Text>
              <br />
              <Text style={{ color: '#52c41a', fontSize: 18 }}>+¥256,000</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 指标告警和决策图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <MetricsAlert alerts={metrics.metricsAlerts} onAlertClick={handleAlertClick} />
        </Col>
        <Col xs={24} lg={12}>
          <DecisionGraph decisions={decisions} onNodeClick={(d) => console.log('Node clicked:', d)} />
        </Col>
      </Row>

      {/* 最近决策 */}
      <Card
        title="最近决策"
        extra={<Button type="link" onClick={() => window.location.href = '/audit'}>查看全部</Button>}
      >
        <Table
          columns={recentColumns}
          dataSource={decisions.slice(0, 5)}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}

export default Dashboard;