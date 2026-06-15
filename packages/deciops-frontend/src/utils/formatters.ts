export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCurrency(value: number, currency = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}天${remainingHours > 0 ? `${remainingHours}小时` : ''}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return formatDate(dateString);
}

export function formatChangeRate(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatPercent(value)}`;
}

export function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#ff4d4f',
  };
  return colors[risk] || '#d9d9d9';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending_audit: '#faad14',
    approved: '#52c41a',
    rejected: '#ff4d4f',
    executing: '#1890ff',
    completed: '#8c8c8c',
    pending: '#faad14',
    cancelled: '#8c8c8c',
    failed: '#ff4d4f',
  };
  return colors[status] || '#d9d9d9';
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending_audit: '待审核',
    approved: '已批准',
    rejected: '已驳回',
    executing: '执行中',
    completed: '已完成',
    pending: '待执行',
    cancelled: '已取消',
    failed: '失败',
  };
  return texts[status] || status;
}