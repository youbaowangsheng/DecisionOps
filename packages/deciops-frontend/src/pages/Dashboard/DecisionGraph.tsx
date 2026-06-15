import { useEffect, useRef } from 'react';
import { Card, Typography, Empty } from 'antd';
import type { DecisionCard } from '../../services/types';

const { Title } = Typography;

interface DecisionGraphProps {
  decisions: DecisionCard[];
  onNodeClick?: (decision: DecisionCard) => void;
}

export function DecisionGraph({ decisions }: DecisionGraphProps) {
  if (decisions.length === 0) {
    return (
      <Card title={<Title level={5} style={{ margin: 0 }}>决策关系图</Title>}>
        <Empty description="暂无决策数据" />
      </Card>
    );
  }

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>决策关系图</Title>}
      extra={
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, background: '#ff4d4f', borderRadius: 2 }} />
            <span style={{ fontSize: 12 }}>冲突</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, background: '#1890ff', borderRadius: 2 }} />
            <span style={{ fontSize: 12 }}>依赖</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, background: '#d9d9d9', borderRadius: 2 }} />
            <span style={{ fontSize: 12 }}>相似</span>
          </div>
        </div>
      }
    >
      <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
        决策关系图 (共 {decisions.length} 个决策)
      </div>
    </Card>
  );
}

export default DecisionGraph;