// 一键开发预览：并行启动后端(server) + Web 预览(webpack dev server)
// 用法：npm run dev  |  Ctrl+C 退出
// 已占用的端口会被自动复用（检测到即跳过启动），只启动空闲的服务。
import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';

const COLORS = {
  server: '\x1b[32m',
  web: '\x1b[96m',
  info: '\x1b[2m',
  warn: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const PORT = { server: 4000, web: 8082 };
const children = [];
let shuttingDown = false;

function log(tag, chunk) {
  const color = COLORS[tag] || COLORS.reset;
  String(chunk)
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => process.stdout.write(`${color}[${tag}]${COLORS.reset} ${line}\n`));
}

function line(text) {
  process.stdout.write(`${text}\n`);
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    // 用「主动连接」判断是否有服务在监听（比监听式更可靠，兼容 IPv4/IPv6）
    const socket = net.connect({ port, host: '127.0.0.1', timeout: 500 });
    const done = (busy) => {
      socket.destroy();
      resolve(busy);
    };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

function killTree(child) {
  if (!child || child.killed) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

function spawnChild(tag, name, args) {
  const child = spawn(name, args, { shell: true, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.on('data', (d) => log(tag, d));
  child.stderr.on('data', (d) => log(tag, d));
  child.on('exit', (code) => {
    if (!shuttingDown) line(`${COLORS.bold}${tag}${COLORS.reset} 已退出（code=${code}）`);
  });
  children.push(child);
  return child;
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  line(`\n${COLORS.bold}收到 ${signal}，正在关闭…${COLORS.reset}`);
  children.forEach(killTree);
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

line(`${COLORS.bold}
  BodyDataApp 一键开发预览
  web   : http://localhost:8082
  api   : http://localhost:4000
  Ctrl+C 退出
${COLORS.reset}`);

const [serverBusy, webBusy] = await Promise.all([isPortInUse(PORT.server), isPortInUse(PORT.web)]);

if (serverBusy) {
  line(`${COLORS.warn}[server]${COLORS.reset} 端口 ${PORT.server} 已被占用 → 复用已运行的后端（跳过启动）`);
} else {
  line(`${COLORS.info}[server]${COLORS.reset} 端口 ${PORT.server} 空闲 → 启动后端`);
  spawnChild('server', 'npm run server');
}

if (webBusy) {
  line(`${COLORS.warn}[web]${COLORS.reset} 端口 ${PORT.web} 已被占用 → 复用已运行的 Web 预览（跳过启动）`);
} else {
  line(`${COLORS.info}[web]${COLORS.reset} 端口 ${PORT.web} 空闲 → 启动 Web 预览`);
  spawnChild('web', 'npm run web');
}

if (serverBusy && webBusy) {
  line(`${COLORS.bold}后端与 Web 预览均已运行，无需重复启动。${COLORS.reset}`);
  process.exit(0);
}

if (children.length === 0) process.exit(0);
