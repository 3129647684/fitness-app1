import { SERVER_URL } from '@/constants/env';
import { getAllRecordsForSync, applySnapshot, getCurrentUserId } from './db';

export interface PushResult {
  ok: boolean;
  msg?: string;
}

export interface PullResult {
  ok: boolean;
  msg?: string;
  snapshot?: string | null;
  recordsImported?: number;
}

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${SERVER_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('无法连接服务器，请检查网络或服务地址');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `请求失败 (${res.status})`);
  }
  return data as T;
}

export async function pushToServer(token: string): Promise<PushResult> {
  try {
    const uid = getCurrentUserId();
    if (uid == null) return { ok: false, msg: '未登录' };

    const json = await getAllRecordsForSync();
    await request('/api/sync/push', token, {
      method: 'POST',
      body: JSON.stringify({ data: json }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, msg: e instanceof Error ? e.message : '上传失败' };
  }
}

export async function pullFromServer(token: string): Promise<PullResult> {
  try {
    const uid = getCurrentUserId();
    if (uid == null) return { ok: false, msg: '未登录' };

    const data = await request<{ data: string | null; updatedAt: string | null }>('/api/sync/pull', token);
    if (!data.data) {
      return { ok: true, snapshot: null, recordsImported: 0 };
    }
    const imported = await applySnapshot(data.data);
    return {
      ok: true,
      snapshot: data.data,
      recordsImported: imported.records,
    };
  } catch (e) {
    return { ok: false, msg: e instanceof Error ? e.message : '拉取失败' };
  }
}

export async function triggerSyncIfNeeded(token: string): Promise<void> {
  if (!token) return;
  const pushRes = await pushToServer(token);
  if (!pushRes.ok) {
    console.warn('[sync] push failed (non-fatal):', pushRes.msg);
  }
  const pullRes = await pullFromServer(token);
  if (!pullRes.ok) {
    console.warn('[sync] pull failed (non-fatal):', pullRes.msg);
  }
}


export const syncPull = pullFromServer;
export const syncPush = pushToServer;
