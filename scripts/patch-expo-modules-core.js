const fs = require('fs');
const path = require('path');

const ESMC_PATH = path.join(__dirname, '..', 'node_modules', 'expo-modules-core');
const NESTED_ESMC = path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', 'expo-modules-core');

function findExpoModulesCore() {
  if (fs.existsSync(path.join(ESMC_PATH, 'src', 'index.ts'))) {
    return ESMC_PATH;
  }
  if (fs.existsSync(path.join(NESTED_ESMC, 'src', 'index.ts'))) {
    return NESTED_ESMC;
  }
  return null;
}

function patchPackage(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  if (pkg.main === 'build/index.js') {
    return false;
  }
  pkg.main = 'build/index.js';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('[patch-expo-modules-core] Patched main field to build/index.js');
  return true;
}

async function compileWithEsbuild(pkgDir) {
  const esbuildPath = path.join(__dirname, '..', 'node_modules', 'esbuild');
  const esbuild = require(esbuildPath);
  const srcPath = path.join(pkgDir, 'src', 'index.ts');
  const source = fs.readFileSync(srcPath, 'utf-8');

  const buildDir = path.join(pkgDir, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  console.log('[patch-expo-modules-core] Compiling TypeScript to JavaScript...');
  await esbuild.build({
    stdin: { contents: source, resolveDir: path.dirname(srcPath), loader: 'ts' },
    bundle: true,
    outfile: path.join(pkgDir, 'build', 'index.js'),
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external: ['react-native', 'react', 'expo', 'expo-modules-autolinking', '@expo/cli', 'invariant', 'abort-controller'],
    logLevel: 'info',
  });

  if (fs.existsSync(path.join(pkgDir, 'build', 'index.js'))) {
    console.log('[patch-expo-modules-core] Compilation successful! build/index.js created.');
  } else {
    throw new Error('esbuild.build completed but build/index.js was not created');
  }
}

async function main() {
  console.log('[patch-expo-modules-core] Starting patch...');

  const pkgDir = findExpoModulesCore();
  if (!pkgDir) {
    console.log('[patch-expo-modules-core] expo-modules-core not found, skipping');
    return;
  }

  console.log(`[patch-expo-modules-core] Found at: ${pkgDir}`);

  const pkgPath = path.join(pkgDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  if (pkg.main && pkg.main.endsWith('.ts')) {
    await compileWithEsbuild(pkgDir);
    patchPackage(pkgPath);

    if (pkgDir !== ESMC_PATH && !fs.existsSync(ESMC_PATH)) {
      try {
        fs.symlinkSync(pkgDir, ESMC_PATH, 'junction');
        console.log('[patch-expo-modules-core] Created junction link at top level');
      } catch (e) {
        console.log('[patch-expo-modules-core] Could not create junction:', e.message);
      }
    }
  } else if (pkg.main === 'build/index.js') {
    if (!fs.existsSync(path.join(pkgDir, 'build', 'index.js'))) {
      console.log('[patch-expo-modules-core] main points to build/index.js but file missing, recompiling...');
      await compileWithEsbuild(pkgDir);
    } else {
      console.log('[patch-expo-modules-core] Already patched and build exists, skipping');
    }
  } else {
    console.log('[patch-expo-modules-core] main field does not point to .ts, skipping');
  }

  console.log('[patch-expo-modules-core] Done!');
}

main().catch(err => {
  console.error('[patch-expo-modules-core] Error:', err.message);
  process.exit(1);
});
