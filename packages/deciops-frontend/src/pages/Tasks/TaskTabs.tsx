import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Tag, Space, Modal, message, Progress } from 'antd';
import { PlayCircleOutlined, StopOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Task } from '../../services/types';
import { useTaskStore } from '../../stores/taskStore';
import { formatDate, getStatusColor, getStatusText } from '../../utils/formatters';

export function TaskTabs() {
  const { tasks, loading, fetchTasks, executeTask, cancelTask, currentFilter, setCurrentFilter } = useTaskStore();
  const [, setDetailModalVisible] = useState(false);
  const [, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks(currentFilter);
  }, [fetchTasks, currentFilter]);

  const handleTabChange = (key: string) => {
    setCurrentFilter(key);
  };

  const handleExecute = async (task: Task) => {
    Modal.confirm({
      title: '确认执行',
      content: `确定要执行任务"${task.target}"吗？`,
      onOk: async () => {
        try {
          await executeTask(task.id);
          message.success('任务已开始执行');
        } catch (error) {
          message.error('执行失败');
        }
      },
    });
  };

  const handleCancel = async (task: Task) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消任务"${task.target}"吗？`,
      onOk: async () => {
        try {
          await cancelTask(task.id);
          message.success('任务已取消');
        } catch (error) {
          message.error('取消失败');
        }
      },
    });
  };

  const handleViewDetail = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const columns: ColumnsType<Task> = [
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 120,
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number) => progress !== undefined ? <Progress percent={progress} size="small" /> : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => formatDate(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleExecute(record)}>
                执行
              </Button>
              <Button size="small" danger icon={<StopOutlined />} onClick={() => handleCancel(record)}>
                取消
              </Button>
            </>
          )}
          {record.status === 'executing' && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              详情
            </Button>
          )}
          {record.status === 'completed' && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              查看
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'pending', label: `待执行 (${tasks.filter((t) => t.status === 'pending').length})` },
    { key: 'executing', label: `执行中 (${tasks.filter((t) => t.status === 'executing').length})` },
    { key: 'completed', label: `已完成 (${tasks.filter((t) => t.status === 'completed').length})` },
  ];

  return (
    <Tabs
      activeKey={currentFilter}
      onChange={handleTabChange}
      items={tabItems.map((item) => ({
        ...item,
        children: (
          <Table
            columns={columns}
            dataSource={tasks.filter((t) => {
              if (item.key === 'pending') return t.status === 'pending';
              if (item.key === 'executing') return t.status === 'executing';
              if (item.key === 'completed') return t.status === 'completed' || t.status === 'cancelled' || t.status === 'failed';
              return false;
            })}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            size="small"
          />
        ),
      }))}
    />
  );
}

export default TaskTabs;