import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCurrentUserId } from './db';

export interface SessionUser {
  id: number;
  username: string;
  nickname?: string | null;
}

interface SessionState {
  user: SessionUser | null;
  token: string | null;
  _hydrated: boolean;

  login: (user: SessionUser, token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'bodydata.session.v1';

const rawUseSessionStore = create<SessionState>()(
  persist(
    (set: any, get: any) => ({
      user: null,
      token: null,
      _hydrated: false,

      login: (user: SessionUser, token: string) => {
        set({ user, token });
        setCurrentUserId(user.id);
      },

      logout: () => {
        set({ user: null, token: null });
        setCurrentUserId(0);
      },

      hydrate: async () => {
        if (get()._hydrated) return;
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { state?: { user?: SessionUser | null; token?: string | null } };
            const u = parsed?.state?.user ?? null;
            const t = parsed?.state?.token ?? null;
            set({ user: u ?? null, token: t ?? null, _hydrated: true });
            if (u) {
              setCurrentUserId(u.id);
            }
          } else {
            set({ _hydrated: true });
          }
        } catch (e) {
          console.warn('[session] hydrate failed', e);
          set({ _hydrated: true });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage as any),
      partialize: (state: any) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state: any) => {
        if (state) {
          state._hydrated = true;
          if (state.user) {
            setCurrentUserId(state.user.id);
          }
        }
      },
    }
  )
);

export const useSessionStore = rawUseSessionStore;

// ── 向后兼容 API（旧代码调用方） ──
export async function loadSession(): Promise<{ token: string; user: SessionUser } | null> {
  await rawUseSessionStore.getState().hydrate();
  const s = rawUseSessionStore.getState();
  if (s.token && s.user) return { token: s.token, user: s.user };
  return null;
}

export async function saveSession(session: { token: string; user: SessionUser }): Promise<void> {
  rawUseSessionStore.getState().login(session.user, session.token);
}

export async function clearSession(): Promise<void> {
  rawUseSessionStore.getState().logout();
}

export async function getToken(): Promise<string | null> {
  await rawUseSessionStore.getState().hydrate();
  return rawUseSessionStore.getState().token ?? null;
}

export function getCachedUser(): SessionUser | null {
  return rawUseSessionStore.getState().user ?? null;
}

export async function getCurrentUserId(): Promise<number | null> {
  await rawUseSessionStore.getState().hydrate();
  return rawUseSessionStore.getState().user?.id ?? null;
}
