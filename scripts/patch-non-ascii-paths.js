const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'dev-server', 'createMetroMiddleware.js');

function patch() {
  if (!fs.existsSync(TARGET_FILE)) {
    console.log('[patch-non-ascii-paths] Target file not found, skipping');
    return;
  }

  let content = fs.readFileSync(TARGET_FILE, 'utf-8');
  const oldLine = "res.setHeader('X-React-Native-Project-Root', metroConfig.projectRoot)";
  const newLine = "res.setHeader('X-React-Native-Project-Root', encodeURI(metroConfig.projectRoot))";

  if (content.includes(newLine)) {
    console.log('[patch-non-ascii-paths] Already patched, skipping');
    return;
  }

  if (!content.includes(oldLine)) {
    console.log('[patch-non-ascii-paths] Target line not found, skipping');
    return;
  }

  content = content.replace(oldLine, newLine);
  fs.writeFileSync(TARGET_FILE, content, 'utf-8');
  console.log('[patch-non-ascii-paths] Patched createMetroMiddleware.js');
}

patch();
