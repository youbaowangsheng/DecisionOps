import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Space, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Scenario } from '../../services/types';

const { Title } = Typography;

interface ScheduleTableProps {
  scenarios?: Scenario[];
}

export function ScheduleTable({ scenarios = [] }: ScheduleTableProps) {
  const [data, setData] = useState<Scenario[]>([]);

  useEffect(() => {
    if (scenarios.length > 0) {
      setData(scenarios.filter((s) => s.triggerType === 'schedule' || s.cronExpression));
    } else {
      setData([
        {
          id: '1',
          name: '价格优化场景',
          description: '',
          triggerType: 'schedule',
          enabled: true,
          cronExpression: '0 */30 * * * *',
        },
        {
          id: '2',
          name: '库存检查场景',
          description: '',
          triggerType: 'data_freshness',
          enabled: true,
          cronExpression: '0 0 * * * *',
        },
      ]);
    }
  }, [scenarios]);

  const columns: ColumnsType<Scenario> = [
    {
      title: '场景名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '触发类型',
      dataIndex: 'triggerType',
      key: 'triggerType',
      render: (type: Scenario['triggerType']) => {
        let color = 'blue';
        let text: string = type;
        if (type === 'schedule') {
          color = 'green';
          text = '定时触发';
        } else if (type === 'event') {
          color = 'orange';
          text = '事件触发';
        } else if (type === 'data_freshness') {
          color = 'purple';
          text = '数据新鲜度';
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Cron 表达式',
      dataIndex: 'cronExpression',
      key: 'cronExpression',
      render: (expr: string) => expr || '-',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? '启用' : '禁用'} />
      ),
    },
  ];

  return (
    <Card title={<Title level={5} style={{ margin: 0 }}>调度策略</Title>}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  );
}

export default ScheduleTable;