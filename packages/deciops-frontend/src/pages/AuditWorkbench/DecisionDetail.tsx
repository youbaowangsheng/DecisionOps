import React, { useState } from 'react';
import {
  Drawer,
  Typography,
  Space,
  Button,
  Tag,
  List,
  Card,
  Input,
  Modal,
  Divider,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { DecisionCard, Evidence, SuggestedAction } from '../../services/types';
import { formatPercent, getRiskColor, formatNumber } from '../../utils/formatters';
import { useDecision } from '../../hooks/useDecision';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface DecisionDetailProps {
  decision: DecisionCard | null;
  visible: boolean;
  onClose: () => void;
}

export function DecisionDetail({ decision, visible, onClose }: DecisionDetailProps) {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [modifyModalVisible, setModifyModalVisible] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [modifications, setModifications] = useState('');
  const [modifyComment, setModifyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { approve, reject, modify } = useDecision();

  const handleApprove = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      await approve(decision.id);
      onClose();
    } catch (error) {
      console.error('Approve failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!decision || !rejectComment.trim()) return;
    setSubmitting(true);
    try {
      await reject(decision.id, rejectComment);
      setRejectModalVisible(false);
      setRejectComment('');
      onClose();
    } catch (error) {
      console.error('Reject failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModify = async () => {
    if (!decision || !modifyComment.trim()) return;
    setSubmitting(true);
    try {
      await modify(decision.id, JSON.parse(modifications || '{}'), modifyComment);
      setModifyModalVisible(false);
      setModifications('');
      setModifyComment('');
      onClose();
    } catch (error) {
      console.error('Modify failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!decision) {
    return null;
  }

  return (
    <>
      <Drawer
        title={
          <Space>
            <Text strong>决策详情</Text>
            <Tag color={decision.confidence >= 0.8 ? 'green' : 'orange'}>
              置信度 {formatPercent(decision.confidence)}
            </Tag>
          </Space>
        }
        placement="right"
        width={600}
        onClose={onClose}
        open={visible}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card size="small">
            <Title level={5}>{decision.title}</Title>
            <Text type="secondary">{decision.scenarioName}</Text>
            <Divider style={{ margin: '12px 0' }} />
            <Text>{decision.summary}</Text>
          </Card>

          <Card
            size="small"
            title={<Title level={5} style={{ margin: 0 }}>证据链</Title>}
          >
            <List
              size="small"
              dataSource={decision.evidence || []}
              renderItem={(item: Evidence) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <Space>
                      <Text strong>{item.metricName}</Text>
                      <Tag>当前值: {formatNumber(item.value)}</Tag>
                      <Tag>基准值: {formatNumber(item.baseline)}</Tag>
                    </Space>
                    {item.description && (
                      <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                        {item.description}
                      </Text>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card
            size="small"
            title={<Title level={5} style={{ margin: 0 }}>建议行动</Title>}
          >
            <List
              size="small"
              dataSource={decision.suggestedActions || []}
              renderItem={(item: SuggestedAction) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <Space>
                      <Tag color={
                        item.actionType === 'increase' ? 'blue' :
                        item.actionType === 'decrease' ? 'orange' :
                        item.actionType === 'maintain' ? 'green' : 'red'
                      }>
                        {item.actionType === 'increase' ? '增加' :
                         item.actionType === 'decrease' ? '减少' :
                         item.actionType === 'maintain' ? '维持' : '告警'}
                      </Tag>
                      <Text strong>{item.target}</Text>
                      <Text type="secondary">
                        预期效益: {formatNumber(item.expectedBenefit)}
                      </Text>
                      <Tag color={getRiskColor(item.risk)}>
                        风险: {item.risk === 'low' ? '低' : item.risk === 'medium' ? '中' : '高'}
                      </Tag>
                    </Space>
                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      {item.description}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setRejectModalVisible(true)}
            >
              驳回
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => setModifyModalVisible(true)}
            >
              修改
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApprove}
              loading={submitting}
            >
              批准
            </Button>
          </Space>
        </Space>
      </Drawer>

      <Modal
        title="驳回决策"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalVisible(false)}>取消</Button>,
          <Button key="submit" danger type="primary" onClick={handleReject} loading={submitting}>
            确认驳回
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>请填写驳回原因:</Text>
          <TextArea
            rows={4}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="输入驳回原因..."
          />
        </Space>
      </Modal>

      <Modal
        title="修改决策"
        open={modifyModalVisible}
        onCancel={() => setModifyModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModifyModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleModify} loading={submitting}>
            确认修改
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>请输入修改内容 (JSON):</Text>
          <TextArea
            rows={4}
            value={modifications}
            onChange={(e) => setModifications(e.target.value)}
            placeholder='{"field": "new_value"}'
          />
          <Text>修改说明:</Text>
          <TextArea
            rows={2}
            value={modifyComment}
            onChange={(e) => setModifyComment(e.target.value)}
            placeholder="输入修改说明..."
          />
        </Space>
      </Modal>
    </>
  );
}

export default DecisionDetail;