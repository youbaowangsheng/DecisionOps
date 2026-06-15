# DecisionOps Deployment Configuration

部署配置包，包含本地开发环境和生产环境的完整配置。

## 目录结构

```
deciops-deploy/
├── docker-compose/          # Docker Compose 本地开发环境
├── kubernetes/             # Helm Chart 配置
├── helmfile/                # Helmfile 多环境管理
└── README.md
```

## 快速开始

### 本地开发环境

```bash
cd docker-compose
docker-compose up -d
```

### Kubernetes 部署

```bash
# 使用 helmfile
cd helmfile
helmfile -e local apply

# 或直接使用 helm
cd kubernetes
helm install deciops .
```

## 环境说明

| 环境 | 说明 | 默认端口 |
|------|------|----------|
| local | 本地开发 | 8080-8081, 3000, 5432, 6379 |
| prod | 生产环境 | 通过 Ingress 配置 |

## 组件

- **decision-engine**: 决策引擎服务
- **backend-bff**: 后端 BFF 服务
- **web**: 前端应用
- **postgres**: PostgreSQL 15 数据库 (RLS 多租户)
- **redis**: Redis 7 缓存
