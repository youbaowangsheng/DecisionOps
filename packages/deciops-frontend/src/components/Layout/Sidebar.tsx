import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  AuditOutlined,
  SettingOutlined,
  ScheduleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '决策看板',
  },
  {
    key: '/audit',
    icon: <AuditOutlined />,
    label: '审核工作台',
  },
  {
    key: '/config',
    icon: <SettingOutlined />,
    label: '决策配置',
  },
  {
    key: '/tasks',
    icon: <ScheduleOutlined />,
    label: '计划与任务',
  },
  {
    key: '/settings',
    icon: <AppstoreOutlined />,
    label: '系统设置',
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = menuItems.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key || '/dashboard';

  return (
    <Sider
      width={200}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, marginTop: 8 }}
      />
    </Sider>
  );
}

export default Sidebar;