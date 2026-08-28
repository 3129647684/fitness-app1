// 统一 API 客户端（合并原 client.ts + sync.ts 的请求逻辑）
import { SERVER_URL } from '@/constants/config';

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface AuthUser {
  id: number;
  username: string;
  nickname: string | null;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

// 统一请求函数
async function request<T = any>(
  path: string,
  options: { method?: string; body?: any; token?: string; headers?: Record<string, string> } = {}
): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options;
  const finalHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...headers };
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${SERVER_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const msg = (data && typeof data === 'object' && data.error) || data || `请求失败 (${res.status})`;
    throw new ApiError(typeof msg === 'string' ? msg : JSON.stringify(msg), res.status, data);
  }
  return data as T;
}

// ── 认证 API ──
export const authApi = {
  async login(username: string, password: string): Promise<LoginResult> {
    return request<LoginResult>('/api/auth/login', { method: 'POST', body: { username, password } });
  },

  async register(username: string, password: string, nickname?: string): Promise<LoginResult> {
    return request<LoginResult>('/api/auth/register', { method: 'POST', body: { username, password, nickname } });
  },

  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return request('/api/auth/change-password', { method: 'POST', token, body: { oldPassword, newPassword } });
  },

  async deleteAccount(token: string, password: string): Promise<{ message: string }> {
    return request('/api/auth/delete-account', { method: 'POST', token, body: { password } });
  },
};

// ── 同步 API（底层，业务逻辑在 sync.ts） ──
export const syncApi = {
  async push(token: string, payload: string): Promise<{ message: string; updatedAt: string }> {
    return request('/api/sync/push', { method: 'POST', token, body: { payload } });
  },

  async pull(token: string): Promise<{ payload: string | null; updatedAt: string | null }> {
    return request('/api/sync/pull', { method: 'GET', token });
  },
};

export default { authApi, syncApi, ApiError };
