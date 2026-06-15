import React from 'react';
import { Layout, Typography, Space, Badge, Dropdown, Avatar } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  connected?: boolean;
}

export function Header({ connected }: HeaderProps) {
  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人设置' },
    { key: 'logout', label: '退出登录' },
  ];

  const notificationItems: MenuProps['items'] = [
    { key: 'no-data', label: '暂无新通知', disabled: true },
  ];

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        height: 64,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
          DecisionOps
        </Text>
        <Badge
          status={connected ? 'success' : 'error'}
          text={
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              {connected ? '已连接' : '未连接'}
            </Text>
          }
        />
      </div>

      <Space size="large">
        <Dropdown menu={{ items: notificationItems }} placement="bottomRight">
          <Badge count={0} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>Admin</Text>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}

export default Header;