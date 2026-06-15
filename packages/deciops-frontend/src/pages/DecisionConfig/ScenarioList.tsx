import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Button, Switch, Tag, Space, Modal, message } from 'antd';
import {
  EditOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { Scenario } from '../../services/types';
import { scenarioApi } from '../../services/api';

const { Text, Title } = Typography;

interface ScenarioListProps {
  onEdit?: (scenario: Scenario) => void;
}

export function ScenarioList({ onEdit }: ScenarioListProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const { data } = await scenarioApi.list();
      setScenarios(data.data || []);
    } catch (error) {
      setScenarios([
        {
          id: '1',
          name: '价格优化场景',
          description: '根据市场数据和竞争对手价格自动调整商品价格',
          triggerType: 'schedule',
          enabled: true,
          cronExpression: '0 */30 * * * *',
        },
        {
          id: '2',
          name: '库存预警场景',
          description: '当库存低于阈值时自动生成补货建议',
          triggerType: 'data_freshness',
          enabled: true,
        },
        {
          id: '3',
          name: '活动推荐场景',
          description: '根据用户行为数据生成个性化营销活动推荐',
          triggerType: 'event',
          enabled: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (scenario: Scenario) => {
    try {
      await scenarioApi.update(scenario.id, { enabled: !scenario.enabled });
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenario.id ? { ...s, enabled: !s.enabled } : s))
      );
    } catch (error) {
      message.error('切换状态失败');
    }
  };

  const handleTrigger = async (scenario: Scenario) => {
    Modal.confirm({
      title: '确认手动触发',
      content: `确定要手动触发场景"${scenario.name}"吗？`,
      onOk: async () => {
        try {
          const { data } = await scenarioApi.trigger(scenario.id);
          message.success(`任务已创建: ${data.taskId}`);
        } catch (error) {
          message.error('触发失败');
        }
      },
    });
  };

  const getTriggerTypeText = (type: Scenario['triggerType']) => {
    switch (type) {
      case 'schedule': return '定时触发';
      case 'event': return '事件触发';
      case 'data_freshness': return '数据新鲜度';
      default: return type;
    }
  };

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>场景模板</Title>}
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {scenarios.map((scenario) => (
          <Col xs={24} sm={12} lg={8} key={scenario.id}>
            <Card
              size="small"
              style={{ height: '100%' }}
              actions={[
                <Button
                  key="edit"
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit?.(scenario)}
                >
                  编辑
                </Button>,
                <Button
                  key="trigger"
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleTrigger(scenario)}
                  disabled={!scenario.enabled}
                >
                  触发
                </Button>,
              ]}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={5} style={{ margin: 0 }}>{scenario.name}</Title>
                  <Switch
                    size="small"
                    checked={scenario.enabled}
                    onChange={() => handleToggle(scenario)}
                  />
                </div>
                <Text type="secondary" ellipsis={{}}>
                  {scenario.description}
                </Text>
                <Space>
                  <Tag>{getTriggerTypeText(scenario.triggerType)}</Tag>
                  {scenario.cronExpression && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {scenario.cronExpression}
                    </Text>
                  )}
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export default ScenarioList;