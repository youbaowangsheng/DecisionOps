import { Spin } from 'antd';

interface LoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullscreen?: boolean;
}

export function Loading({ tip = '加载中...', size = 'default', fullscreen = false }: LoadingProps) {
  if (fullscreen) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
        }}
      >
        <Spin size={size} tip={tip} />
      </div>
    );
  }

  return <Spin size={size} tip={tip} />;
}

export default Loading;