export const SERVER_URL =
  (typeof globalThis !== 'undefined' && (globalThis as any).__SERVER_URL__) ||
  (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_SERVER_URL) ||
  'http://localhost:4000';

export const MEDIA_URL = SERVER_URL;
