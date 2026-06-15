import React from 'react';
import { Card, Typography, Form, Input, Switch, Button, Divider, Space, message, Row, Col } from 'antd';
import { useTaskStore } from '../../stores/taskStore';

const { Title, Text } = Typography;

export function Settings() {
  const [form] = Form.useForm();
  const taskStore = useTaskStore();

  const handleSave = () => {
    message.success('设置已保存');
  };

  const handleReconnect = () => {
    message.success('已重新连接');
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>系统设置</Title>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="基础设置">
            <Form form={form} layout="vertical">
              <Form.Item label="系统名称" name="systemName" initialValue="DecisionOps">
                <Input />
              </Form.Item>
              <Form.Item label="默认语言" name="language" initialValue="zh-CN">
                <Input disabled />
              </Form.Item>
              <Form.Item label="时区" name="timezone" initialValue="Asia/Shanghai">
                <Input disabled />
              </Form.Item>
              <Form.Item label="日期格式" name="dateFormat" initialValue="YYYY-MM-DD HH:mm:ss">
                <Input disabled />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleSave}>保存设置</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="连接设置">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">API 地址</Text>
                <br />
                <Text strong>{(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary">WebSocket 地址</Text>
                <br />
                <Text strong>{(import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8080/ws'}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Button onClick={handleReconnect}>重新连接</Button>
            </Space>
          </Card>

          <Card title="显示设置" style={{ marginTop: 16 }}>
            <Form layout="vertical">
              <Form.Item label="深色模式" name="darkMode" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="紧凑模式" name="compactMode" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="每页条数" name="pageSize" initialValue={20}>
                <Input type="number" min={10} max={100} />
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Settings;