// 登录态管理：Session 持久化到 AsyncStorage，并缓存内存副本以便同步访问
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionUser {
  id: number;
  username: string;
  nickname?: string | null;
}

export interface Session {
  token: string;
  user: SessionUser;
}

const KEY = 'bodydata.session.v1';
let cached: Session | null = null;

export async function loadSession(): Promise<Session | null> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}
  return cached;
}

export async function saveSession(session: Session): Promise<void> {
  cached = session;
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  cached = null;
  await AsyncStorage.removeItem(KEY);
}

export async function getToken(): Promise<string | null> {
  const s = await loadSession();
  return s?.token ?? null;
}

export function getCachedUser(): SessionUser | null {
  return cached?.user ?? null;
}

export async function getCurrentUserId(): Promise<number | null> {
  const s = await loadSession();
  return s?.user.id ?? null;
}