import React from 'react';
import { Card, Table, Tag, Typography, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MetricsAlert } from '../../services/types';
import { formatChangeRate, formatNumber } from '../../utils/formatters';

const { Text, Title } = Typography;

interface MetricsAlertProps {
  alerts: MetricsAlert[];
  onAlertClick?: (alert: MetricsAlert) => void;
}

export function MetricsAlert({ alerts, onAlertClick }: MetricsAlertProps) {
  const columns: ColumnsType<MetricsAlert> = [
    {
      title: '指标名称',
      dataIndex: 'metricName',
      key: 'metricName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (val: number) => formatNumber(val, 2),
    },
    {
      title: '基准值',
      dataIndex: 'baselineValue',
      key: 'baselineValue',
      render: (val: number) => formatNumber(val, 2),
    },
    {
      title: '异动幅度',
      dataIndex: 'changeRate',
      key: 'changeRate',
      render: (rate: number) => {
        const isPositive = rate >= 0;
        return (
          <Tag color={isPositive ? 'red' : 'green'} icon={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
            {formatChangeRate(rate)}
          </Tag>
        );
      },
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts: string) => new Date(ts).toLocaleString('zh-CN'),
    },
  ];

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>指标异动列表</Title>}
      styles={{ body: { padding: 0 } }}
    >
      <Table
        columns={columns}
        dataSource={alerts}
        rowKey="id"
        pagination={false}
        size="small"
        onRow={(record) => ({
          onClick: () => onAlertClick?.(record),
          style: { cursor: onAlertClick ? 'pointer' : 'default' },
        })}
      />
      {alerts.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Text type="secondary">暂无指标异动</Text>
        </div>
      )}
    </Card>
  );
}

export default MetricsAlert;