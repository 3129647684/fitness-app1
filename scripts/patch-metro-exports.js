const fs = require('fs');
const path = require('path');

const METRO_PACKAGES = [
  'metro',
  'metro-cache',
  'metro-cache-key',
  'metro-config',
  'metro-core',
  'metro-minify-terser',
  'metro-minify-uglify',
  'metro-react-native-babel-preset',
  'metro-react-native-babel-transformer',
  'metro-resolver',
  'metro-runtime',
  'metro-source-map',
  'metro-symbolicate',
  'metro-transform-plugins',
  'metro-transform-worker',
  'metro-file-map',
  'metro-hermes-compiler',
];

let patchedCount = 0;

for (const pkg of METRO_PACKAGES) {
  const pkgPath = path.join(__dirname, '..', 'node_modules', pkg, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;

  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (!pkgJson.exports) continue;

  let modified = false;
  if (!pkgJson.exports['./src/*']) {
    pkgJson.exports['./src/*'] = './src/*.js';
    modified = true;
  }
  if (!pkgJson.exports['./src/*.js']) {
    pkgJson.exports['./src/*.js'] = './src/*.js';
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8');
    console.log(`[patch-metro-exports] Patched: ${pkg}`);
    patchedCount++;
  }
}

console.log(`[patch-metro-exports] Done! Patched ${patchedCount} packages.`);
