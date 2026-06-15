import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { DecisionCard } from '../../services/types';
import { formatRelativeTime, formatPercent, getStatusColor, getStatusText } from '../../utils/formatters';

const { Text, Title } = Typography;

interface DecisionCardProps {
  decision: DecisionCard;
  onClick?: () => void;
  selected?: boolean;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'rejected':
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    case 'executing':
      return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    case 'pending_audit':
      return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    default:
      return null;
  }
}

export function DecisionCard({ decision, onClick, selected }: DecisionCardProps) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        width: '100%',
        borderColor: selected ? '#1890ff' : undefined,
        borderWidth: selected ? 2 : 1,
      }}
      styles={{ body: { padding: 16 } }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }} ellipsis={{ rows: 1 }}>
            {decision.title}
          </Title>
          <StatusIcon status={decision.status} />
        </div>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {decision.scenarioName}
        </Text>

        <Space size="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>置信度</Text>
            <br />
            <Text strong style={{ color: decision.confidence >= 0.8 ? '#52c41a' : '#faad14' }}>
              {formatPercent(decision.confidence)}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>生成时间</Text>
            <br />
            <Text>{formatRelativeTime(decision.createdAt)}</Text>
          </div>
        </Space>

        <div>
          <Tag color={getStatusColor(decision.status)}>
            {getStatusText(decision.status)}
          </Tag>
          {decision.tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </Space>
    </Card>
  );
}

export default DecisionCard;