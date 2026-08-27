# BodyDataApp（身体数据记录）

一个**移动端身体/健身数据记录器**：本地优先、多用户、可云同步，同一套代码同时支持 Android / iOS / Web。

> 当前定位：**数据记录器**。只负责把身体围度、饮食、运动、睡眠等数据如实记录、统计并同步到自建后台；训练计划、动作引导、提醒、AI 等“助手”能力暂不开发，后续按需求再评估。

## 技术栈

- 客户端：裸 React Native 0.79.2 + React 19 + react-navigation（原生用 Metro，Web 用 webpack 打 `react-native-web`）
- 数据：本地 SQLite（原生 `@op-engineering/op-sqlite`，Web `sql.js`）+ AsyncStorage 会话
- 服务端：Node ≥ 22.5 + Express + JWT + `node:sqlite`（多用户、数据同步、托管动作 GIF）
- 管理后台：`admin/`（React 18 + Vite + recharts）

## 环境要求

- Node.js ≥ 22.5（服务端用到内置 `node:sqlite`）
- 原生端另需 Android Studio/JDK 17（Android）或 Xcode + CocoaPods（iOS）

## 快捷运行（PC 上预览，推荐 Web 端）

**一键启动(推荐)**：

```bash
npm run dev
```

`npm run dev` 会一起启动后端(4000)与 Web 预览(8082)，并把两个进程的输出加上 `[server]`/`[web]` 前缀。已在运行的端口会被自动复用、跳过启动。没有重复占用时再按需用命令：

```bash
npm run server   # 仅后(端口 4000，认证/同步/GIF 动图)
npm run web      # 仅 Web 预览(端口 8082)
```

浏览器打开 <http://localhost:8082> 即可看到应用。默认请求 `http://localhost:4000`，登录、同步、动作 GIF 均可正常使用。

### 原生端（可选）

原生目录 `android/`、`ios/` 默认未入库（见 `.gitignore`），首次需要生成：

```bash
npm run init:native   # 会打印生成原生目录的命令，按提示执行
npm run android       # 或 npm run ios
```

## 最适配移动端的预览方法（在电脑上）

这套代码已内置响应式：视口宽度 `≤480px` 走 `compact` 紧凑尺度，`481–768px` 走 `medium`，`>768px` 走 `regular`。所以**在电脑上把浏览器窗口缩成手机宽度即可**，最贴近真机效果：

1. 打开 DevTools（F12）→ 右上角切换到**设备工具栏**。
2. 选一个手机机型，例如 **iPhone 12/13/14（390×844）** 或 **Pixel 5（393×851）**，并保持**竖屏**。
3. 刷新页面。此时应用会自动进入紧凑布局（更小的字号/间距/圆角），底部 Tab 也更紧凑，模拟真机手感。
4. 若你要看动图或同步数据，保持后端 `npm run server` 运行即可。

> 提示：真机上动图/同步需要把 `SERVER_URL` 指向电脑局域网 IP（如 `http://192.168.1.100:4000`），而不是 `localhost`。

## 动作动图说明

动作演示 GIF **不走离线打包**（以减小 APK 体积），而是运行时从后端加载：`${SERVER_URL}/videos/<mediaId>.gif`。GIF 文件存放在 `scripts/videos/`，由后端静态托管。若后端未启动或文件缺失，界面显示“暂无动图”占位，不影响其他功能。

## 常用脚本

```bash
npm run typecheck   # TypeScript 严格类型检查
npm run web:build   # 生产构建 Web（输出到 dist/）
npm run build:apk   # 生成 Android 安装包
npm run admin:dev   # 管理后台开发
```

## 目录速览

```
src/          客户端源码（screens / components / database / navigation …）
server/       自建后端（Express + sqlite）
admin/        数据管理后台（Vite）
assets/       动作库 JSON、部位图标、字体
scripts/      原生目录初始化、GIF 静态资源等服务脚本
deploy/       部署配置（nginx / pm2 / 打包说明）
```
