// 统一配置常量（合并原 config.ts + env.ts）
// 服务端地址：Web 预览默认 localhost，真机需改为局域网 IP，生产部署改为域名
// 可通过环境变量 EXPO_PUBLIC_SERVER_URL 覆盖

export const SERVER_URL =
  (typeof globalThis !== 'undefined' && (globalThis as any).__SERVER_URL__) ||
  (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_SERVER_URL) ||
  'http://localhost:4000';

export const MEDIA_URL = SERVER_URL;
