import axios from 'axios';
import type {
  DecisionCard,
  DecisionFilters,
  Task,
  DashboardMetrics,
  Scenario,
  AuditRule,
} from './types';
import * as jose from 'jose';

// 使用后端真实地址
const API_BASE_URL = 'http://localhost:8080/api/v1';

const JWT_SECRET = 'deciops-secret-key-2026';

// 生成有效的 JWT token
async function generateTestToken(): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new jose.SignJWT({ user_id: 'test_user', tenant_id: 'tenant_001' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
  return token;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    // 使用测试 token
    let token = localStorage.getItem('token');
    if (!token) {
      token = await generateTestToken();
      localStorage.setItem('token', token);
    }
    const tenantId = localStorage.getItem('tenant_id') || 'tenant_001';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const decisionApi = {
  list: (filters: DecisionFilters) =>
    api.get<{ data: DecisionCard[]; total: number; page: number; page_size: number }>('/decisions', { params: filters }),

  getById: (id: string) =>
    api.get<{ data: DecisionCard }>(`/decisions/${id}`),

  audit: (id: string, data: { action: 'approve' | 'reject' | 'modify'; comment?: string; modifications?: object }) =>
    api.post<DecisionCard>(`/decisions/${id}/audit`, data),
};

export const taskApi = {
  list: (status?: string) =>
    api.get<{ data: Task[] }>('/tasks', { params: { status } }),

  execute: (id: string) =>
    api.post<Task>(`/tasks/${id}/execute`),

  cancel: (id: string) =>
    api.post<Task>(`/tasks/${id}/cancel`),
};

export const dashboardApi = {
  getMetrics: () =>
    api.get<{ data: DashboardMetrics }>('/dashboard/metrics'),
};

export const scenarioApi = {
  list: () =>
    api.get<{ data: Scenario[] }>('/scenarios'),

  trigger: (id: string) =>
    api.post<{ taskId: string }>(`/scenarios/${id}/trigger`),

  update: (id: string, data: Partial<Scenario>) =>
    api.put<Scenario>(`/scenarios/${id}`, data),
};

export const auditRuleApi = {
  list: () =>
    api.get<AuditRule[]>('/audit-rules'),

  update: (id: string, data: Partial<AuditRule>) =>
    api.put<AuditRule>(`/audit-rules/${id}`, data),
};

export default api;