import { useEffect, useState } from 'react';
import { Row, Col, Typography, Tabs, Button, Space, Card, Statistic, Descriptions, Tag, Switch, Tooltip } from 'antd';
import { PlusOutlined, PlayCircleOutlined, SettingOutlined, AuditOutlined, ScheduleOutlined } from '@ant-design/icons';
import { ScenarioList } from './ScenarioList';
import { ScheduleTable } from './ScheduleTable';
import { AuditRules } from './AuditRules';
import { scenarioApi } from '../../services/api';
import type { Scenario } from '../../services/types';
import Loading from '../../components/common/Loading';

const { Title, Text } = Typography;

export function DecisionConfig() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scenarios');

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const { data } = await scenarioApi.list();
      setScenarios(data.data || []);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScenario = async (id: string) => {
    try {
      await scenarioApi.trigger(id);
    } catch (error) {
      console.error('Failed to trigger scenario:', error);
    }
  };

  const getTriggerTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      schedule: { color: 'blue', text: '定时触发' },
      event: { color: 'orange', text: '事件触发' },
      data_freshness: { color: 'purple', text: '数据新鲜度' },
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 统计
  const stats = {
    total: scenarios.length,
    enabled: scenarios.filter(s => s.enabled).length,
    schedule: scenarios.filter(s => s.triggerType === 'schedule').length,
    event: scenarios.filter(s => s.triggerType === 'event').length,
  };

  const tabItems = [
    {
      key: 'scenarios',
      label: <span><SettingOutlined /> 场景配置</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />}>新建场景</Button>
              <Button icon={<PlayCircleOutlined />}>批量触发</Button>
            </Space>
          </div>
          <ScenarioList />
        </div>
      ),
    },
    {
      key: 'schedule',
      label: <span><ScheduleOutlined /> 调度策略</span>,
      children: <ScheduleTable scenarios={scenarios} />,
    },
    {
      key: 'audit',
      label: <span><AuditOutlined /> 审核规则</span>,
      children: <AuditRules />,
    },
  ];

  if (loading) {
    return <Loading tip="加载场景配置..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>决策配置</Title>
        <Space>
          <Button onClick={loadScenarios}>刷新</Button>
        </Space>
      </div>

      {/* 场景统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="场景总数" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="启用中" value={stats.enabled} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="定时任务" value={stats.schedule} suffix={`/ ${stats.total}`} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="事件触发" value={stats.event} suffix={`/ ${stats.total}`} />
          </Card>
        </Col>
      </Row>

      {/* 场景详情 */}
      {scenarios.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="场景详情" size="small">
              <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                {scenarios.map(s => (
                  <Descriptions.Item key={s.id} label={s.name}>
                    <Space>
                      {getTriggerTypeTag(s.triggerType)}
                      <Switch checked={s.enabled} size="small" disabled />
                      <Tooltip title="触发分析">
                        <Button
                          type="text"
                          size="small"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleTriggerScenario(s.id)}
                          disabled={!s.enabled}
                        />
                      </Tooltip>
                    </Space>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )}

      {/* 标签页 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
}

export default DecisionConfig;