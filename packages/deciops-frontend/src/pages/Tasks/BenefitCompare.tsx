import { useEffect, useState } from 'react';
import { Card, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Task } from '../../services/types';
import { formatNumber, formatPercent } from '../../utils/formatters';

const { Title } = Typography;

interface BenefitCompareProps {
  tasks?: Task[];
}

export function BenefitCompare({ tasks = [] }: BenefitCompareProps) {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (tasks.length > 0) {
      setCompletedTasks(tasks.filter((t) => t.status === 'completed' && t.result));
    } else {
      setCompletedTasks([
        {
          id: '1',
          taskType: '价格调整',
          target: '商品A',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          result: { expectedBenefit: 10000, actualBenefit: 9500, differenceRate: -0.05 },
        },
        {
          id: '2',
          taskType: '库存补货',
          target: '商品B',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          result: { expectedBenefit: 5000, actualBenefit: 5200, differenceRate: 0.04 },
        },
        {
          id: '3',
          taskType: '营销活动',
          target: '商品C',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          result: { expectedBenefit: 8000, actualBenefit: 7800, differenceRate: -0.025 },
        },
      ]);
    }
  }, [tasks]);

  const columns: ColumnsType<Task> = [
    {
      title: '决策ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
    },
    {
      title: '预期效益',
      key: 'expectedBenefit',
      render: (_, record) => formatNumber(record.result?.expectedBenefit || 0),
    },
    {
      title: '实际效益',
      key: 'actualBenefit',
      render: (_, record) => formatNumber(record.result?.actualBenefit || 0),
    },
    {
      title: '差异率',
      key: 'differenceRate',
      render: (_, record) => {
        const rate = record.result?.differenceRate || 0;
        return (
          <span style={{ color: rate >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatPercent(rate)}
          </span>
        );
      },
    },
  ];

  return (
    <Card title={<Title level={5} style={{ margin: 0 }}>效益对比</Title>}>
      <Table
        columns={columns}
        dataSource={completedTasks}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  );
}

export default BenefitCompare;