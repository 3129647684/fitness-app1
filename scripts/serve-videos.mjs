import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'videos');
const PORT = Number(process.env.PORT || 3000);
const UPSTREAM = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/';

fs.mkdirSync(CACHE_DIR, { recursive: true });

function download(url, dest, cb) {
  const tmp = dest + '.part';
  const file = fs.createWriteStream(tmp);
  const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode !== 200) {
      file.destroy();
      fs.unlink(tmp, () => {});
      return cb(new Error('上游返回 ' + res.statusCode));
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        fs.rename(tmp, dest, (e) => cb(e));
      });
    });
  });
  req.on('error', (e) => { file.destroy(); fs.unlink(tmp, () => {}); cb(e); });
  file.on('error', (e) => { file.destroy(); fs.unlink(tmp, () => {}); cb(e); });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'max-age=31536000, immutable');

  const url = req.url || '/';
  if (url === '/' || url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('gif-server ok\n');
    return;
  }

  const m = url.match(/^\/videos\/([A-Za-z0-9_\-\.]+\.gif)$/i);
  if (!m) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found\n');
    return;
  }
  const name = m[1];
  const local = path.join(CACHE_DIR, name);

  if (fs.existsSync(local)) {
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    fs.createReadStream(local).pipe(res);
    return;
  }

  download(UPSTREAM + name, local, (err) => {
    if (err || !fs.existsSync(local)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('gif fetch failed: ' + (err ? err.message : name) + '\n');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    fs.createReadStream(local).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[gif-server] listening on http://0.0.0.0:${PORT} (local cache: ${CACHE_DIR})`);
});