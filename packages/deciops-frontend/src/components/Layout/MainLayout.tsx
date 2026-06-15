import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useWSStore } from '../../stores/wsStore';

const { Content } = Layout;

export function MainLayout() {
  const connected = useWSStore((state) => state.connected);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header connected={connected} />
      <Layout>
        <Sidebar />
        <Content
          style={{
            marginLeft: 200,
            padding: 24,
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;