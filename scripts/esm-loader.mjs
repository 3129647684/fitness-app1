import { existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, extname } from 'path';

function tryResolveWithExtension(specifier, parentURL) {
  if (!specifier.startsWith('.') || extname(specifier)) {
    return null;
  }
  if (!parentURL) return null;

  const dir = dirname(fileURLToPath(parentURL));

  const candidates = [
    join(dir, specifier + '.js'),
    join(dir, specifier + '.mjs'),
    join(dir, specifier, 'index.js'),
    join(dir, specifier + '.json'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const resolved = tryResolveWithExtension(specifier, context.parentURL);
  if (resolved) {
    return {
      url: resolved,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
