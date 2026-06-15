import { useEffect, useState } from 'react';
import { Row, Col, Typography, Card, Statistic, Progress, List, Tag, Button, Space, Timeline } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { TaskTabs } from './TaskTabs';
import { BenefitCompare } from './BenefitCompare';
import { useTaskStore } from '../../stores/taskStore';
import type { Task } from '../../services/types';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/formatters';

const { Title, Text } = Typography;

export function Tasks() {
  const { tasks, loading, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 统计
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    executing: tasks.filter(t => t.status === 'executing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待执行' },
      executing: { color: 'processing', text: '执行中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
      cancelled: { color: 'default', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 最近活动
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (loading) {
    return <Loading tip="加载任务数据..." />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>计划与任务</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchTasks()}>刷新</Button>
          <Button type="primary" icon={<PlayCircleOutlined />}>新建任务</Button>
        </Space>
      </div>

      {/* 任务统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="待执行任务"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="执行中"
              value={stats.executing}
              prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="失败"
              value={stats.failed}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 任务列表 */}
        <Col xs={24} lg={16}>
          <Card title="任务列表" style={{ marginBottom: 16 }}>
            <TaskTabs />
          </Card>
        </Col>

        {/* 右侧面板 */}
        <Col xs={24} lg={8}>
          {/* 最近活动 */}
          <Card title="最近活动" size="small" style={{ marginBottom: 16 }}>
            <List
              size="small"
              dataSource={recentTasks}
              renderItem={(task) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text style={{ fontSize: 12 }}>{task.taskType} - {task.target}</Text>}
                    description={
                      <Space>
                        {getStatusTag(task.status)}
                        <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(task.updatedAt)}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* 效益对比 */}
          <Card title="效益追踪" size="small">
            <BenefitCompare tasks={tasks} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Tasks;