import React from 'react';
import { Table, Input, Select, DatePicker, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DecisionCard, DecisionFilters } from '../../services/types';
import { formatDate, formatPercent, getStatusColor, getStatusText } from '../../utils/formatters';
import { useDecisionStore } from '../../stores/decisionStore';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface DecisionTableProps {
  onRowClick: (decision: DecisionCard) => void;
  selectedId?: string;
}

export function DecisionTable({ onRowClick, selectedId }: DecisionTableProps) {
  const { decisions, filters, loading, setFilters, fetchDecisions } = useDecisionStore();

  const columns: ColumnsType<DecisionCard> = [
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => formatDate(val),
    },
    {
      title: '场景名称',
      dataIndex: 'scenarioName',
      key: 'scenarioName',
      width: 150,
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (val: number) => (
        <Text style={{ color: val >= 0.8 ? '#52c41a' : '#faad14' }}>
          {formatPercent(val)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Text style={{ color: getStatusColor(status) }}>
          {getStatusText(status)}
        </Text>
      ),
    },
  ];

  const handleFilterChange = (newFilters: Partial<DecisionFilters>) => {
    setFilters(newFilters);
    fetchDecisions({ ...filters, ...newFilters });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          value={filters.status}
          onChange={(val) => handleFilterChange({ status: val })}
          options={[
            { label: '待审核', value: 'pending_audit' },
            { label: '已批准', value: 'approved' },
            { label: '已驳回', value: 'rejected' },
          ]}
        />
        <Input.Search
          placeholder="搜索场景名称"
          style={{ width: 200 }}
          onSearch={(val) => handleFilterChange({ scenarioName: val })}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={decisions}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        rowClassName={(record) => (record.id === selectedId ? 'selected-row' : '')}
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          style: { cursor: 'pointer' },
        })}
      />
    </Space>
  );
}

export default DecisionTable;