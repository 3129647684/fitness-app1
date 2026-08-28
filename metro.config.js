const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.unshift(
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
);

module.exports = config;
