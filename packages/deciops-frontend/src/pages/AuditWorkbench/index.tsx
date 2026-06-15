import { useEffect, useState } from 'react';
import { Row, Col, Typography, Card, Select, DatePicker, Space, Button, Statistic, Table, Tag, Badge, Empty, message } from 'antd';
import { AuditOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DecisionTable } from './DecisionTable';
import { DecisionDetail } from './DecisionDetail';
import { useDecisionStore } from '../../stores/decisionStore';
import { useWSStore } from '../../stores/wsStore';
import type { DecisionCard } from '../../services/types';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/formatters';
import { mockDecisions } from '../../services/mockData';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export function AuditWorkbench() {
  const [selectedDecision, setSelectedDecision] = useState<DecisionCard | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending_audit');
  const [scenarioFilter, setScenarioFilter] = useState<string>('');
  const { decisions, loading, fetchDecisions, setCurrentDecision, filters } = useDecisionStore();
  const { onMessage } = useWSStore();

  useEffect(() => {
    loadDecisions();
  }, [statusFilter, scenarioFilter]);

  // WebSocket real-time updates
  useEffect(() => {
    const handleNewDecision = (msg: { event: string; data: unknown }) => {
      message.info('New decision received, refreshing list...');
      loadDecisions();
    };

    const handleDecisionAudited = (msg: { event: string; data: unknown }) => {
      message.info('Decision status changed, refreshing list...');
      loadDecisions();
    };

    // Subscribe to WebSocket events
    onMessage(handleNewDecision);
    onMessage(handleDecisionAudited);
  }, [onMessage]);

  const loadDecisions = async () => {
    await fetchDecisions({ status: statusFilter, page: 1, pageSize: 100 });
  };

  const handleRowClick = (decision: DecisionCard) => {
    setSelectedDecision(decision);
    setCurrentDecision(decision);
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedDecision(null);
    setCurrentDecision(null);
  };

  const handleApprove = async (id: string) => {
    const { approveDecision } = useDecisionStore.getState();
    await approveDecision(id);
    loadDecisions();
  };

  const handleReject = async (id: string) => {
    const { rejectDecision } = useDecisionStore.getState();
    await rejectDecision(id, '审核驳回');
    loadDecisions();
  };

  // 统计
  const stats = {
    total: decisions.length,
    pending: decisions.filter(d => d.status === 'pending_audit').length,
    approved: decisions.filter(d => d.status === 'approved').length,
    rejected: decisions.filter(d => d.status === 'rejected').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>审核工作台</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadDecisions}>刷新</Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<Badge status="warning" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已批准"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已驳回"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总计数"
              value={stats.total}
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text type="secondary">状态筛选：</Text>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
            <Option value="">全部</Option>
            <Option value="pending_audit">待审核</Option>
            <Option value="approved">已批准</Option>
            <Option value="rejected">已驳回</Option>
          </Select>
          <Text type="secondary">场景筛选：</Text>
          <Select value={scenarioFilter} onChange={setScenarioFilter} style={{ width: 160 }} allowClear placeholder="选择场景">
            <Option value="inventory">库存周转率异常</Option>
            <Option value="cost">成本优化建议</Option>
            <Option value="churn">用户流失预警</Option>
            <Option value="promotion">促销效果预测</Option>
            <Option value="replenishment">补货建议</Option>
          </Select>
          <Button icon={<FilterOutlined />}>更多筛选</Button>
        </Space>
      </Card>

      {loading ? (
        <Loading tip="加载决策数据..." />
      ) : (
        <Row gutter={16}>
          <Col xs={24} lg={selectedDecision ? 12 : 24}>
            <Card title={`${statusFilter === 'pending_audit' ? '待审核' : '决策'}列表 (${decisions.length})`} size="small">
              {decisions.length > 0 ? (
                <DecisionTable
                  onRowClick={handleRowClick}
                  selectedId={selectedDecision?.id}
                />
              ) : (
                <Empty description="暂无待审核决策" />
              )}
            </Card>
          </Col>
          {selectedDecision && (
            <Col xs={24} lg={12}>
              <Card title="决策详情" size="small">
                <DecisionDetail
                  decision={selectedDecision}
                  visible={drawerVisible}
                  onClose={handleCloseDrawer}
                />
                <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <Space>
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApprove(selectedDecision.id)}>
                      批准
                    </Button>
                    <Button danger icon={<CloseCircleOutlined />} onClick={() => handleReject(selectedDecision.id)}>
                      驳回
                    </Button>
                    <Button>修改后批准</Button>
                  </Space>
                </div>
              </Card>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
}

export default AuditWorkbench;