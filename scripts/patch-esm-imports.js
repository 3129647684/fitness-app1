const fs = require('fs');
const path = require('path');

const PACKAGES_TO_PATCH = [
  'expo-sharing',
  'expo-document-picker',
  'expo-haptics',
  'expo-notifications',
  'expo-sqlite',
  'expo-file-system',
  'expo-status-bar',
  'expo-constants',
  'expo-linking',
];

function findJsFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsFiles(fullPath));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
      results.push(fullPath);
    }
  }
  return results;
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  const exportRegex = /export\s+.*from\s+['"](\.\.?\/[^'"]+)['"]/g;
  const dynamicImportRegex = /import\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;

  function replacer(match, importPath) {
    const ext = path.extname(importPath);
    if (ext) return match;

    const dir = path.dirname(filePath);
    const candidates = [
      importPath + '.js',
      importPath + '.mjs',
      importPath + '.json',
      path.join(importPath, 'index.js'),
    ];

    for (const candidate of candidates) {
      const candidatePath = path.join(dir, candidate);
      if (fs.existsSync(candidatePath)) {
        modified = true;
        return match.replace(importPath, candidate);
      }
    }
    return match;
  }

  content = content.replace(importRegex, replacer);
  content = content.replace(exportRegex, replacer);
  content = content.replace(dynamicImportRegex, replacer);

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[patch-esm-imports] Patched: ${filePath}`);
  }
  return modified;
}

let patchedCount = 0;
for (const pkg of PACKAGES_TO_PATCH) {
  const pkgDirs = [
    path.join(__dirname, '..', 'node_modules', pkg, 'build'),
    path.join(__dirname, '..', 'node_modules', pkg),
  ];

  for (const pkgDir of pkgDirs) {
    if (!fs.existsSync(pkgDir)) continue;
    const files = findJsFiles(pkgDir);
    for (const file of files) {
      if (patchFile(file)) {
        patchedCount++;
      }
    }
  }
}

const expoModulesCoreDir = path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', 'expo-modules-core', 'build');
if (fs.existsSync(expoModulesCoreDir)) {
  const files = findJsFiles(expoModulesCoreDir);
  for (const file of files) {
    if (patchFile(file)) {
      patchedCount++;
    }
  }
}

console.log(`[patch-esm-imports] Done! Patched ${patchedCount} files.`);
