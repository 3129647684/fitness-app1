// 云同步模块（复用 client.ts 的统一请求层）
import { syncApi } from '@/api/client';
import { getAllRecordsForSync, applySnapshot } from '@/database/db';

export interface SyncResult {
  ok: boolean;
  msg?: string;
  recordsImported?: number;
  conflict?: boolean;
}

// 上传本地快照到云端
export async function syncPush(token: string): Promise<SyncResult> {
  try {
    const payload = await getAllRecordsForSync();
    await syncApi.push(token, payload);
    return { ok: true, msg: '同步成功' };
  } catch (e: any) {
    return { ok: false, msg: e?.message || '同步失败' };
  }
}

// 从云端拉取快照并覆盖本地
export async function syncPull(token: string): Promise<SyncResult> {
  try {
    const res = await syncApi.pull(token);
    if (!res.payload) {
      return { ok: true, msg: '云端暂无备份', recordsImported: 0 };
    }
    const result = await applySnapshot(res.payload);
    return { ok: true, msg: '恢复成功', recordsImported: result.records };
  } catch (e: any) {
    return { ok: false, msg: e?.message || '恢复失败' };
  }
}

// 智能同步：先拉取检查冲突，再推送
// 如果云端有更新且本地也有更新，返回 conflict 让用户选择
export async function syncSmart(token: string, lastSyncAt?: string): Promise<SyncResult> {
  try {
    const pullRes = await syncApi.pull(token);
    // 简单冲突检测：如果云端有数据且本地也有数据，提示用户
    if (pullRes.payload && lastSyncAt && pullRes.updatedAt && pullRes.updatedAt > lastSyncAt) {
      return { ok: false, conflict: true, msg: '云端有更新的数据，请选择覆盖方向' };
    }
    // 无冲突，直接推送
    return syncPush(token);
  } catch (e: any) {
    return { ok: false, msg: e?.message || '同步失败' };
  }
}

export default { syncPush, syncPull, syncSmart };
