const path = require('path');

module.exports = function (api) {
  const isNative = api.caller(
    (caller) => !!caller && (caller.name === 'metro' || caller.name === 'metro-babel-transformer')
  );

  if (isNative) {
    // Metro / Native 侧：官方 RN 0.79+ 预设（替代旧 metro-react-native-babel-preset）
    return {
      presets: ['module:@react-native/babel-preset'],
      plugins: [
        [
          'module-resolver',
          {
            root: ['./'],
            alias: {
              '@': './src',
            },
            extensions: ['.native.tsx', '.native.ts', '.tsx', '.ts', '.jsx', '.js'],
          },
        ],
        'react-native-reanimated/plugin',
      ],
      sourceMaps: true,
    };
  }

  // Webpack 侧：不用 metro 预设，使用通用 preset-env + typescript + react-native-web 插件
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return {
    presets: [
      ['@babel/preset-env', { targets: { browsers: 'last 2 versions' }, useBuiltIns: 'entry', corejs: false, modules: false }],
      ['@babel/preset-react', { runtime: 'automatic' }],
      ['@babel/preset-typescript', { isTSX: true, allExtensions: true, onlyRemoveTypeImports: true }],
    ],
    plugins: [
      'react-native-web',
      '@babel/plugin-transform-runtime',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': path.resolve(__dirname, './src'),
            'react-native$': 'react-native-web',
          },
          extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.web.js', '.jsx', '.js'],
        },
      ],
      isDevelopment && ['react-refresh/babel', { skipEnvCheck: true }],
    ].filter(Boolean),
    sourceMaps: true,
  };
};