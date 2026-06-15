import React from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import {
  AuditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDuration } from '../../utils/formatters';

const { Text } = Typography;

interface KPIData {
  pendingAuditCount: number;
  avgAuditDuration: number;
  totalBenefit: number;
  todayNewDecisions: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} style={{ height: 120 }}>
          <Statistic
            title={<Text type="secondary">待审核决策数</Text>}
            value={data.pendingAuditCount}
            prefix={<AuditOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} style={{ height: 120 }}>
          <Statistic
            title={<Text type="secondary">平均审核时长</Text>}
            value={data.avgAuditDuration}
            prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
            suffix="分钟"
            valueStyle={{ color: '#1890ff' }}
            formatter={(val) => formatDuration(val as number)}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} style={{ height: 120 }}>
          <Statistic
            title={<Text type="secondary">已采纳建议累计效益</Text>}
            value={data.totalBenefit}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
            formatter={(val) => formatCurrency(val as number)}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} style={{ height: 120 }}>
          <Statistic
            title={<Text type="secondary">今日新增决策</Text>}
            value={data.todayNewDecisions}
            prefix={<PlusCircleOutlined style={{ color: '#722ed1' }} />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );
}

export default KPICards;