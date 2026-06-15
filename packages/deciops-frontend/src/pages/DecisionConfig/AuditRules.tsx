import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Space, Button, InputNumber, Switch, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AuditRule } from '../../services/types';
import { auditRuleApi } from '../../services/api';

const { Title } = Typography;

export function AuditRules() {
  const [rules, setRules] = useState<AuditRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const { data } = await auditRuleApi.list();
      setRules(data);
    } catch (error) {
      setRules([
        {
          id: '1',
          name: '高置信度自动批准',
          type: 'auto_approve',
          threshold: 0.95,
          enabled: true,
        },
        {
          id: '2',
          name: '强制人工审核场景',
          type: 'force_human',
          scenarioIds: ['3'],
          enabled: true,
        },
        {
          id: '3',
          name: '超时自动升级',
          type: 'timeout_escalation',
          timeoutMinutes: 30,
          enabled: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateThreshold = async (ruleId: string, threshold: number) => {
    try {
      await auditRuleApi.update(ruleId, { threshold });
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, threshold } : r))
      );
      message.success('阈值已更新');
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      await auditRuleApi.update(ruleId, { enabled });
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
      );
    } catch (error) {
      message.error('切换状态失败');
    }
  };

  const getRuleTypeText = (type: AuditRule['type']) => {
    switch (type) {
      case 'auto_approve': return '自动批准';
      case 'force_human': return '强制人工审核';
      case 'timeout_escalation': return '超时升级';
      default: return type;
    }
  };

  const columns: ColumnsType<AuditRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规则类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: AuditRule['type']) => <Tag>{getRuleTypeText(type)}</Tag>,
    },
    {
      title: '配置',
      key: 'config',
      render: (_, record) => {
        if (record.type === 'auto_approve' && record.threshold !== undefined) {
          return (
            <Space>
              <span>置信度 &gt;</span>
              <InputNumber
                size="small"
                min={0}
                max={1}
                step={0.01}
                value={record.threshold}
                style={{ width: 80 }}
                onPressEnter={(e) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  if (!isNaN(val)) handleUpdateThreshold(record.id, val);
                }}
              />
            </Space>
          );
        }
        if (record.type === 'timeout_escalation' && record.timeoutMinutes !== undefined) {
          return (
            <Space>
              <span>超时</span>
              <InputNumber
                size="small"
                min={1}
                value={record.timeoutMinutes}
                suffix="分钟"
                style={{ width: 100 }}
              />
            </Space>
          );
        }
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(checked) => handleToggle(record.id, checked)}
        />
      ),
    },
  ];

  return (
    <Card title={<Title level={5} style={{ margin: 0 }}>审核规则</Title>} loading={loading}>
      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Card>
  );
}

export default AuditRules;