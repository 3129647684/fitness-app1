# BodyDataApp - 极简身体数据记录

一款专注核心指标的身体数据记录应用，本地优先，支持多端同步。

## 功能特性

- **5 个核心指标**：体重、BMI（自动计算）、体脂率、腰围、睡眠时长
- **本地优先**：数据存储在设备本地 SQLite，离线可用
- **多端同步**：全量快照云端备份，支持 Android / iOS / Web
- **3 Tab 极简导航**：首页 / 记录 / 我的（含历史记录 + 趋势图表 + 设置）
- **管理后台**：用户管理、数据统计、CSV 导出

## 技术栈

| 层级 | 技术 |
|------|------|
| 客户端 | React Native 0.79 + React 19 + react-navigation |
| 数据层 | op-sqlite（原生）/ sql.js（Web）双驱动 |
| 服务端 | Node ≥22.5 + Express + JWT + node:sqlite |
| 管理后台 | React 18 + Vite + recharts |
| 工程化 | TypeScript + ESLint + Prettier + GitHub Actions |

## 项目结构

```
├── src/                    # 客户端源码
│   ├── api/client.ts       # 统一 API 客户端
│   ├── components/         # 通用组件
│   ├── constants/          # 配置常量
│   ├── database/           # 数据层（db/sync/session/types/migrations）
│   ├── hooks/              # 自定义 Hooks
│   ├── navigation/         # 导航（3 Tab）
│   ├── screens/            # 页面（Home/Record/Settings/Login）
│   └── utils/              # 工具函数
├── server/                 # 服务端（模块化）
│   ├── index.js            # 入口
│   ├── config.js           # 配置（JWT_SECRET 强制环境变量）
│   ├── db.js               # 数据库初始化
│   ├── middleware/auth.js  # 认证中间件
│   ├── routes/             # 路由（auth/sync/admin/stats）
│   └── utils/password.js   # 密码哈希
├── admin/                  # 管理后台
├── deploy/                 # 部署配置（nginx + pm2）
└── .github/workflows/      # CI 流水线
```

## 快速开始

### 客户端

```bash
# 安装依赖
npm install

# Web 开发
npm run web

# 类型检查
npm run typecheck

# 代码规范检查
npm run lint
```

### 服务端

```bash
cd server
npm install

# 配置环境变量（必须）
cp ../.env.example .env
# 编辑 .env，设置 JWT_SECRET

# 启动
npm start
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `JWT_SECRET` | ✅ | JWT 签名密钥，至少 32 位随机字符串 |
| `PORT` | ❌ | 服务端口，默认 4000 |
| `CORS_ORIGIN` | ❌ | CORS 白名单，默认 `*`（生产建议限制） |
| `ADMIN_USERNAME` | ❌ | 管理员用户名，默认 admin |
| `ADMIN_PASSWORD` | ❌ | 管理员密码，不设置则首次启动随机生成 |

> **安全提醒**：`JWT_SECRET` 未设置时服务启动会直接失败，切勿使用默认值。

## 安全特性

- JWT 密钥强制环境变量，无硬编码兜底
- 管理员密码可配置或首次随机生成
- 登录接口限流（5 次/分钟/IP）
- CORS 白名单可配置
- 密码 scrypt 哈希 + timingSafeEqual 防时序攻击
- SQL 全部参数化，无注入风险
- 请求体大小限制（10MB）
- HTTPS 部署模板（nginx）

## 部署

参考 `deploy/` 目录：
- `nginx.conf.template`：Nginx HTTPS 反向代理配置
- `ecosystem.config.js`：PM2 进程管理配置

## 许可证

MIT
