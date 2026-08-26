// 后端 API 客户端：认证 + 数据同步
import { SERVER_URL } from '@/constants/config';
import { getToken } from '@/database/session';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${SERVER_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('无法连接服务器，请检查网络或服务地址', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error || `请求失败 (${res.status})`, res.status);
  }
  return data as T;
}

export interface AuthUser {
  id: number;
  username: string;
  nickname?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SyncResponse {
  data: string | null;
  updatedAt: string | null;
}

export const api = {
  register(username: string, password: string, nickname?: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { username, password, nickname },
    });
  },
  login(username: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', { method: 'POST', body: { username, password } });
  },
  fetchSync(): Promise<SyncResponse> {
    return request<SyncResponse>('/api/sync');
  },
  pushSync(data: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>('/api/sync', { method: 'POST', body: { data } });
  },
};