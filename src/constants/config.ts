// 自建后端服务地址
// - Web 预览：http://localhost:4000
// - 手机真机（同一局域网）：改为电脑局域网 IP，如 http://192.168.1.100:4000
// - 生产部署：改为部署域名
// 也可通过环境变量 EXPO_PUBLIC_SERVER_URL 覆盖（.env 或启动命令）
export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';

// 动图地址：后端同时托管动作 GIF（/videos/*.gif 静态资源）
export const MEDIA_URL = SERVER_URL;