// 运行时服务器地址配置（允许用户在登录页修改，无需重新打包）
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bodydata.server_url';
export const DEFAULT_SERVER_URL = 'http://10.72.99.123:4000';

let cachedServerUrl: string | null = null;

/** 异步获取服务器地址（优先读取用户保存的） */
export async function getServerUrl(): Promise<string> {
  if (cachedServerUrl) return cachedServerUrl;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    cachedServerUrl = saved || DEFAULT_SERVER_URL;
    return cachedServerUrl;
  } catch {
    return DEFAULT_SERVER_URL;
  }
}

/** 同步获取服务器地址（用于 UI 显示，可能返回默认值） */
export function getServerUrlSync(): string {
  return cachedServerUrl || DEFAULT_SERVER_URL;
}

/** 保存服务器地址 */
export async function setServerUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  cachedServerUrl = trimmed;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    // ignore storage errors
  }
}

/** 重置为默认地址 */
export async function resetServerUrl(): Promise<void> {
  cachedServerUrl = DEFAULT_SERVER_URL;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
