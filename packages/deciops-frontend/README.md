# DecisionOps Frontend

决策运营平台前端应用

## 技术栈

- React 18 + TypeScript
- Ant Design 5
- Zustand (状态管理)
- React Router 6
- Axios (HTTP 客户端)
- WebSocket (实时通信)
- @ant-design/charts (图表)
- Vite (构建工具)

## 开始使用

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

### 构建生产版本

```bash
npm run build
```

### 环境变量

复制 `.env.example` 为 `.env` 并配置：

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws
```

## 项目结构

```
src/
├── main.tsx              # 入口文件
├── App.tsx               # 根组件
├── pages/                # 页面组件
│   ├── Dashboard/        # 决策看板
│   ├── AuditWorkbench/  # 审核工作台
│   ├── DecisionConfig/  # 决策配置
│   ├── Tasks/           # 计划与任务
│   └── Settings/        # 系统设置
├── components/           # 组件
│   ├── Layout/          # 布局组件
│   ├── DecisionCard/    # 决策卡片
│   └── common/          # 通用组件
├── stores/               # 状态管理
├── services/             # API 和 WebSocket 服务
├── hooks/                # 自定义 Hooks
├── utils/                # 工具函数
└── styles/               # 全局样式
```

## 功能模块

### 决策看板

- KPI 卡片展示关键指标
- 指标异动列表
- 决策关系力导向图

### 审核工作台

- 待审核决策列表
- 决策详情抽屉
- 审核操作（批准、驳回、修改）

### 决策配置

- 场景模板管理
- 调度策略配置
- 审核规则设置

### 计划与任务

- 任务状态标签页
- 效益对比分析

### 系统设置

- 基础设置
- 连接设置
- 显示设置

## Docker 部署

```bash
docker build -t deciops-frontend .
docker run -p 3000:80 deciops-frontend
```

## License

MIT